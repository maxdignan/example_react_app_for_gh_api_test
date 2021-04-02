import { Viewport } from 'puppeteer';

import { default as buttonTemplate } from './templates/button.html';
import { default as inputTemplate } from './templates/input.html';
import { default as typographyTemplate } from './templates/typography.html';

export enum StyleGuideTemplateId {
  color,
  button,
  input,
  typography,
}

interface StyleGuideTemplate {
  id: StyleGuideTemplateId;
  fileName: string;
  html: string;
  viewport: Viewport;
}

const baseViewport: Partial<Viewport> = {
  deviceScaleFactor: 2,
};

export const styleGuideTemplates: ReadonlyArray<StyleGuideTemplate> = [
  {
    id: StyleGuideTemplateId.button,
    fileName: 'button',
    html: buttonTemplate,
    viewport: {
      ...baseViewport,
      width: 800,
      height: 300,
    },
  },
  {
    id: StyleGuideTemplateId.input,
    fileName: 'input',
    html: inputTemplate,
    viewport: {
      ...baseViewport,
      width: 800,
      height: 300,
    },
  },
  {
    id: StyleGuideTemplateId.typography,
    fileName: 'typography',
    html: typographyTemplate,
    viewport: {
      ...baseViewport,
      width: 800,
      height: 540,
    },
  },
];
