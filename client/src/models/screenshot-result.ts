export interface ScreenshotResultMetrics {
  layout: number;
  script: number;
  heap: number;
}

interface ScreenshotResultInterface {
  fileName: string;
  url: string;
  pageTitle: string;
  metrics: ScreenshotResultMetrics;
}

export type ScreenshotResult = Readonly<ScreenshotResultInterface>;
