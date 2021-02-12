import { readFileSync } from 'fs';
import { request, RequestOptions } from 'https';

import { Project } from './models/project';
import { User } from './models/user';
import { exitWithError } from './util';

export class HttpClient {
  static request<T>(
    method: 'GET' | 'POST' = 'GET',
    hostname: string,
    path: string,
    token?: string,
    params?: { [key: string]: any },
  ): Promise<T> {
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    const headers = token ? { api_session_token: token } : null;
    const options = {
      hostname,
      path,
      headers,
      method,
    } as RequestOptions;

    // console.log('http client : request :', options);

    return new Promise((resolve, reject) => {
      const req = request(options, res => {
        // 500's should reject, everything else passes
        if (res.statusCode?.toString().startsWith('5')) {
          reject(res.statusCode!.toString());
        }

        const chunks: Buffer[] = [];

        res.on('data', data => chunks.push(data));

        res.on('end', () => {
          let data: T;
          try {
            const body = Buffer.concat(chunks);
            const isJSON = res.headers['content-type']?.includes('/json');
            if (isJSON) {
              data = JSON.parse(body.toString());
            }
          } catch (err) {
            console.log('http : error parsing data as json :', data!);
            resolve(data!);
          }
          resolve(data!);
        });

        res.on('error', err => reject(err.message));
      });

      if (method === 'POST' && params) {
        req.write(JSON.stringify(params));
      }

      req.end();
    });
  }

  public token: string;

  constructor(private apiURL: string) {}

  public get<T>(url: string): Promise<T> {
    return HttpClient.request('GET', this.apiURL, url, this.token);
  }

  public post<T>(url: string, params: { [key: string]: any }): Promise<T> {
    return HttpClient.request('POST', this.apiURL, url, this.token, params);
  }

  /**
   * Hits API to get a session token, registers it on class
   * @example:
   * curl https://app-dev.emtrey.io/api/user/generate-raw-api-session
   */
  public async generateSessionToken(): Promise<string> {
    const path = '/api/user/generate-raw-api-session';
    try {
      const res = await HttpClient.request<{ token: string }>(
        'GET',
        this.apiURL,
        path,
      );
      console.log('http client : generated token :', res);
      this.token = res.token;
    } catch (err) {
      exitWithError(err);
    }
    return this.token;
  }

  /**
   * @example:
   * curl -H "api_session_token haDZ3hKdX46sbaeTXVkHzLZ-gfeEp6IoNOqHmdGaXfDa7d0K4jEprWo61-58" \
      https://app-dev.emtrey.io/api/user
   */
  public async getUser(): Promise<User | null> {
    return this.get<User | null>('/api/user');
  }

  /**
   * @example:
   * curl -H "api_session_token: cGIiCtRA-fSufvEPjCn8e1dse6xwXKza0ELY2fY59Wds1PbLQKIL8QAxun2J" -d "name=my_first_project&github_url=foo&org_id=1" -X POST https://app-dev.emtrey.io/api/project >> error.htm
   */
  public async createProject(): Promise<Project> {
    const params = {
      name: 'foo',
      github_url: null,
      org_id: null,
    };
    return this.post<Project>('api/project', params);
  }

  /**
   * @example:
   * curl -H "api_session_token: cGIiCtRA-fSufvEPjCn8e1dse6xwXKza0ELY2fY59Wds1PbLQKIL8QAxun2J" \
      -d "branch=feature/cool&commit=1b40487461a3624c669195979fdd2d8c642cca6c&project_id=2" \
      -X POST https://app-dev.emtrey.io/api/run-through
   */
  public async postRunThrough(data: {
    branch: string;
    commit: string;
  }): Promise<{} | null> {
    const params = {
      branch: data.branch,
      commit: data.commit,
      project_id: 2,
    };
    return this.post<{} | null>('api/run-through', params);
  }

  /**
   * @example:
   * curl -H "api_session_token: fYBIu4nP85qE-0xW0BhyooG5EdbPrUZ6QcwnkM3JCH3Ea30sO9unMNOOThsW" \
      -d "page_route=/hellopage&page_title=HelloPage&run_through_id=34" \
      -X POST https://app-dev.emtrey.io/api/page-capture
   */
  public async postPageCapture(): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileBuffer = readFileSync(__dirname + '/emtrey_screenshots.jpg');

      const options = {
        hostname: 's3.amazonaws.com',
        path:
          '/page-capture-dev/AzzXJNGP0uiVKsxjdGhJkPCO?contentType=binary%2Foctet-stream&x-amz-acl=public-read&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4LXJZS2YDDWBHCC7%2F20210107%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20210107T202708Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=7d6471ca92f25aa01da159564780529fc03f189981b8da1c3b8ee93696bbf94b',
        method: 'PUT',
      };

      const req = request(options, res => {
        // console.log(`STATUS: ${res.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        // res.on('data', chunk => {
        //   console.log(`BODY: ${chunk}`);
        // });
        res.on('end', () => {
          console.log('No more data in response.');
          resolve();
        });
      });

      req.setHeader('content-type', 'binary/octet-stream');
      req.setHeader('content-length', Buffer.byteLength(fileBuffer));
      req.removeHeader('Transfer-Encoding');

      req.on('error', err => {
        const { message } = err;
        console.error(`problem with request: ${message}`);
        reject();
        exitWithError(message);
      });

      // Write data to request body
      req.write(fileBuffer);
      req.end();
    });
  }

  /**
   * After all other API endpoints has been completed.
   */
  public async startDiff(): Promise<void> {
    const params = {};
    // return this.post<{}>('api/page-capture/done-uploading', params);
  }
}
