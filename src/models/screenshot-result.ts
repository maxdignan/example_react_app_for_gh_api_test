import { StyleGuideParam } from '../style-guide/style-guide-param';
import { PluginResult } from './plugin';
import { Viewport } from './viewport';

export interface ScreenshotResultMetrics {
  layout: number;
  script: number;
  heap: number;
}

export interface ScreenshotResult {
  url: string;
  plugins: PluginResult<unknown>[];
  viewport: Viewport;
}

export interface MetaDataResult {
  // Route of result
  url: string;
  // Are there any <input> elements on this page?
  hasInputs: string[];
  // All classes of <button> elements
  buttonClasses: string[];
  // All colors extracted from the page's styles
  colors: string[];
  // inputClasses: string[];
}

export interface Result {
  browserInfo: {
    userAgent: string;
  };
  results: ScreenshotResult[];
  styleGuide: StyleGuideParam[];
}

export interface AnalyzedMetaData {
  // Button classes have no period and can be appended directly to an element
  buttonClasses: string[];
  colors: string[];
}
