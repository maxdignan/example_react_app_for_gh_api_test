import { Framework } from './framework';

export interface ApplicationModel {
  _id: string;
  name: string;
  created: Date;
  framework: Framework;
  members: string[];
}
