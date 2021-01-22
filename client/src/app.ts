import { createReadStream, existsSync, mkdirSync, rmdir } from 'fs';
import FormData from 'form-data';
import { exec } from 'child_process';
import { join } from 'path';
import * as rimraf from 'rimraf';

import { URLParser } from './url-parser';
import { Route } from './models/route';
import { ProjectConfig } from './models/project-config';
import { AppArgs } from './models/args';
import { Result, ScreenshotResult } from './models/screenshot-result';
import { Browser } from './browser';
import { exitWithError, getArgs, xhrGet } from './util';
import { FrameworkParser } from './framework-parser';
import { Framework, ParserConfig } from './models/parser';
import { HttpClient } from './http-client';

console.clear();
console.time('run');

class App {
  private projectConfig: ProjectConfig;

  constructor(private args: Partial<AppArgs>) {
    // console.log('app : args :', args);
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
    const frameworkParser = new FrameworkParser(this.args.dir);
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
   * Gather all routes and navigate to URLs to take screenshots.
   */
  public async run() {
    // Get parser config from user's project
    let parserConfig: ParserConfig;
    try {
      parserConfig = await this.getParserConfig();
    } catch (err) {
      exitWithError(`Could not locate parser config, error: ${err}`);
    }

    // Get emtrey config from user's project
    const projectConfig = await this.readProjectConfig(this.args.dir);
    this.setProjectConfig(projectConfig);

    // Sniff out all project routes based on config
    const routes = await new URLParser(parserConfig).getRoutes(this.args.dir);

    // Check localhost. @todo: Support skipping this.
    await this.confirmProjectIsRunning(this.args.url, routes[0]);

    // Prepare fs if project has config
    const path = await this.prepareScreenshotDirectory(this.args.dir);

    // Browse to routes and execute plugins
    const browser = new Browser();
    const results = await browser.visitRoutes(
      routes,
      this.args.url,
      path,
      projectConfig,
    );

    // console.log('--');
    // console.log('app : run : final results :');
    // console.log(results);
    // console.log('--');

    this.submitResults({ results, framework: parserConfig.framework });

    // Post data to server.
    // try {
    //   await this.submitResults(
    //     results,
    //     path,
    //     projectConfig,
    //     parserConfig.framework,
    //   );
    // } catch (err) {
    //   console.log('app : error');
    // }
    // Cleanup
    // try {
    //   await this.cleanup(path);
    // } catch (err) {
    //   console.error('app : cleanup error');
    // }
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
    return new Promise((resolve, reject) => {
      console.log('app : cleaning up dir :', dir);
      rmdir(dir, { recursive: true }, err => {
        if (err) {
          return reject(err);
        }
        resolve(null);
      });
    });
  }

  /**
   * Creates new http client with token from API.
   */
  private async initializeHttpClient(): Promise<HttpClient> {
    let client: HttpClient;
    try {
      client = new HttpClient(this.projectConfig.apiURL);
      await client.generateSessionToken();
    } catch (err) {
      exitWithError(err);
    }
    return client;
  }

  /**
   * Execute git command in project directory to get current git branch.
   */
  private getGitBranchName(): Promise<string> {
    return new Promise(resolve => {
      console.time('git');
      exec(
        'git rev-parse --abbrev-ref HEAD',
        {
          cwd: this.args.dir,
        },
        (err: Error, stdout: string, stderr: string) => {
          console.timeEnd('git');
          if (err || stderr) {
            // throw new Error(err || stderr);
            // Git may not be initialized, or no commit exists.
            exitWithError('app : error finding git branch');
          }
          const branch = stdout.trim();
          console.log('app : got git branch :', branch);
          resolve(branch);
        },
      );
    });
  }

  /**
   *
   * Steps for submitting results to API.
   *
   * 1. Check if user has an Emtrey account
   * -- YES: Auth this user to get token
   * -- NO: Register new user to get token
   *
   * 2. With a user and token, does a project exist?
   * -- YES: Use project by unique name
   * -- NO: Create a new project
   *
   * 3. With a project, post a run-through. Success?
   * -- YES: Continue
   * -- NO: Fatal error - try again?
   *
   * 4. With the response URL from the run-through, post the screen shots. Success?
   * -- YES: That's pretty much it
   * -- NO: Fatal error - try again?
   *
   * 5. Drink a beer
   *
   */
  private async submitResults(data: {
    results: Result;
    framework: Framework;
  }): Promise<any> {
    // Ensure API is up.
    // const httpClient = await this.initializeHttpClient();

    console.log('app : submit results :', data);
    const branchName = await this.getGitBranchName();

    // return this.postResults(form, projectConfig);
    return null;
  }
}

new App(getArgs()).run();
