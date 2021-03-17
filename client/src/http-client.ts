import { readFileSync } from 'fs';
import { request, RequestOptions } from 'https';

import { Project } from './models/project';
import { RunThrough } from './models/run-through';
import { PageCapture } from './models/page-capture';
import { User } from './models/user';
import { exitWithError } from './util';
import { StyleGuideParam } from './style-guide/style-guide-param';

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

    if (!token) {
      console.warn('http : no token supplied');
    }

    const options = {
      hostname,
      path,
      headers,
      method,
    } as RequestOptions;

    // console.log('http client : request :', options);

    return new Promise((resolve, reject) => {
      const req = request(options, res => {
        // 500's and 400's should reject, everything else passes
        const statusCode = res.statusCode?.toString();
        console.log('http : status :', statusCode);
        if (statusCode?.startsWith('5') || statusCode?.startsWith('4')) {
          const message = `http : bad response for url : ${options.path}, status : ${res.statusMessage}`;
          reject(message);
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
        req.setHeader('content-type', 'application/json');
        req.write(JSON.stringify(params));
      }

      req.end();
    });
  }

  public token: string;

  constructor(private apiURL: string) {}

  public setToken(token: string) {
    this.token = 'Qz4CQhbx52rEYCBlDU1mAnPC9R8fTvXM7xxSQV4uD-Ua3rhEcl9dHNqHea6J';
  }

  public get<T>(url: string): Promise<T> {
    return HttpClient.request('GET', this.apiURL, url, this.token);
  }

  public post<T>(url: string, params: { [key: string]: any }): Promise<T> {
    console.log('http : post :', url, this.token, params);
    return HttpClient.request('POST', this.apiURL, url, this.token, params);
  }

  /**
   * Hits API to get a session token, registers it on class
   * @example:
   * curl https://app-dev.emtrey.io/api/user/generate-raw-api-session
   */
  public async generateAndSetSessionToken(): Promise<string> {
    const path = '/api/user/generate-raw-api-session';
    let token: string;
    try {
      const res = await HttpClient.request<{ token: string }>(
        'GET',
        this.apiURL,
        path,
      );
      // console.log('http client : generated token :', res);
      token = res.token;
    } catch (err) {
      exitWithError(err);
    }
    return token!;
  }

  /**
   * @example:
   * curl -H "api_session_token Qz4CQhbx52rEYCBlDU1mAnPC9R8fTvXM7xxSQV4uD-Ua3rhEcl9dHNqHea6J" \
      https://app-dev.emtrey.io/api/user
   */
  public async getUser(): Promise<User | null> {
    return this.get<User | null>('/api/user');
  }

  /**
   * @example:
   * curl -H "api_session_token: Qz4CQhbx52rEYCBlDU1mAnPC9R8fTvXM7xxSQV4uD-Ua3rhEcl9dHNqHea6J" \
      -d "name=my_first_project&github_url=foo&org_id=1" \
      -X POST https://app-dev.emtrey.io/api/project
   */
  public async createProject(): Promise<Project> {
    const params = {
      name: 'foo',
      github_url: null,
      org_id: null,
    };
    return this.post<Project>('/api/project', params);
  }

  /**
   * @param:
   * `branch` - May cause 500 if not master
   * @example:
   * curl -H "api_session_token: Qz4CQhbx52rEYCBlDU1mAnPC9R8fTvXM7xxSQV4uD-Ua3rhEcl9dHNqHea6J" \
      -d 'branch=master' \
      -d 'commit=newcommit3' \
      -d 'project_id=36' \
      -X POST https://app-dev.emtrey.io/api/run-through \
      -v
   */
  public async postRunThrough(params: {
    branch: string;
    commit: string;
    project_id: number;
  }): Promise<RunThrough> {
    return this.post<RunThrough>('api/run-through', params);
  }

  /**
   * @example:
   * curl -H "api_session_token: Qz4CQhbx52rEYCBlDU1mAnPC9R8fTvXM7xxSQV4uD-Ua3rhEcl9dHNqHea6J" \
      -d "page_route=/hellopage&page_title=HelloPage&run_through_id=48" \
      -X POST https://app-dev.emtrey.io/api/page-capture
   */
  public async postPageCapture(params: {
    page_route: string;
    page_title: string;
    run_through_id: number;
  }): Promise<PageCapture> {
    return this.post<PageCapture>('api/page-capture', params);
  }

  /**
   * @todo:
   * We could get the buffer directly from puppeteer instead of reading from disk.
   * Which might speed things up, but use more memory.
   */
  public async postScreenshotToS3(
    file: string,
    pageCapture: PageCapture,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileBuffer = readFileSync(file);

      const options = {
        hostname: 's3.amazonaws.com',
        method: 'PUT',
        path: pageCapture.url_to_put_to,
      };

      const req = request(options, res => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.on('data', chunk => console.log(`BODY: ${chunk}`));
        res.on('end', () => resolve());
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

  public async startDiff(pageCapture: PageCapture): Promise<void> {
    const params = {
      s3_object_key: pageCapture.page_capture.s3_object_key,
    };
    return this.post('api/page-capture/done-uploading', params);
  }

  public async postStyleGuide(
    projectId: number,
    styles: StyleGuideParam[],
  ): Promise<void> {
    const params = { styles };
    return this.post(`api/styles/${projectId}`, params);
  }
}
