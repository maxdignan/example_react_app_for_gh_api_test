import puppeteer, { LaunchOptions } from 'puppeteer';

import { Route } from './models/route';
import { ProjectConfig } from './models/project-config';
import {
  ScreenshotResult,
  MetaDataResult,
  Result,
} from './models/screenshot-result';
import { exitWithError, allPropsForElement } from './util';
import { Plugin, PluginOptions, PluginResult } from './models/plugin';
import { StyleGuideBuilder } from './style-guide/style-guide-builder';
import { StyleGuideParam } from './style-guide/style-guide-param';
import { AppArgs, getArgFor } from './models/args';
import * as fromPlugins from './plugins';

export class Browser {
  static viewports = [
    // Desktop
    { w: 1400, h: 900, mobile: false },
    // Tablet iPad portrait
    { w: 768, h: 1024, mobile: true },
    // iPhone 11
    { w: 375, h: 812, mobile: true },
  ];

  // Can be thought of as dpr of screenshot
  static deviceScaleFactor = 1;

  static enabledPlugins: Plugin<unknown>[] = [
    new fromPlugins.PageScreenShotPlugin(),
    // new fromPlugins.ComponentScreenShotPlugin(),
    new fromPlugins.PageTitlePlugin(),
    // new fromPlugins.MetricsPlugin(),
  ];

  /**
   * Gets the application base URL which will be visiting for each route.
   */
  static getAppURL(args: Partial<AppArgs>): string {
    const port = getArgFor(args, 'port');
    if (port) {
      return `http://localhost:${port}`;
    }
    const url = getArgFor(args, 'url');
    return url!;
  }

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
        config.login!.user,
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
        config.login!.password,
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
    if (config.login?.user && config.login?.password) {
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
  }): Promise<ScreenshotResult[]> {
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
        // URL is not enabled, skip running all plugins
        return [];
      }
      // Check for delay config
      const delay = config.getURLProp(route.url, 'delay');
      // Timeout before executing plugins in MS
      if (delay && !isNaN(delay)) {
        // console.log(`browser : delay for : ${delay} milliseconds`);
        await page.waitFor(delay);
      }
    }

    let screenShotResults: ScreenshotResult[] = [];

    const viewports = process.env.LIMIT_VIEWPORT
      ? Browser.viewports.slice(0, 1)
      : Browser.viewports;

    for (const viewport of viewports) {
      console.log('browser : visit route : viewport', viewport);

      // Set viewport dimensions
      await page.setViewport({
        width: viewport.w,
        height: viewport.h,
        isMobile: viewport.mobile,
        deviceScaleFactor: Browser.deviceScaleFactor,
      });

      let plugins: PluginResult<unknown>[] = [];

      // Brief pause before executing plugins
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

      console.log('browser : visit route : completed');

      screenShotResults.push({ url, plugins });
    }

    return screenShotResults;
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

    let page: puppeteer.Page | null;
    let hasVisitedLogin = false;

    const results: ScreenshotResult[] = [];
    const metaData: MetaDataResult[] = [];

    // Some route needs to auth, lets auth first then go take shots.
    const willAuth = routes.some(r => config.willAuthorizeURL(r.url));
    console.log('browser : will auth :', willAuth);

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
        results.push(...loginResult);
        hasVisitedLogin = true;
        page.close();
      }
      // Below goes to auth before navigating to other routes, but only once.
      // console.log('browser : authorize first');
      // const loginUrl = `${serverUrl}/login`;
      // page = await browser.newPage();
      // await this.authorize(page, loginUrl);
    }

    // Go through every route and take a shot
    for (const route of routes) {
      /** @todo: We should be closing this page. */
      // const reusedPage = page || (await browser.newPage());
      const page = await browser.newPage();

      if (route.url === config.getLoginUrl() && hasVisitedLogin) {
        // We already have login screen.
        /** @todo: Go anyway and screenshot redirect URL? */
        continue;
      }

      if (willAuth) {
        await this.authorize(page, serverUrl, config);
      }

      const params = {
        route,
        serverUrl,
        config,
        path,
        page,
      };

      results.push(...(await this.visitRoute(params)));
      metaData.push(await this.collectMetaData(params));

      await page.close();
    }

    let styleGuide: StyleGuideParam[] = [];

    // Build style guide after all route visits.
    try {
      const sgb = new StyleGuideBuilder({ metaData, path });
      const page = await browser.newPage();
      const url = sgb.getURLToVisit(routes, serverUrl, config);
      await page.goto(url, { waitUntil: ['load'] });
      styleGuide = await sgb.buildStyleGuide(page);
      await page.close();
    } catch (err) {
      console.error(err);
    }

    await browser.close();
    // console.log('browser : closed');

    return { results, styleGuide };
  }

  /**
   * Get all enabled plugins for this project. Defaults to all for now.
   */
  private getPlugins() {
    return Browser.enabledPlugins;
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
    let colors: string[] = [];
    // let inputClasses: string[] = [];

    const hasInputs = await params.page.$$('input');

    try {
      buttonClasses = await allPropsForElement(params.page, 'button');
      colors = await StyleGuideBuilder.getAllColorsInStyleSheets(params.page);
    } catch (err) {
      console.log('collect meta data : error :', err);
    }

    const metaData: MetaDataResult = {
      url: params.route.url,
      hasInputs: hasInputs.length ? ['input'] : [],
      buttonClasses,
      colors,
    };

    return metaData;
  }
}
