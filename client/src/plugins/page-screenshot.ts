import puppeteer from 'puppeteer';
import { join } from 'path';

import { exitWithError } from '../util';
import { Route } from '../models/route';
import { Plugin, PluginOptions } from '../models/plugin';

export interface PageScreenshotPluginResult {
  path: string;
  fileName: string;
}

/**
 * Takes a full size page screenshot.
 */
export class PageScreenShotPlugin extends Plugin<PageScreenshotPluginResult> {
  id = 30;
  name = 'Page Screen Shot';
  description = '';

  getExtension(): 'jpeg' | 'png' {
    return 'png';
  }

  async run(page: puppeteer.Page, options: PluginOptions) {
    const url = page.url();
    const extension = this.getExtension();
    // Use route, or if empty assume home page
    const fileName = options.routeId
      ? `${Route.getFileNameFromURL(url)}`
      : 'index';
    const path = join(options.path, `${fileName}.${extension}`);

    try {
      await page.screenshot({
        path,
        fullPage: true,
        type: extension,
        quality: extension === 'jpeg' ? 50 : undefined,
      });
    } catch (err) {
      exitWithError(err);
    }

    // console.log(`page screenshot plugin : saving image as : ${path}`);

    return super.processRun({ path, fileName });
  }
}
