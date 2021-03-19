export enum StyleGuideTemplateId {
  color,
  button,
  input,
  typography,
}

export const styleGuideTemplates = [
  { id: StyleGuideTemplateId.button, fileName: 'button' },
  { id: StyleGuideTemplateId.input, fileName: 'input' },
  { id: StyleGuideTemplateId.typography, fileName: 'typography' },
];
