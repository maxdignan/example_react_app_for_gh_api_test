import puppeteer, { LaunchOptions } from 'puppeteer';
import { join } from 'path';
import { compile } from 'handlebars';
import * as fs from 'fs';

import { Route } from './models/route';
import { ProjectConfig } from './models/project-config';
import {
  ScreenshotResult,
  MetaDataResult,
  Result,
  AnalyzedMetaData,
} from './models/screenshot-result';
import {
  exitWithError,
  allPropsForElement,
  getElementClassCounts,
} from './util';
import { Plugin, PluginOptions, PluginResult } from './models/plugin';
import * as fromPlugins from './plugins';

export class Browser {
  private authorized = false;
  private launchConfig: LaunchOptions = {
    product: 'chrome', // Also firefox
    headless: true,
    slowMo: 0,
  };

  /**
   * Find input fields, send value and events, profit.
   * Extra events like `keydown`, `change` etc. unfortunately required for Angular support
   */
  private async fillInLoginForm(
    page: puppeteer.Page,
    config: ProjectConfig,
  ): Promise<boolean> {
    try {
      const email = await page.$eval(
        'input[type="email"]',
        (el: HTMLInputElement, val: string) => {
          const options = { bubbles: true, cancelable: true };
          el.dispatchEvent(new Event('focus', options));
          el.value = val;
          el.dispatchEvent(new Event('input', options));
          el.dispatchEvent(new Event('change', options));
          return el.value;
        },
        config.login.user,
      );
      const password = await page.$eval(
        'input[type="password"]',
        (el: HTMLInputElement, val: string) => {
          const options = { bubbles: true, cancelable: true };
          el.dispatchEvent(new Event('focus', options));
          el.value = val;
          el.dispatchEvent(new Event('input', options));
          el.dispatchEvent(new Event('change', options));
          return el.value;
        },
        config.login.password,
      );
      console.log('browser : login form filled :', email + ' / ' + password);
      return true;
    } catch (err) {
      // console.error(err);
      return false;
    }
  }

  /**
   * Visit the login URL and submit form.
   * @todo
   * - Visit login route when unauthorized to take screenshot
   * - Make URL configurable
   * - Turn core logic into an adapter
   */
  private async authorize(
    page: puppeteer.Page,
    serverUrl: string,
    config: ProjectConfig,
  ): Promise<boolean> {
    const url = `${serverUrl}/${config.getLoginUrl()}`;

    console.log('browser : auth :', url);

    // Navigate to page.
    try {
      await page.goto(url, { waitUntil: ['load'] });
    } catch (err) {
      console.log('browser : auth : ERROR!');
      console.log(err);
      return false;
    }

    // Credentials have been supplied, find input fields and set values.
    if (config.login.user && config.login.password) {
      await this.fillInLoginForm(page, config);
    }

    // Submit form.
    const loginButton = await page.$x("//button[contains(., 'Login')]");

    if (loginButton.length > 0) {
      console.log('browser : auth : clicking login button...');
      try {
        await loginButton[0].click();
      } catch (err) {
        console.error(err);
        return false;
      }
    } else {
      // No link exists, or we may have been redirected due to cookie/jwt.
      // IE: Login success, redirect to URL `/jobs/` - no login exists here.
      // console.log('browser : auth : link not found');
      return false;
    }

    // Wait for redirect.
    try {
      // await page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
      await page.waitForNavigation({ waitUntil: ['load'] });
    } catch (err) {
      console.error(err);
    }

    console.log('browser : authorized');
    this.authorized = true;

    return true;
  }

