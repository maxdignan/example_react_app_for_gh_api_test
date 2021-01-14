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
  url: string;
  hasInputs: string[];
  buttonClasses: string[];
  // inputClasses: string[];
}

export interface Result {
  results: ScreenshotResult[];
}

export interface AnalyzedMetaData {
  // Button classes have no period and can be appended directly to an element
  buttonClasses: string[];
  // inputClasses: string[];
}
