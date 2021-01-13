import { PluginResult } from './plugin';

export interface ScreenshotResultMetrics {
  layout: number;
  script: number;
  heap: number;
}

export interface ScreenshotResult {
  url: string;
  plugins: PluginResult<unknown>[];
}

export interface MetaDataResult {
  metaData: any;
}

export interface Result {
  results: ScreenshotResult[];
  // metaData: any;
}

export interface AnalyzedMetaData {
  buttonClasses: string[];
}