  /**
   * Core logic to handle navigation and running plugins.
   */
  private async visitRoute(data: {
    route: Route;
    serverUrl: string;
    config: ProjectConfig;
    path: string;
    page: puppeteer.Page;
  }): Promise<ScreenshotResult | null> {
    const { route, serverUrl, config, path, page } = data;

    const url = route.getFullUrl(serverUrl, config);

    console.log(`browser : visit : ${url}`);

    // Navigate to the route.
    await page.goto(url, { waitUntil: ['load'] });

    // Check for screenshot settings in project config
    if (config.hasURL(route.url)) {
      // Check if URL is enbaled
      const enabled = config.getURLProp(route.url, 'enabled');
      if (enabled === false) {
        console.log('browser : url is disabled :', url);
        return null;
      }
      // Check for delay config
      const delay = config.getURLProp(route.url, 'delay');
      // Timeout before executing plugins in MS
      if (delay && !isNaN(delay)) {
        // console.log(`browser : delay for : ${delay} milliseconds`);
        await page.waitFor(delay);
      }
    }

    // Set viewport dimensions
    /** @todo: Configure this for each route? */
    await page.setViewport({
      width: 1400,
      height: 1200,
      // deviceScaleFactor: 2,
    });

    let plugins: PluginResult<unknown>[] = [];

    // Brief pause before executing plugins.
    // This appears to resolve plugin component cropping/dimension issues.
    await page.waitFor(10);

    try {
      plugins = await this.runPlugins(page, {
        path,
        routeId: Route.getFileNameFromURL(url),
      });
    } catch (err) {
      exitWithError(err);
    }

    console.log('browser : visit done \n \n');

    const result: ScreenshotResult = { url, plugins };

    return result;
  }

  /**
   * Entrance to iterate through all routes, run all plugins and data collection.
   */
  public async visitRoutes(
    routes: Route[],
    serverUrl: string,
    path: string,
    config: ProjectConfig,
  ): Promise<Result> {
    const browser = await puppeteer.launch(this.launchConfig);

    // Limit max amount of shots
    if (config.limit) {
      console.log(`browser : limiting routes to ${config.limit}`);
      routes = routes.slice(0, config.limit);
    }

    let page: puppeteer.Page;
    let hasVisitedLogin = false;

    const results: ScreenshotResult[] = [];
    const metaData: MetaDataResult[] = [];

    // Some route needs to auth, lets auth first then go take shots.
    const willAuth = routes.some(r => config.willAuthorizeURL(r.url));

    if (!this.authorized && willAuth) {
      // Hit the login route first to capture unauthorized/login view.
      const loginRoute = routes.find(r => r.url === config.getLoginUrl());
      if (loginRoute) {
        // New page for login route.
        page = await browser.newPage();
        // Go and snap login.
        const loginResult = await this.visitRoute({
          route: loginRoute,
          serverUrl,
          config,
          path,
          page,
        });
        hasVisitedLogin = results.push(loginResult) && true;
      }
      // Below goes to auth before navigating to other routes, but only once.
      // console.log('browser : authorize first');
      // const loginUrl = `${serverUrl}/login`;
      // page = await browser.newPage();
      // await this.authorize(page, loginUrl);
    }

    // Go through every route and take a shot
    for (const [index, route] of routes.entries()) {
      // const reusedPage = page || (await browser.newPage());
      const reusedPage = await browser.newPage();

      if (route.url === config.getLoginUrl() && hasVisitedLogin) {
        // We already have login screen.
        /** @todo: Go anyway and screenshot redirect URL? */
        continue;
      }

      await this.authorize(reusedPage, serverUrl, config);

      // Testing. Seems we cannot catch error messages from thrown errors; at least in NG.
      // reusedPage.on('console', e => {
      //   if (e.type().toLowerCase() === 'error') {
      //     console.log(
      //       'page : console error : ' + e.args(),
      //       e.location(),
      //       e.text(),
      //     );
      //   }
      // });

      // Testing, we can definitely make use of this.
      // reusedPage.on('requestfailed', req => {
      //   console.log(
      //     'page : request failed :',
      //     req.url(),
      //     req.method(),
      //     // req.response(),
      //   );
      // });

      const params = {
        route,
        serverUrl,
        config,
        path,
        page: reusedPage,
      };

      results.push(await this.visitRoute(params));
      metaData.push(await this.collectMetaData(params));

      // Build style guide on last iteration
      if (index === routes.length - 1) {
        const analyzedMetaData = await this.analyzeMetaData(metaData);
        await this.buildStyleGuide(analyzedMetaData, reusedPage, path);
      }

      // Only reuse the first page - seems to work best with example NG app
      await page?.close();

      page = null;
    }

    await browser.close();
    console.log('browser : done');

    // Might not need to return meta data anymore.
    const result = { results };
    return result;
  }

