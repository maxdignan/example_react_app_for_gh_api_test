import puppeteer from 'puppeteer';
import { join } from 'path';

import { exitWithError } from '../util';
import { Route } from '../models/route';
import { Plugin, PluginOptions } from '../models/plugin';

/**
 * Takes a full size page screenshot.
 */
export class PageScreenShotPlugin extends Plugin<string> {
  id = 30;
  name = 'Page Screen Shot';
  description = '';

  getExtension(): 'jpeg' | 'png' {
    return 'jpeg';
  }

  async run(page: puppeteer.Page, options: PluginOptions) {
    const url = page.url();
    const extension = this.getExtension();
    const fileName = options.routeId
      ? `${Route.getFileNameFromURL(url)}.${extension}`
      : 'index';
    const path = join(options.path, fileName);

    try {
      await page.screenshot({
        path,
        fullPage: true,
        type: extension,
        quality: 50,
      });
    } catch (err) {
      exitWithError(err);
    }

    // console.log(`page screenshot plugin : saving image as : ${path}`);

    return super.processRun(fileName);
  }
}
