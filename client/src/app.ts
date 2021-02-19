#!/usr/bin/env node

import { existsSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { join } from 'path';
import * as rimraf from 'rimraf';

import { Route } from './models/route';
import { ProjectConfig } from './models/project-config';
import { AppArgs } from './models/args';
import { Result } from './models/screenshot-result';
import { Framework, ParserConfig } from './models/parser';
import { Browser } from './browser';
import { URLParser } from './url-parser';
import { FrameworkParser } from './framework-parser';
import { HttpClient } from './http-client';
import { exitWithError, getArgs, openBrowserTo, xhrGet } from './util';
import { UserToken } from './models/user-token';
import { User } from './models/user';
import { GitInfo } from './models/git-info';
import { RunThrough } from './models/run-through';

console.time('run');

class App {
  private projectConfig: ProjectConfig;
  private httpClient = new HttpClient(ProjectConfig.apiURL);

  constructor(private args: Partial<AppArgs>) {}

  /**
   * Look for an emtrey project config file in the source directory.
   */
  private async readProjectConfig(projectUrl: string): Promise<ProjectConfig> {
    const file = `${projectUrl}/emtrey.config.js`;
    let config: ProjectConfig;
    try {
      const fileContent = require(file);
      config = ProjectConfig.fromFile(fileContent);
      // console.log('app : loaded project config :', config);
    } catch (err) {
      config = ProjectConfig.createBlank();
      console.log(`app : could not load project config at ${file}`);
    }
    return config;
  }

  /**
   * Confirm app is online by hitting sample URL.
   */
  private async confirmProjectIsRunning(serverUrl: string, route: Route) {
    const sampleRoute = route.getFullUrl(serverUrl);
    try {
      await xhrGet(sampleRoute);
    } catch (err) {
      exitWithError(
        `Check application connection, bad response from url: ${sampleRoute}`,
      );
    }
  }

  /**
   * Sniff project framework, file extension, etc.
   */
  private async getParserConfig(): Promise<ParserConfig> {
    const frameworkParser = new FrameworkParser(this.args.dir!);
    const [framework, extension] = await Promise.all([
      frameworkParser.getFramework(),
      frameworkParser.getExtension(),
    ]);
    const parserConfig: ParserConfig = {
      framework,
      extension,
    };
    console.log('app : parser framework :', Framework[framework]);
    console.log('app : parser extension :', extension);
    return parserConfig;
  }

  /**
   * Get user from cache or create new.
   */
  private async initializeUserToken() {
    let sessionToken: string;
    let userToken = await UserToken.readUserFromFS();

    if (!userToken) {
      console.log('auth : no user token, creating one...');
      // User token is not cached on fs, create one...
      sessionToken = await this.httpClient.generateAndSetSessionToken();
      console.log('auth : got session token :', sessionToken);

      // Then let user login manually via web app
      const user = await this.authorizeUser(sessionToken);
      console.log('auth : authorized user :', user);

      // Save user token for future runs
      await UserToken.saveToFS(user, sessionToken);
      console.log('auth : user token saved');
    } else {
      // Use token from user file
      console.log('auth : got cached user :', userToken);
      const { token } = userToken;
      if (!token) {
        exitWithError('Invalid user token!');
      }
      sessionToken = token;
    }
    return userToken;
  }

  /**
   * Gather all routes and navigate to URLs to take screenshots.
   */
  public async run() {
    // Do all user stuff first
    await this.initializeUserToken();

    process.exit();

    await this.submitResults({} as any);

    return setTimeout(() => process.exit(), 2000);

    // Get parser config from user's project
    let parserConfig: ParserConfig;

    try {
      parserConfig = await this.getParserConfig();
    } catch (err) {
      exitWithError(`Could not locate parser config, error: ${err}`);
    }

    // Get emtrey config from user's project
    const projectConfig = await this.readProjectConfig(this.args.dir!);
    this.setProjectConfig(projectConfig);

    // Sniff out all project routes based on config
    const routes = await new URLParser(parserConfig!).getRoutes(this.args.dir!);

    // Check localhost. @todo: Support skipping this.
    await this.confirmProjectIsRunning(this.args.url!, routes[0]);

    // Prepare fs if project has config
    const path = await this.prepareScreenshotDirectory(this.args.dir!);

    // Browse to routes and execute plugins
    const browser = new Browser();
    const results = await browser.visitRoutes(
      routes,
      this.args.url!,
      path,
      projectConfig,
    );

    console.log('app : run : final results :');
    console.log(results);

    // Send data to API
    try {
      await this.submitResults({ results, framework: parserConfig!.framework });
    } catch (err) {
      console.log('app : error');
    }

    // Cleanup local fs
    try {
      await this.cleanup(path);
    } catch (err) {
      console.error('app : cleanup error');
    }

    console.timeEnd('run');
  }

  private setProjectConfig(config: ProjectConfig) {
    this.projectConfig = config;
  }

  /**
   * Remove any old screenshots, create directory to house images.
   */
  private async prepareScreenshotDirectory(dir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const path = join(dir, this.projectConfig.outputDirectory);
      if (!existsSync(path)) {
        console.log('app : creating screenshot directory :', path);
        try {
          mkdirSync(path);
        } catch (err) {
          reject(err);
        }
        resolve(path);
      } else {
        // If you want to skip emptying the dir
        // resolve(path);
        rimraf.default(`${path}/*`, {}, err => {
          if (err) {
            return reject(err);
          }
          // console.log('app : screenshot directory emptied :', path);
          resolve(path);
        });
      }
    });
  }

  /**
   * Empty temp dir.
   */
  private async cleanup(dir: string) {
    // Disabled for dev
    return Promise.resolve(null);
    // return new Promise((resolve, reject) => {
    //   console.log('app : cleaning up dir :', dir);
    //   rmdir(dir, { recursive: true }, err => {
    //     if (err) {
    //       return reject(err);
    //     }
    //     resolve(null);
    //   });
    // });
  }

  /**
   * Execute git command in project directory to get current branch and commit hash.
   */
  private getGitInfo(): Promise<GitInfo | string> {
    return new Promise((resolve, reject) => {
      console.time('git info');
      exec(
        'git rev-parse --abbrev-ref HEAD && git rev-parse HEAD',
        {
          cwd: this.args.dir,
        },
        (err: Error, stdout: string, stderr: string) => {
          console.timeEnd('git info');
          if (err || stderr) {
            // Git may not be initialized, or no commit exists.
            reject(err.message || stderr);
          }
          const info = stdout.trim().split('\n') as GitInfo;
          // console.log('app : got git info :', info);
          resolve(info);
        },
      );
    });
  }

  /**
   * Launch user's web browser to finalize user auth.
   * @example:
   * https://app-dev.emtrey.io/login?api_session_token=uV_aeGoSOAiOxTMr01j82mjrCEolEwY9-q1eTLI2bcU9UTo0_EDcQ4wmDny4
   */
  private async authorizeUser(sessionToken: string): Promise<User> {
    const url = `https://${ProjectConfig.apiURL}/api-login?api_session_token=${sessionToken}`;
    openBrowserTo(url);
    return new Promise(resolve => {
      let authTries = 1;
      let user: User | null;
      const getUserInterval = setInterval(async () => {
        console.log(`auth : checking (${authTries}) ...`);
        try {
          user = await this.httpClient.getUser();
          if (user) {
            resolve(user);
            clearInterval(getUserInterval);
          }
        } catch (err) {
          console.log('auth : ', err);
          // reject(err); clearInterval(getUserInterval);
        }
        if (authTries > 19) {
          exitWithError('Too many authorization attempts');
        }
        authTries += 1;
      }, 6000);
    });
  }

  /**
   * Submits results to API in multiple steps.
   */
  private async submitResults(data: {
    results: Result;
    framework: Framework;
  }): Promise<unknown> {
    console.log('app : submit results :', data);

    // Start with posting run through result to project
    let runThroughResult: RunThrough;

    try {
      const [branch, commit] = await this.getGitInfo();
      // @todo: Where do we get project id?
      const runThroughParams = { branch, commit, project_id: 2 };
      // console.log(runThroughParams);
      runThroughResult = await this.httpClient.postRunThrough(runThroughParams);
      // console.log(runThroughResult);
    } catch (err) {
      exitWithError(err);
    }

    // Upload images from fs

    return null;
  }
}

new App(getArgs()).run();
