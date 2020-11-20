export interface VisualRegression {
  _id: string;
  name: string;
  image: string;
  url: string;
  title: string;
  metrics: {
    layout: number;
    script: number;
    heap: number;
  };
}

export type VisualRegressionWithoutID = Pick<
  VisualRegression,
  Exclude<keyof VisualRegression, '_id'>
>;

export interface VisualRegressionSuiteModel {
  _id: string;
  creator: string;
  branch: string;
  created: Date;
  application: string;
  results: VisualRegression[];
}
