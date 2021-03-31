#!/usr/bin/env node

import { existsSync, mkdirSync, readFile } from 'fs';
import { exec } from 'child_process';
import { join } from 'path';
import * as rimraf from 'rimraf';

import { Route } from './models/route';
import { ProjectConfig } from './models/project-config';
import { AppArgs, getArgFor } from './models/args';
import { Result } from './models/screenshot-result';
import { ParserConfig } from './models/parser';
import { Browser } from './browser';
import { URLParser } from './url-parser';
import { FrameworkParser } from './framework-parser';
import { HttpClient } from './http-client';
import { exitWithError, getArgs, openBrowserTo, xhrGet } from './util';
import { UserToken } from './models/user-token';
import { Organization } from './models/organization';
import { User } from './models/user';
import { GitInfo } from './models/git-info';
import { RunThrough } from './models/run-through';
import { PageCapture } from './models/page-capture';
import { PluginResult } from './models/plugin';
import {
  PageScreenShotPlugin,
  PageScreenshotPluginResult,
  PageTitlePlugin,
} from './plugins';
import { Logger } from './logger';

console.time('run');

class App {
  static isDryRun = process.env.DRY_RUN ? !!+process.env.DRY_RUN : false;
  static isDebug = process.env.DEBUG ? !!+process.env.DEBUG : false;
  private projectConfig: ProjectConfig;
  private httpClient = new HttpClient();
  private logger: Logger = new Logger(App.isDebug);

  constructor(private args: Partial<AppArgs>) {
    this.validateArgs(args);
    this.logger.welcome(args);
    if (App.isDryRun) this.logger.dryRunWarning();
    this.logger.debug('app : args :', args);
  }

  private validateArgs(args: Partial<AppArgs>) {
    const url = getArgFor(args, 'url');
    const port = getArgFor(args, 'port');
    if (!url && !port) {
      const error = `Invalid arguments supplied. You must define at least a url (--url=localhost:4200) or port (--port=4200).`;
      exitWithError(error);
    }
  }

