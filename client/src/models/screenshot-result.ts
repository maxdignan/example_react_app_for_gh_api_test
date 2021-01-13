import { PluginResult } from './plugin';

export interface ScreenshotResultMetrics {
  layout: number;
  script: number;
  heap: number;
}

export interface ScreenshotResult {
  url: string;
  plugins: PluginResult<unknown>[];
  // Will be moved to plugins
  // fileName: string;
  // pageTitle: string;
  // metrics: ScreenshotResultMetrics;
}

export interface MetaDataResult {
  metaData: any;
}

export interface Result {
  results: ScreenshotResult[];
  metaData: MetaDataResult[];
}
