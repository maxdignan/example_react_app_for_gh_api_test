export interface ScreenshotResultMetrics {
  layout: number;
  script: number;
  heap: number;
}

interface ScreenshotResultInterface {
  url: string;
  // fileName: string;
  // Will be moved to plugins
  // pageTitle: string;
  // metrics: ScreenshotResultMetrics;
}

export type ScreenshotResult = Readonly<ScreenshotResultInterface>;
