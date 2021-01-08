import puppeteer from 'puppeteer';
import { join } from 'path';

import { exitWithError } from '../util';
import { Route } from '../models/route';
import { Plugin, PluginOptions } from '../models/plugin';

/**
 * Takes weighted component screenshots.
 */
export class ComponentScreenShotPlugin extends Plugin<any> {
  id = 40;
  name = 'Component Screen Shot';
  description = '';

  getExtension(): 'jpeg' | 'png' {
    return 'jpeg';
  }

  async run(page: puppeteer.Page, options: PluginOptions) {
    await page.addScriptTag({ path: 'src/plugins/component-screenshot.js' });

    const scriptResult = await page.evaluate(() => {
      // @ts-ignore
      const scriptResult = window.$plugin();
      return scriptResult;
    });

    // const url = page.url();
    // const extension = this.getExtension();
    // const fileName = `${Route.getFileNameFromURL(url)}.${extension}`;
    // const path = join(options.path, fileName);

    // try {
    //   await page.screenshot({
    //     path,
    //     fullPage: true,
    //     type: extension,
    //     quality: 50,
    //   });
    // } catch (err) {
    //   exitWithError(err);
    // }

    console.log('component screenshot plugin : script result :', scriptResult);

    return super.processRun({});
  }
}