  /**
   * Get all enabled plugins for this project. Defaults to all for now.
   * @todo: Allow user to configure.
   */
  private getPlugins() {
    const allPlugins: Plugin<unknown>[] = [
      // new fromPlugins.PageTitlePlugin(),
      // new fromPlugins.MetricsPlugin(),
      // new fromPlugins.PageScreenShotPlugin(),
      // new fromPlugins.ComponentScreenShotPlugin(),
    ];
    return allPlugins;
  }

  private async runPlugins(
    page: puppeteer.Page,
    options: PluginOptions,
  ): Promise<PluginResult<unknown>[]> {
    const plugins = this.getPlugins();
    const pluginResults = await Promise.all(
      plugins.map(plugin => plugin.run(page, options)),
    );
    console.log('plugin : results :', pluginResults);
    return pluginResults;
  }

  /**
   * Read style guide template from disk.
   */
  private async getStyleGuideHTML(): Promise<string> {
    let content: string;
    const path = 'src/style-guide/style-guide-template.html';
    try {
      content = await fs.promises.readFile(path, 'utf-8');
    } catch (err) {
      console.error(err);
    }
    return content;
  }

  /**
   * Build HTML template on page using meta data.
   * @todo: Some research on the best output for this - we could do SVG/PDF or whatever
   */
  private async buildStyleGuide(
    metaData: AnalyzedMetaData,
    page: puppeteer.Page,
    path: string,
  ) {
    console.log('browser : building style guide :', metaData);

    try {
      // Define variables and compile template
      const templateParams = metaData;
      const html = await this.getStyleGuideHTML();
      const compiledStyleGuideTemplate = compile(html)(templateParams);

      // Place compiled html in host page
      await page.evaluate(html => {
        document.body.innerHTML = html;
      }, compiledStyleGuideTemplate);

      const fileName = 'style-guide.png';
      await page.screenshot({ path: join(path, fileName), fullPage: true });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * Collect arbitrary data on each route visit.
   */
  private async collectMetaData(params: {
    route: Route;
    serverUrl: string;
    config: ProjectConfig;
    path: string;
    page: puppeteer.Page;
  }): Promise<MetaDataResult> {
    let buttonClasses: string[] = [];
    // let inputClasses: string[] = [];

    const hasInputs = await params.page.$$('input');

    try {
      buttonClasses = await allPropsForElement(params.page, 'button');
      // inputClasses = await allPropsForElement(
      //   params.page,
      //   'input[type="text"]',
      // );
    } catch (err) {
      console.log(err);
    }

    const metaData: MetaDataResult = {
      url: params.route.url,
      hasInputs: hasInputs.length ? ['input'] : [],
      buttonClasses,
      // inputClasses,
    };

    return metaData;
  }

  /**
   * Process meta data from each route visit into various statistics.
   * Primarily for style guide generation at the moment.
   */
  private analyzeMetaData(metaData: MetaDataResult[]): AnalyzedMetaData {
    console.log('analyze meta data', metaData);

    const buttonClasses = getElementClassCounts(
      metaData.map(m => m.buttonClasses),
    );
    // const inputClasses = getElementClassCounts(
    //   metaData.map(m => m.inputClasses),
    // );

    // console.log('button classes', buttonClasses);
    // console.log('input classes', inputClasses);

    const analyzed: AnalyzedMetaData = {
      buttonClasses,
      // inputClasses,
    };

    // console.log('browser : analyzed metadata :', analyzed);

    return analyzed;
  }
}
