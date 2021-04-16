import puppeteer from 'puppeteer-core';
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
  static id = 1;
  public name = 'Page Screen Shot';
  public description = '';

  getExtension(): 'jpeg' | 'png' {
    return 'png';
  }

  async run(page: puppeteer.Page, options: PluginOptions) {
    const url = page.url();
    const extension = this.getExtension();
    const viewport = page.viewport()!;
    // Use route, or if empty assume home page
    const urlNameForFile = options.routeId
      ? `${Route.getFileNameFromURL(url)}`
      : 'index';
    const viewportNameForFile = `${viewport.width}x${viewport.height}`;
    const fileName = `${urlNameForFile}-${viewportNameForFile}`;
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

    const result = { path, fileName };
    return super.processRun(PageScreenShotPlugin.id, result);
  }
}
