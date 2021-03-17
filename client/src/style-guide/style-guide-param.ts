export enum StyleGuideTemplateId {
  color,
  button,
  input,
}

export interface StyleGuideParam {
  id: StyleGuideTemplateId;
  type: string;
  value: string | null;
  classes?: string[];
  img?: string;
}
