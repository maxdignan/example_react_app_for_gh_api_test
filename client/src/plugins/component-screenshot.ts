import puppeteer from 'puppeteer';
import { join } from 'path';

import { exitWithError } from '../util';
import { Plugin, PluginOptions } from '../models/plugin';

// Response from running plugin script in puppeteer page instance
export type ComponentScreenShotPluginData = string;

export type ExtendedComponentScreenShotPluginData = {
  cls: string;
  fileName: string;
};

/**
 * Takes weighted component screenshots.
 */
export class ComponentScreenShotPlugin extends Plugin<any> {
  static id = 4;
  public name = 'Component Screen Shot';
  public description = '';

  static getFileNameFromScriptData(
    data: string,
    routeId: string,
    index: number,
  ): string {
    const idParts = data.split('::');
    return `${routeId}_${idParts[0]}_${index}`;
  }

  getExtension(): 'jpeg' | 'png' {
    return 'png';
  }

  async run(page: puppeteer.Page, options: PluginOptions) {
    // Inject plugin script into env
    await page.addScriptTag({ path: 'src/plugins/component-screenshot.js' });

    // Run injected script, return is JSON stringified object.
    const scriptResult: string[] = await page.evaluate(() => {
      // @ts-ignore
      const scriptResult = window.$plugin();
      return scriptResult;
    });

    const extension = this.getExtension();

    console.log('plugin : component screenshot result :', scriptResult);

    // Parse injected script result and create extended data
    const scriptData: ExtendedComponentScreenShotPluginData[] = scriptResult.map(
      (result, index) => {
        const prefileName = ComponentScreenShotPlugin.getFileNameFromScriptData(
          result,
          options.routeId,
          index,
        );
        const fileName = `${prefileName}.${extension}`;
        return { fileName, cls: result };
      },
    );

    // Take shots
    const asyncScreenshots = scriptData.map(async data => {
      const { fileName } = data;
      const path = join(options.path, fileName);
      try {
        const [, xpath] = data.cls.split('::');
        const component = (await page.$x(xpath))[0];
        await component.screenshot({
          path,
        });
      } catch (err) {
        exitWithError(err);
      }
      return fileName;
    });

    const screenshots = await Promise.all(asyncScreenshots);

    console.log('component screenshot plugin : screenshots :', screenshots);

    return super.processRun(ComponentScreenShotPlugin.id, screenshots);
  }
}
