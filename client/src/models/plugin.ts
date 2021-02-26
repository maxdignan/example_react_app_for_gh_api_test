import puppeteer from 'puppeteer';

export interface PluginResult<T> {
  pluginId: number;
  data: T;
}

export interface PluginOptions {
  routeId: string;
  path: string;
}

export abstract class Plugin<T> {
  abstract name: string;
  abstract description: string;
  abstract run(
    page: puppeteer.Page,
    options: PluginOptions,
  ): Promise<PluginResult<unknown>>;

  /**
   * Process the raw response from plugin execution.
   */
  protected processRun(pluginId: number, result: T): PluginResult<T> {
    return {
      pluginId,
      data: result,
    };
  }
}
