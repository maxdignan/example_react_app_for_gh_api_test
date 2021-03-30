import { join } from 'path';
import puppeteer from 'puppeteer';
import { compile } from 'handlebars';

import { AnalyzedMetaData, MetaDataResult } from '../models/screenshot-result';
import { getElementClassCounts } from '../util';
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
   * Extract commonly-used colors on given page via document's stylesheets.
   */
  static getAllColorsInStyleSheets = async (
    page: puppeteer.Page,
  ): Promise<string[]> => {
    const colors = await page.evaluate(() =>
      Array.from(document.styleSheets)
        // Only ones that belong to this domain
        // This is to avoid the DOM Exception: Failed to read the 'cssRules' property from 'CSSStyleSheet':
        .filter(
          styleSheet =>
            !styleSheet.href ||
            styleSheet.href.startsWith(window.location.origin),
        )
        // Get all background and foreground colors from all elements
        .flatMap(s =>
          Array.from(s.rules)
            .filter(r => r instanceof CSSStyleRule)
            .map((r: CSSStyleRule) => r.style.backgroundColor || r.style.color),
        )
        // Don't care for non-color values
        .filter(c => !!c && c !== 'inherit' && c !== 'transparent')
        // Strip out inlined `--var` values
        // Example:
        // rgba(255, 183, 0, var(--bg-opacity)) -> rgba(255, 183, 0)
        .map(c => c.replace(/,.var?.+(?=\))/, ''))
        // Only unique values
        .filter(
          (value: string, index: number, self: string[]) =>
            self.indexOf(value) === index,
        ),
    );

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

    const colors = Object.keys(colorMap)
      .sort((a, b) => (colorMap[a] > colorMap[b] ? -1 : 1))
      // Only get the first N colors
      .slice(0, 10);

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
    /** @todo: Need to make this dynamic based off template content */
    await page.setViewport({
      width: 400,
      height: 300,
      deviceScaleFactor: 2,
    });

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
      const compiledStyleGuideTemplate = compile(template.html)(templateParams);
      // console.log('\n\n');
      // console.log('style guide builder : template for', template.fileName);
      // console.log(compiledStyleGuideTemplate);
      // console.log('\n\n');

      // Place compiled html in host page
      await page.evaluate(html => {
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
      // typographyParams,
      // inputParams,
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
