import { join } from 'path';
import puppeteer from 'puppeteer';
import { compile } from 'handlebars';

import { AnalyzedMetaData, MetaDataResult } from '../models/screenshot-result';
import { getElementClassCounts } from '../util';
import { logger } from '../logger';
import { Route } from '../models/route';
import { ProjectConfig } from '../models/project-config';
import { StyleGuideParam } from './style-guide-param';
import {
  StyleGuideTemplateId,
  styleGuideTemplates,
} from './style-guide-templates';

export class StyleGuideBuilder {
  public metaDataWithInputElement?: MetaDataResult;
  private metaData: AnalyzedMetaData;
  private pathToSaveImage: string;

  /**
   * Extract commonly-used colors on given page via all DOM elements.
   */
  static collectColorsFromPage = async (
    page: puppeteer.Page,
  ): Promise<string[]> => {
    const colors = await page.evaluate(() => {
      // @ts-ignore
      var convertRGBAToRGB = rgba => {
        let rgb = rgba.replace('rgba', 'rgb');
        rgb = `${rgb.substring(0, rgb.lastIndexOf(','))})`;
        return rgb;
      };

      const colorMap = Array.from(document.querySelectorAll('body *'))
        .flatMap(el => {
          const style = getComputedStyle(el);
          const colors = [style.color, style.backgroundColor].map(c => {
            if (c.indexOf('rgba') > -1) {
              return convertRGBAToRGB(c);
            } else {
              return c;
            }
          });
          return colors;
        })
        .filter(c => !!c && c !== 'inherit' && c !== 'transparent')
        .reduce((a, b) => (a[b] ? a[b]++ : (a[b] = 1)) && a, {});

      const colorList = Object.keys(colorMap).sort((a, b) =>
        colorMap[a] > colorMap[b] ? -1 : 1,
      );

      return colorList;
    });

    logger.debug('style guide builder : got colors :', colors);

    return colors;
  };

  constructor(params: { metaData: MetaDataResult[]; path: string }) {
    const { metaData } = params;
    this.metaData = this.analyzeMetaData(metaData);
    this.metaDataWithInputElement = this.getMetaDataWithInput(metaData);
    this.pathToSaveImage = params.path;
  }

  /**
   * Find a meta data entry with input elements on page.
   * We need to use this URL to sample elements for the style guide.
   */
  private getMetaDataWithInput(
    data: MetaDataResult[],
  ): MetaDataResult | undefined {
    return data.find(md => md.hasInputs.length);
  }

  /**
   * Process meta data from each route visit into various statistics.
   * Primarily for style guide generation at the moment.
   */
  private analyzeMetaData(metaData: MetaDataResult[]): AnalyzedMetaData {
    // console.log('style guide : analyze meta data', metaData);

    const buttonClasses = getElementClassCounts(
      metaData.map(m => m.buttonClasses),
    );

    const colorMap = metaData
      .flatMap(m => m.colors)
      .reduce(
        (a, b) => (a[b] ? a[b]++ : (a[b] = 1)) && a,
        {} as { [key: string]: number },
      ) as { [key: string]: number };

    const colors = Object.keys(colorMap).sort((a, b) =>
      colorMap[a] > colorMap[b] ? -1 : 1,
    );
    // Only get the first N colors
    // .slice(0, 10);

    const analyzed: AnalyzedMetaData = {
      buttonClasses,
      colors,
    };

    // console.log('style guide : analyzed metadata :', analyzed);

    return analyzed;
  }

  /**
   * Formats and returns custom input html and label.
   */
  private async getCaustomInputHTML(page: puppeteer.Page): Promise<string> {
    // console.log(
    //   'style guide builder : enhanced input :',
    //   this.metaDataWithInputElement,
    // );
    const html: string = await page.$eval('input', input => {
      input.setAttribute('value', 'Text');
      input.setAttribute('placehodler', 'Placeholder');
      const label =
        (input.nextElementSibling?.nodeName === 'LABEL' &&
          input.nextElementSibling) ||
        (input.previousElementSibling?.nodeName === 'LABEL' &&
          input.previousElementSibling);
      if (label) {
        label.innerHTML = 'Label';
      }
      return input.outerHTML;
    });
    return html;
  }

