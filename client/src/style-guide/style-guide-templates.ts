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
}

export const styleGuideTemplates: ReadonlyArray<StyleGuideTemplate> = [
  { id: StyleGuideTemplateId.button, fileName: 'button', html: buttonTemplate },
  { id: StyleGuideTemplateId.input, fileName: 'input', html: inputTemplate },
  {
    id: StyleGuideTemplateId.typography,
    fileName: 'typography',
    html: typographyTemplate,
  },
];
