import { readFileSync } from 'fs';
import { request, RequestOptions } from 'https';

import { Project, CreateProjectAPIParams } from './models/project';
import { RunThrough } from './models/run-through';
import { PageCapture } from './models/page-capture';
import { User } from './models/user';
import { exitWithError } from './util';
import { StyleGuideParam } from './style-guide/style-guide-param';
import { Organization } from './models/organization';
import { Logger } from './logger';

export class HttpClient {
  static isDebug = process.env.DEBUG ? !!+process.env.DEBUG : false;

  /** Location of API. */
  // static apiURL = 'app-qa.emtrey.io';
  static apiURL = 'app-dev.emtrey.io';

  static logger: Logger = new Logger(HttpClient.isDebug);

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
      HttpClient.logger.debug('\n\nhttp : no token supplied\n\n');
    }

    const options = {
      hostname,
      path,
      headers,
      method,
    } as RequestOptions;

    // HttpClient.logger.debug('http client : request :', options);

    return new Promise((resolve, reject) => {
      const req = request(options, res => {
        // 500's and 400's should reject, everything else passes
        const statusCode = res.statusCode?.toString();
        HttpClient.logger.debug('http : status :', statusCode);
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
            HttpClient.logger.debug(
              'http : error parsing data as json :',
              data!,
            );
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

  public setToken(token: string) {
    // Hardcoded to test style guide api
    // this.token = 'guvyxLiw0O1GeCpvk8FwRq92DEAZhQSmEso3z68-zykC2MgvRZK-BizBGsE9';
    this.token = token;
  }

  public get<T>(url: string): Promise<T> {
    return HttpClient.request('GET', HttpClient.apiURL, url, this.token);
  }

  public post<T>(url: string, params: { [key: string]: any }): Promise<T> {
    HttpClient.logger.debug('http : post :', url, this.token);
    return HttpClient.request(
      'POST',
      HttpClient.apiURL,
      url,
      this.token,
      params,
    );
  }

  /**
   * Hits API to get a session token, registers it on class
   * @example:
   * curl https://app-dev.emtrey.io/api/user/generate-raw-api-session
   *
   * https://app-dev.emtrey.io/api-login?api_session_token=TOKEN
   */
  public async generateSessionToken(): Promise<string> {
    const path = '/api/user/generate-raw-api-session';
    let token: string;
    try {
      const res = await HttpClient.request<{ token: string }>(
        'GET',
        HttpClient.apiURL,
        path,
      );
      // HttpClient.logger.debug('http client : generated token :', res);
      token = res.token;
    } catch (err) {
      exitWithError(err);
    }
    return token!;
  }

  /**
   * @example:
   * curl -H "api_session_token guvyxLiw0O1GeCpvk8FwRq92DEAZhQSmEso3z68-zykC2MgvRZK-BizBGsE9" \
      https://app-dev.emtrey.io/api/user
   */
  public async getUser(): Promise<User | null> {
    return this.get<User | null>('/api/user');
  }

  /**
   * @example:
   * curl -H "api_session_token: 7-pPlR953cKsolUz1vzkIzpIsfQ8q_ZQWPqlhGwpLQnRutcm6NP4nVf5eXHh" \
        -d "name=my_organization" \
        -X POST https://app-dev.emtrey.io/api/org
   */
  public async createOrganization(params: {
    name: string;
  }): Promise<Organization> {
    return this.post<Organization>('/api/org', params);
  }

  /**
   * @example:
   * curl -H "api_session_token: guvyxLiw0O1GeCpvk8FwRq92DEAZhQSmEso3z68-zykC2MgvRZK-BizBGsE9" \
      -d "name=my_first_project&github_url=foo&org_id=1" \
      -X POST https://app-dev.emtrey.io/api/project
   */
  public async createProject(params: CreateProjectAPIParams): Promise<Project> {
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
        HttpClient.logger.debug(`STATUS: ${res.statusCode}`);
        HttpClient.logger.debug(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.on('data', chunk => HttpClient.logger.debug(`BODY: ${chunk}`));
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

  /**
   * @example:
   * curl -H "api_session_token: guvyxLiw0O1GeCpvk8FwRq92DEAZhQSmEso3z68-zykC2MgvRZK-BizBGsE9" \
      --data "@style-guide-payload.json" \
      --header "Content-Type: application/json" \
      -X POST https://app-dev.emtrey.io/api/styles/2
   */
  public async postStyleGuide(
    projectId: number,
    styles: StyleGuideParam[],
  ): Promise<Project> {
    const params = { styles };
    return this.post(`api/styles/${projectId}`, params);
  }
}