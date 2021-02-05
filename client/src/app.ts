import { existsSync, mkdirSync, rmdir } from 'fs';
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
   * Gather all routes and navigate to URLs to take screenshots.
   */
  public async run() {
    // Always need to start with a token
    // const token = await this.httpClient.generateSessionToken();
    const token =
      'haDZ3hKdX46sbaeTXVkHzLZ-gfeEp6IoNOqHmdGaXfDa7d0K4jEprWo61-58';
    console.log('auth : got token :', token);
    // Then let user login manually via web app
    const user = await this.authorizeUser(token);
    // Check if user has registered, if not we need to create an account before they continue
    // const token = await UserToken.readFromFile();
    // console.log('app : read user token :', token);

    console.log(`auth : user "${user}" has authorized`);

    process.exit(0);

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

    // console.log('app : run : final results :');
    // console.log(results);

    this.submitResults({ results, framework: parserConfig!.framework });

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
   * Launch user's web browser to finalize user auth.
   */
  private async authorizeUser(token: string): Promise<User> {
    const url = `https://${ProjectConfig.apiURL}/api-login?api_session_token=${token}`;
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
   *
   * Steps for submitting results to API.
   *
   * 1. Check if user has an Emtrey account by looking for token in fs, or email address passed into process arg.
   * If no email address or token is found, assume they are not registered.
   * -- YES: Auth this user to get token
   * -- NO: Register new user to get token (prompt for organization?)
   * -- ALWAYS: Cache the token on fs
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
    console.log('app : submit results :', data);

    const branch = await this.getGitBranchName();

    return null;
  }
}

new App(getArgs()).run();
