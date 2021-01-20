import { existsSync, mkdirSync, rmdir } from 'fs';
import { request } from 'http';
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

console.time('run');

class App {
  private branchName: string;

  constructor(private args: Partial<AppArgs>) {
    // console.log('app : args :', args);
    // this.setBranchName();
  }

  /**
   * Execute git command in project directory to get current git branch.
   */
  private setBranchName() {
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
        this.branchName = stdout.trim();
        console.log('app : got git branch :', this.branchName);
      },
    );
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
      config = new ProjectConfig({});
      console.log(`app : could not load config at ${file}`);
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
    // Get project parser config
    let parserConfig: ParserConfig;
    try {
      parserConfig = await this.getParserConfig();
    } catch (err) {
      exitWithError(`Could not locate parser config, error: ${err}`);
    }

    // Get emtrey config
    let projectConfig: ProjectConfig | undefined;

    try {
      projectConfig = await this.readProjectConfig(this.args.dir);
    } catch (err) {
      console.log('app : could not locate project config');
    }

    // Prepare fs if project has config
    const path = await this.prepareScreenshotDirectory(
      projectConfig,
      this.args.dir,
    );

    // Sniff out all project routes based on config
    const routes = await new URLParser(parserConfig).getRoutes(this.args.dir);

    // Check localhost. @todo: Support skipping this.
    await this.confirmProjectIsRunning(this.args.url, routes[0]);

    // Browse to routes and execute plugins
    const browser = new Browser();

    const results = await browser.visitRoutes(
      routes,
      this.args.url,
      path,
      projectConfig,
    );

    console.log('--');
    console.log('app : run : final results :');
    console.log(results);
    console.log('--');

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

  /**
   * Build API payload.
   */
  private async submitResults(
    results: ScreenshotResult[],
    path: string,
    projectConfig: ProjectConfig,
    framework: Framework,
  ) {
    const form = new FormData();

    form.append('branch', this.branchName);
    form.append('app', this.args.app);
    form.append('framework', framework);

    // Disabled while plugins are under development
    // results.forEach(async result => {
    //   const fileName = `${path}/${result.fileName}.png`;
    //   const stream = createReadStream(fileName);
    //   form.append('files[]', stream);
    //   form.append('fileNames[]', result.fileName);
    //   form.append('pageTitles[]', result.pageTitle);
    //   form.append('metrics[]', JSON.stringify(result.metrics));
    //   form.append('urls[]', result.url);
    // });

    console.log(
      'app : submitting results :',
      projectConfig.apiURL,
      projectConfig.apiPort,
    );

    return this.postResults(form, projectConfig);
  }

  /**
   * Handle transmission of form data to API.
   */
  private async postResults(form: FormData, config: ProjectConfig) {
    return new Promise((resolve, reject) => {
      const req = request({
        hostname: config.apiURL,
        port: config.apiPort,
        path: '/api/vr',
        method: 'POST',
        headers: form.getHeaders(),
      });

      req.on('timeout', reject);

      req.on('response', res => {
        console.log('app : submission response :', res.statusCode);
        res.statusCode === 200 ? resolve(null) : reject();
      });

      form.pipe(req);
    });
  }

  /**
   * Remove any old screenshots, create directory to house images.
   */
  private async prepareScreenshotDirectory(
    config: ProjectConfig | undefined,
    dir: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const path = join(dir, config.outputDirectory);
      if (!existsSync(path)) {
        console.log('app : creating screenshot directory :', path);
        try {
          mkdirSync(path);
        } catch (err) {
          reject(err);
        }
        resolve(path);
      } else {
        resolve(path);
        rimraf.default(`${path}/*`, {}, err => {
          if (err) {
            return reject(err);
          }
          console.log('app : screenshot directory emptied :', path);
          resolve(path);
        });
      }
    });
  }

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
}

new App(getArgs()).run();
