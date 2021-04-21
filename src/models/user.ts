import { Organization } from './organization';
import { Project } from './project';

/**
 * @example
 * {
  email: '',
  first_name: '',
  last_name: '',
  id: 2,
  orgs: [ { name: 'H2L', id: 2 } ],
  projects: [
    {
      name: 'emtreyReactTest',
      org_id: 2,
      base_branch_name: 'main',
      screen_resolutions: [
        { name: 'Desktop', x: 1200, y: 900, on: true, id: 1 },
        { name: 'Tablet', x: 768, y: 1024, on: true, id: 2 },
        { name: 'Mobile', x: 375, y: 812, on: true, id: 3 }
      ],
      archive_flag: false,
      id: 1
    }
  ]
}
 */
export interface User {
  email: string;
  first_name: string | null;
  last_name: string | null;
  id: number;
  orgs: ReadonlyArray<Organization>;
  projects: ReadonlyArray<Project>;
}
