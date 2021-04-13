import { Product } from 'puppeteer';

export type PageCaptureType = 'page' | 'component';

/**
 * @example:
 * {"page_capture":{"page_load_metrics":null,"page_route":"/hellopage","page_title":"HelloPage","resolved":false,"s3_object_key":"_WdZWjOyZk7yibIKEYR-MEAD"},"url_to_put_to":"https://s3.amazonaws.com/page-capture-dev/_WdZWjOyZk7yibIKEYR-MEAD?contentType=binary%2Foctet-stream&x-amz-acl=public-read&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4LXJZS2YDDWBHCC7%2F20210218%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20210218T230134Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=ffd49215757dcfc42b3fac64945f95b2093d2708604540b7e448d66d0ec5e115"}
 */
export interface PageCapture {
  url_to_put_to: string;
  page_capture: {
    page_load_metrics: null;
    page_route: string;
    page_title: string;
    resolved: boolean;
    s3_object_key: string;
    name: string;
    browser: Product;
    type: PageCaptureType;
    user_agent: string;
    screen_resolution_id: number;
  };
}

// Send to API
export type PageCaptureAPIParams = Pick<
  PageCapture['page_capture'],
  | 'page_route'
  | 'page_title' // Required by have content by API - this needs changed
  | 'name' // Required by have content by API - Should be component name in the future
  | 'browser' // Required by have content by API
  | 'type' // Required by have content by API
  | 'user_agent' // Required by have content by API
  | 'screen_resolution_id' // Required by have content by API - Needs to be tracked in the results data
> & { run_through_id: number };
