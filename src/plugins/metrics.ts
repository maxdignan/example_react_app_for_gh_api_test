import puppeteer from 'puppeteer';

import { Plugin } from '../models/plugin';
import { ScreenshotResultMetrics } from '../models/screenshot-result';

/**
 * Collects various performance and/or rendering metrics.
 */
export class MetricsPlugin extends Plugin<ScreenshotResultMetrics> {
  static id = 2;
  public name = 'Metrics';
  public description = '';

  /**
   * Parse puppetter-native metrics into proprietary.
   */
  private parseMetrics(metrics: puppeteer.Metrics): ScreenshotResultMetrics {
    return {
      layout: metrics.LayoutDuration,
      script: metrics.ScriptDuration,
      heap: metrics.JSHeapTotalSize,
    };
  }

  async run(page: puppeteer.Page) {
    const data = this.parseMetrics(await page.metrics());
    return super.processRun(MetricsPlugin.id, data);
  }
}
