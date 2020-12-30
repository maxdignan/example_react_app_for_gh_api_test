import puppeteer from 'puppeteer';

import { Plugin } from '../models/plugin';

/**
 * Collects the page's title.
 */
export class PageTitlePlugin extends Plugin<string> {
  id = 10;
  name = 'Page Title';
  description = '';

  async run(page: puppeteer.Page) {
    const data = await page.title();
    return super.processRun(data);
  }
}
