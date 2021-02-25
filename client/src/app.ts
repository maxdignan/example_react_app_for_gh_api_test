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
import { PageCapture } from './models/page-capture';
import { PluginResult } from './models/plugin';
import { PageScreenshotPluginResult } from './plugins';

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
      this.httpClient.setToken(sessionToken);
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
      this.httpClient.setToken(sessionToken);
    }

    return userToken;
  }

  /**
   * Gather all routes and navigate to URLs to take screenshots.
   */
  public async run() {
    // Do all user stuff first
    await this.initializeUserToken();

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

    // Check user's project is running locally
    await this.confirmProjectIsRunning(this.args.url!, routes[0]);

    // Prepare fs if project has config
    const path = await this.prepareScreenshotDirectory(this.args.dir!);

    // Browse to routes and execute plugins
    const results = await new Browser().visitRoutes(
      routes,
      this.args.url!,
      path,
      projectConfig,
    );

    // Send data to API
    await this.submitResults(results);

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
  private async submitResults(data: Result): Promise<unknown> {
    console.log(`app : submit ${data.results.length} results`);

    // Start with posting run through result to project
    let runThroughResult: RunThrough;

    try {
      const [branch, commit] = await this.getGitInfo();
      // @todo: Where do we get project id?
      // @todo: Remove hard code branch of `master`
      const runThroughParams = {
        branch: 'master',
        commit,
        project_id: 36,
      };
      runThroughResult = await this.httpClient.postRunThrough(runThroughParams);
      console.log('app : results : submitted run through :', runThroughResult);
    } catch (err) {
      exitWithError(err);
    }

    // Once a run through identifier is obtained
    // loop through results and post each to API

    for (const result of data.results) {
      console.log('\n\n', 'app : result :', result, '\n\n');

      const { data } = result.plugins.find(
        p => p.pluginId === 10,
      ) as PluginResult<string>;

      const pageCaptureParams = {
        page_route: result.url,
        page_title: data, // Required by have content by API
        // run_through_id: runThroughResult!.id,
        run_through_id: 48,
      };

      // console.log('app : results : page capture params :', pageCaptureParams);

      let pageCapture: PageCapture;

      try {
        pageCapture = await this.httpClient.postPageCapture(pageCaptureParams);
        console.log('app : results : submitted page capture :', pageCapture);
        const { data } = result.plugins.find(
          p => p.pluginId === 30,
        ) as PluginResult<PageScreenshotPluginResult>;

        if (!data) {
          exitWithError('Failed to find page screen shot plugin');
        }

        await this.httpClient.postScreenshotToS3(data.path, pageCapture);
        console.log('app : results : submitted to s3');

        await this.httpClient.startDiff(pageCapture);
        console.log(
          'app : results : started diff :',
          pageCapture.page_capture.s3_object_key,
        );
      } catch (err) {
        exitWithError(err);
      }
    }

    return null;
  }
}

new App(getArgs()).run();
