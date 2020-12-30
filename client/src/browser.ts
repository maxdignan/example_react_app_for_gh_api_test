import puppeteer, { LaunchOptions } from 'puppeteer';

import { Route } from './models/route';
import { ProjectConfig } from './models/project-config';
import { ScreenshotResult } from './models/screenshot-result';
import { exitWithError } from './util';
import { Plugin, PluginResult } from './models/plugin';
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
   * Core logic to handle navigation and screenshots.
   */
  private async visitRoute(data: {
    route: Route;
    serverUrl: string;
    config: ProjectConfig;
    path: string;
    page: puppeteer.Page;
  }): Promise<ScreenshotResult> {
    const { route, serverUrl, config, path, page } = data;
    const url = route.getFullUrl(serverUrl, config);
    const fileName = Route.getFileNameFromURL(serverUrl, url);

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
      // Timeout before taking screenshot in MS
      if (delay && !isNaN(delay)) {
        // console.log(`browser : delay for : ${delay} milliseconds`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // Set viewport dimensions
    await page.setViewport({
      /** @todo: Configure this for each route? */
      width: 1400,
      /** @todo: Configure this for each route? */
      height: 1200,
      /** @todo: Configure this for each route? */
      // deviceScaleFactor: 2,
    });

    // console.log(`browser : saving screenshot as : ${fileName}`);

    // Original
    // let pageTitle: string;
    // let metrics: ScreenshotResultMetrics;
    // try {
    //   [, pageTitle, metrics] = await Promise.all([
    //     await page.screenshot({
    //       path: join(path, `${fileName}.png`),
    //       fullPage: true,
    //       type: 'png',
    //     }),
    //     await page.title(),
    //     await this.parseMetrics(await page.metrics()),
    //   ]);
    // } catch (err) {
    //   exitWithError(err);
    // }

    let plugins: PluginResult<unknown>[] = [];

    try {
      plugins = await this.runPlugins(page);
    } catch (err) {
      exitWithError(err);
    }

    console.log('browser : visit done');

    const result: ScreenshotResult = {
      url,
      // fileName,
      // pageTitle,
      // metrics,
    };

    return result;
  }

  /**
   * Entrance to iterate through all routes.
   */
  public async visitRoutes(
    routes: Route[],
    serverUrl: string,
    path: string,
    config: ProjectConfig,
  ): Promise<ScreenshotResult[]> {
    const browser = await puppeteer.launch(this.launchConfig);

    // Limit max amount of shots
    if (config.limit) {
      console.log(`browser : limiting routes to ${config.limit}`);
      routes = routes.slice(0, config.limit);
    }

    let page: puppeteer.Page;
    let hasVisitedLogin = false;

    const results: ScreenshotResult[] = [];

    // Some route needs to auth, lets auth first then go take shots.
    const willAuth = routes.some(r => config.willAuthorizeURL(r.url));

    if (!this.authorized && willAuth) {
      // Hit the login route first to capture unauthorized/login view.
      const loginRoute = routes.find(
        route => route.url === config.getLoginUrl(),
      );
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
    for (const route of routes) {
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

      const result = await this.visitRoute({
        route,
        serverUrl,
        config,
        path,
        page: reusedPage,
      });
      results.push(result);

      // Only reuse the first page - seems to work best with example NG app
      await page?.close();

      page = null;
    }

    await browser.close();
    console.log('browser : done');
    return results;
  }

  /**
   * Get all enabled plugins for this project. Defaults to all for now.
   * @todo: Allow user to configure.
   */
  private getPlugins() {
    const allPlugins: Plugin<unknown>[] = [
      new fromPlugins.PageTitlePlugin(),
      new fromPlugins.MetricsPlugin(),
    ];
    return allPlugins;
  }

  private async runPlugins(
    page: puppeteer.Page,
  ): Promise<PluginResult<unknown>[]> {
    const plugins = this.getPlugins();
    const pluginResults = await Promise.all(
      plugins.map(plugin => plugin.run(page)),
    );
    console.log('plugin : results :', pluginResults);
    return pluginResults;
  }
}
