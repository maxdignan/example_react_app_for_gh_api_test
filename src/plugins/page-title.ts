import puppeteer from 'puppeteer';

import { Plugin } from '../models/plugin';

/**
 * Collects the page's title.
 */
export class PageTitlePlugin extends Plugin<string> {
  static id = 3;
  public name = 'Page Title';
  public description = '';

  async run(page: puppeteer.Page) {
    const data = await page.title();
    return super.processRun(PageTitlePlugin.id, data);
  }
}
