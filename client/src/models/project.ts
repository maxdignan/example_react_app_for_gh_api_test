/**
 *  curl -H "api_session_token: haDZ3hKdX46sbaeTXVkHzLZ-gfeEp6IoNOqHmdGaXfDa7d0K4jEprWo61-58" \
      -d "name=project2&github_url=foo&org_id=1" \
      -X POST https://app-dev.emtrey.io/api/project
  ->            
   {"name":"project2","org_id":1,"base_branch_name":"master","screen_resolutions":{"Desktop":"on:1600x900","Mobile":"on:800x200","Tablet":"on:1300x800"},"archive_flag":false,"id":35}%                  

   {"name":"my_first_project","org_id":1,"base_branch_name":"master","screen_resolutions":[{"name":"Desktop","x":1600,"y":900,"on":true,"id":13},{"name":"Tablet","x":1300,"y":800,"on":true,"id":14},{"name":"Mobile","x":1000,"y":1000,"on":true,"id":15}],"archive_flag":false,"id":40}
   
 */

export interface Project {
  id: number;
  org_id: number;
  name: string;
  base_branch_name: string;
  screen_resolutions: {
    Desktop: string;
    Mobile: string;
    Tablet: string;
  };
  archive_flag: boolean;
}

export interface CreateProjectAPIParams {
  name: string;
  github_url: string | null;
  org_id: number;
}
