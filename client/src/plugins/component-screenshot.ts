import puppeteer from 'puppeteer';
import { join } from 'path';

import { exitWithError } from '../util';
import { Plugin, PluginOptions } from '../models/plugin';

export interface ComponentScreenShotPluginData {
  count: number;
  cls: string;
  rect: DOMRect;
  tag: string;
}

export type ExtendedComponentScreenShotPluginData = ComponentScreenShotPluginData & {
  fileName: string;
};

/**
 * Takes weighted component screenshots.
 */
export class ComponentScreenShotPlugin extends Plugin<any> {
  id = 40;
  name = 'Component Screen Shot';
  description = '';

  static getFileNameFromScriptData(
    data: ComponentScreenShotPluginData,
    routeId: string,
    index: number,
  ): string {
    const idParts = data.cls.split('::');
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

    // Parse injected script result and create extended data
    const scriptData: ExtendedComponentScreenShotPluginData[] = scriptResult.map(
      (result, index) => {
        const data: ComponentScreenShotPluginData = JSON.parse(result);
        const prefileName = ComponentScreenShotPlugin.getFileNameFromScriptData(
          data,
          options.routeId,
          index,
        );
        const fileName = `${prefileName}.${extension}`;
        return Object.assign({}, data, { fileName });
      },
    );

    // Take shots
    const asyncScreenshots = scriptData.map(async data => {
      const { fileName } = data;
      const path = join(options.path, fileName);
      try {
        const cls = data.cls.split('::');
        const component = await page.$(`${cls[0]}[class="${cls[1]}"]`);
        const bounding_box = await component.boundingBox();
        console.log(cls, bounding_box);
        await component.screenshot({
          // Adding clip is causing the image to cut off
          // clip: {
          //   x: bounding_box.x,
          //   y: bounding_box.y,
          //   width: bounding_box.width,
          //   height: bounding_box.height,
          // },
          path,
          // type: extension,
        });
      } catch (err) {
        exitWithError(err);
      }
      return fileName;
    });

    const screenshots = await Promise.all(asyncScreenshots);

    console.log('component screenshot plugin : screenshots :', screenshots);

    return super.processRun(screenshots);
  }
}