  /**
   * Look for an emtrey project config file in the source directory.
   */
  private async readProjectConfig(projectUrl: string): Promise<ProjectConfig> {
    const file = `${projectUrl}/emtrey.config.js`;
    let config: ProjectConfig;
    try {
      const fileContent = require(file);
      config = ProjectConfig.fromFile(fileContent);
      // this.logger.debug('app : loaded project config :', config);
    } catch (err) {
      config = ProjectConfig.createBlank();
      // this.logger.debug(`app : no project config at ${file}`);
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
    const frameworkParser = new FrameworkParser(this.getAppDirectory());
    const [framework, extension] = await Promise.all([
      frameworkParser.getFramework(),
      frameworkParser.getExtension(),
    ]);
    const parserConfig: ParserConfig = {
      framework,
      extension,
    };
    // this.logger.debug('app : parser framework :', Framework[framework]);
    // this.logger.debug('app : parser extension :', extension);
    return parserConfig;
  }

  /**
   * Get user from cache or create new.
   */
  private async initializeUserToken(): Promise<UserToken> {
    // UserToken.deleteUserFromFS(appDir);
    const appDir = this.getAppDirectory();

    let sessionToken: string;
    let userToken = await UserToken.readUserFromFS(appDir);

    if (!userToken) {
      this.logger.info('No auth found. Starting new session...');
      this.logger.debug('auth : no user token, creating one...');
      // User token is not cached on fs, create one...
      sessionToken = await this.httpClient.generateSessionToken();
      this.logger.info('Session started. Redirecting to Emtrey login...');
      this.logger.debug('auth : got session token :', sessionToken);

      // Cache token for API interaction
      this.httpClient.setToken(sessionToken);

      // Then let user login manually via web app
      const user = await this.authorizeUser(sessionToken);
      this.logger.debug('auth : authorized user :', user);

      let organizationId: number;
      let projectId: number;

      const hasOrganization = user.orgs.length > 0;
      const hasProjects = user.projects.length > 0;
      const appName = await this.getAppName();

      // Need to create org and projects before we continue
      if (!hasOrganization && !hasProjects) {
        this.logger.debug('auth : no organization, no projects');
        // Create users' first organization
        const organization = await this.httpClient.createOrganization({
          name: `${user.first_name} Organization`,
        });
        organizationId = organization.id;
        // Create users' first project
        const project = await this.httpClient.createProject({
          name: appName,
          github_url: null,
          org_id: organizationId,
        });
        projectId = project.id;
      } else if (
        // (!hasOrganization && hasProjects) ||
        (hasOrganization && hasProjects) ||
        (hasOrganization && !hasProjects)
      ) {
        // Take the org from the project
        let project = user.projects.find(p => p.name === appName);
        if (!project) {
          let organizationForProject: Organization;
          if (user.orgs.length > 1) {
            /** @todo: Prompt user to select organization */
            exitWithError('No organizations found, prompt user to select');
          } else {
            organizationForProject = user.orgs[0];
          }
          try {
            const newProject = await this.httpClient.createProject({
              name: appName,
              github_url: null,
              org_id: organizationForProject!.id,
            });
            this.logger.info(`Created new Emtrey project "${appName}"`);
            project = newProject;
          } catch (err) {
            exitWithError(`Error while creating new project ${appName}`);
          }
        }

        this.logger.info('Found existing project, linking now...');
        this.logger.debug('auth : using project :', project);
        organizationId = project!.org_id;
        projectId = project!.id;
      } else if (!hasOrganization && hasProjects) {
        // No organizations, but projects exist
        const project = user.projects.find(p => p.name === appName);
        if (!project) {
          exitWithError(
            'Could not find matching project to derive organization',
          );
        }
        organizationId = project!.org_id;
        projectId = project!.id;
      } else {
        exitWithError('Could not find organization for user');
      }

      this.logger.info(`Connected to Emtrey project`);

      this.logger.debug(
        'auth : organization and project :',
        organizationId!,
        projectId!,
      );

      // Save user token for future runs
      userToken = await UserToken.saveToFS(
        appDir,
        user,
        sessionToken,
        projectId!,
        organizationId!,
      );
      this.logger.info('Caching auth token');
      this.logger.debug('auth : user token saved');
    } else {
      // Use token from user file
      this.logger.info('Still signed into Emtrey. Using saved credentials...');
      this.logger.debug('auth : got cached user :', userToken);
      const { token, projectId, organizationId } = userToken!;
      if (!token || !projectId || !organizationId) {
        exitWithError('Invalid user token');
      }

      // Cache token for API interaction
      sessionToken = token;
      this.httpClient.setToken(sessionToken);
    }

    return userToken!;
  }

  /**
   * Get app directory from arguments, or fallback to current working directory.
   */
  private getAppDirectory(): string {
    const arg = getArgFor(this.args, 'dir');
    return arg ? arg : process.cwd();
  }

  private async getAppName(): Promise<string> {
    return new Promise((resolve, reject) => {
      const arg = getArgFor(this.args, 'app');
      if (arg) {
        resolve(arg);
      }
      const dir = this.getAppDirectory();
      readFile(`${dir}/package.json`, { encoding: 'utf-8' }, (err, json) => {
        if (err) {
          reject(err);
        }
        let appName: string;
        try {
          appName = JSON.parse(json).name;
        } catch (err) {
          reject(err);
        }
        resolve(appName! || 'my_emtrey_project');
      });
    });
  }

  /**
   * Gather all routes and navigate to URLs to take screenshots.
   */
  public async run() {
    // Do all user stuff first
    let token: UserToken;
    try {
      token = await this.initializeUserToken();
    } catch (err) {
      exitWithError(`Failed to initialize user ${err}`);
    }

    // Get parser config from user's project
    let parserConfig: ParserConfig;

    try {
      parserConfig = await this.getParserConfig();
    } catch (err) {
      exitWithError(`Could not locate parser config, error: ${err}`);
    }

    const appDir = this.getAppDirectory();

    // Get emtrey config from user's project
    const projectConfig = await this.readProjectConfig(appDir);
    this.setProjectConfig(projectConfig);

    // Sniff out all project routes based on config
    const routes = await new URLParser(parserConfig!).getRoutes(appDir);

    const appURL = Browser.getAppURL(this.args);

    // Check user's project is running locally
    await this.confirmProjectIsRunning(appURL, routes[0]);

    // Prepare fs if project has config
    const path = await this.prepareScreenshotDirectory(appDir);

    // Browse to routes and execute plugins
    this.logger.info('Processing discovering routes...');
    const results = await new Browser().visitRoutes(
      routes,
      appURL,
      path,
      projectConfig,
    );

    // Send data to API
    await this.submitResults(results, token!);

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
        this.logger.debug('app : creating screenshot directory :', path);
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
          cwd: this.getAppDirectory(),
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
    const url = `https://${HttpClient.apiURL}/api-login?api_session_token=${sessionToken}`;
    openBrowserTo(url);
    return new Promise(resolve => {
      let authTries = 1;
      let user: User | null;
      this.logger.startAction('Waiting for authentication...');
      const getUserInterval = setInterval(async () => {
        this.logger.debug(`auth : checking (${authTries}) ...`);
        this.logger.updateAction('...');
        try {
          user = await this.httpClient.getUser();
          if (user) {
            resolve(user);
            clearInterval(getUserInterval);
            this.logger.endAction('success!');
          }
        } catch (err) {
          console.log('auth : ', err);
          // reject(err); clearInterval(getUserInterval);
        }
        if (authTries > 19) {
          exitWithError('Too many authorization attempts');
        }
        authTries += 1;
      }, 4000);
    });
  }

  /**
   * Submits results to API in multiple steps.
   */
  private async submitResults(
    resultData: Result,
    token: UserToken,
  ): Promise<void> {
    try {
      await this.httpClient.postStyleGuide(
        token.projectId,
        resultData.styleGuide,
      );
    } catch (err) {
      console.log('app : error submitting style guide :', err);
    }

    if (App.isDryRun) {
      console.log('\n\n***********************');
      console.log('app : dry run detected');
      console.log('***********************');
      for (const result of resultData.results) {
        console.log('\napp : result :', result, '\n');
      }
      // console.log('\ncstyle guide', resultData.styleGuide);
      return;
    }

    // Start with posting run through result to project
    let runThroughResult: RunThrough;
    try {
      const [branch, commit] = await this.getGitInfo();
      const runThroughParams = {
        // API would error when branch not set to master
        // branch: 'master',
        branch,
        commit,
        project_id: token.projectId,
      };
      runThroughResult = await this.httpClient.postRunThrough(runThroughParams);
      console.log('app : results : submitted run through :', runThroughResult);
    } catch (err) {
      exitWithError(err);
    }

    // Once a run through identifier is obtained
    // loop through results and post each to API

    for (const result of resultData.results) {
      // console.log('\n\n', 'app : result :', result, '\n\n');

      const { data } = result.plugins.find(
        p => p.pluginId === PageTitlePlugin.id,
      ) as PluginResult<string>;

      const pageCaptureParams = {
        page_route: result.url,
        page_title: data, // Required by have content by API
        run_through_id: runThroughResult!.id,
        // run_through_id: 48,
      };

      // console.log('app : results : page capture params :', pageCaptureParams);

      let pageCapture: PageCapture;

      try {
        pageCapture = await this.httpClient.postPageCapture(pageCaptureParams);
        console.log('app : results : submitted page capture :', pageCapture);
        const { data } = result.plugins.find(
          p => p.pluginId === PageScreenShotPlugin.id,
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

      try {
        await this.httpClient.postStyleGuide(
          token.projectId,
          resultData.styleGuide,
        );
      } catch (err) {
        console.log('app : error submitting style guide :', err);
      }
    }

    return;
  }
}

new App(getArgs()).run();
