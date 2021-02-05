/**
 *  curl -H "api_session_token: haDZ3hKdX46sbaeTXVkHzLZ-gfeEp6IoNOqHmdGaXfDa7d0K4jEprWo61-58" \
      -d "name=project2&github_url=foo&org_id=1" \
      -X POST https://app-dev.emtrey.io/api/project
  ->            
   {"name":"project2","org_id":1,"base_branch_name":"master","screen_resolutions":{"Desktop":"on:1600x900","Mobile":"on:800x200","Tablet":"on:1300x800"},"archive_flag":false,"id":35}%                  
 */
export interface Project {
  name: string;
  org_id: number;
  base_branch_name: string;
  screen_resolutions: {
    Desktop: string;
    Mobile: string;
    Tablet: string;
  };
  archive_flag: boolean;
  id: number;
}
