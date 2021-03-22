import { Organization } from './organization';
import { Project } from './project';

export interface User {
  email: string;
  first_name: string | null;
  last_name: string | null;
  id: number;
  orgs: ReadonlyArray<Organization>;
  projects: ReadonlyArray<Project>;
}
