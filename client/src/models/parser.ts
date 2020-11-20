export enum Framework {
  Angular,
  React,
  Vue,
  Ember,
  Svelte,
  Vanilla,
}

export type FileExtension = 'js' | 'ts';

export interface ParserConfig {
  framework: Framework;
  extension: FileExtension;
}
