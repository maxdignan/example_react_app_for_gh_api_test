import puppeteer from 'puppeteer';

export interface PluginResult<T> {
  id: number;
  data: T;
}

export abstract class Plugin<T> {
  abstract id: number;
  abstract name: string;
  abstract description: string;
  abstract run(page: puppeteer.Page): Promise<PluginResult<unknown>>;

  /**
   * Process the raw response from plugin execution.
   */
  protected processRun(result: T): PluginResult<T> {
    return {
      id: this.id,
      data: result,
    };
  }
}
