import { StyleGuideTemplateId } from './style-guide-templates';

export interface StyleGuideParam {
  id: StyleGuideTemplateId;
  type: string;
  value: string | null;
  classes?: string[];
  img?: string;
}