  /**
   * Get URL to visit for style guide injection.
   * If the analyzed meta data contains an input element, use that URL.
   * @todo: Can we prefer a URL in which we don't need wildcard params (/foo/:id)?
   */
  public getURLToVisit(
    routes: Route[],
    serverUrl: string,
    config: ProjectConfig,
  ): string {
    let route: Route;

    if (this.metaDataWithInputElement) {
      // Custom input elements
      const matchedRoute = routes.find(
        r => r.url === this.metaDataWithInputElement!.url,
      );
      route = matchedRoute!;
    } else {
      // Normal input elements, use arbitrary route
      route = routes[0];
    }

    return route.getFullUrl(serverUrl, config);
  }

  /**
   * Build HTML template on page using meta data.
   */
  public async buildStyleGuide(page: puppeteer.Page) {
    // Support custom input groups
    let customInputHTML = '';
    if (this.metaDataWithInputElement) {
      try {
        customInputHTML = await this.getCaustomInputHTML(page);
      } catch (err) {
        console.log('style guide builder : failed to find custom input html');
      }
    }

    // Define custom variables transcluded in template html
    const templateParams = {
      ...this.metaData,
      customInputHTML,
    };

    const templateScreenshots: {
      id: StyleGuideTemplateId;
      screenshot: string;
    }[] = [];

    /**
     * @todo:
     * - Filter out templates if components don't exist,
     *   for example if no button classes are found, skip the screenshot.
     * - Show element states like hover, focus, etc.
     */
    for (const template of styleGuideTemplates) {
      // Set page dimensions
      await page.setViewport(template.viewport);

      const compiledStyleGuideTemplate = compile(template.html)(templateParams);
      // console.log('style guide builder : template for', template.fileName);
      // console.log(compiledStyleGuideTemplate);

      // Place compiled html in host page
      await page.evaluate(html => {
        document.body.style.backgroundColor = '#f9f8f8';
        document.body.innerHTML = html;
      }, compiledStyleGuideTemplate);

      // Take shot, only needed in dev
      const path = join(this.pathToSaveImage, template.fileName);
      await page.screenshot({ path: `${path}.png` });

      const screenshot = await page.screenshot({ encoding: 'base64' });
      templateScreenshots.push({ id: template.id, screenshot });
    }

    // Join button screenshots and param data
    const buttonImg = templateScreenshots.find(
      ts => ts.id === StyleGuideTemplateId.button,
    );
    const buttonParams = this.getButtonParams(
      this.metaData.buttonClasses,
      buttonImg!.screenshot,
    );

    // Join typography screenshots and param data
    const typographyImg = templateScreenshots.find(
      ts => ts.id === StyleGuideTemplateId.typography,
    );
    const typographyParams = this.getTypographyParams(
      typographyImg!.screenshot,
    );

    // Join input screenshots and param data
    const inputImg = templateScreenshots.find(
      ts => ts.id === StyleGuideTemplateId.input,
    );
    const inputParams = this.getInputParams(inputImg!.screenshot);

    // Colors get no screenshots
    const colorParams = this.getColorParams(this.metaData.colors);

    // Create params to send to API
    const params: StyleGuideParam[] = colorParams.concat(
      buttonParams,
      typographyParams,
      inputParams,
    );

    // console.log('style guide builder : params', params);

    return params;
  }

  private getButtonParams(
    data: AnalyzedMetaData['buttonClasses'],
    img: string,
  ): StyleGuideParam {
    const params = {
      id: StyleGuideTemplateId.button,
      type: 'button',
      img,
      value: null,
      classes: data,
    };
    return params;
  }

  private getColorParams(data: AnalyzedMetaData['colors']): StyleGuideParam[] {
    const params = data.map(value => ({
      id: StyleGuideTemplateId.color,
      value,
      type: 'color',
    }));
    return params;
  }

  private getTypographyParams(img: string): StyleGuideParam {
    const params = {
      id: StyleGuideTemplateId.typography,
      type: 'typography',
      img,
      value: null,
    };
    return params;
  }

  private getInputParams(img: string): StyleGuideParam {
    const params = {
      id: StyleGuideTemplateId.input,
      type: 'input',
      img,
      value: null,
    };
    return params;
  }
}
