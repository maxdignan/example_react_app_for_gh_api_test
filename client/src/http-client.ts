import { request, RequestOptions } from 'https';
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

    //   headers: {
    //     'Content-Type': 'application/json',
    // },

    const options = {
      hostname,
      path,
      headers,
      method,
    } as RequestOptions;

    console.log('http client : request :', options);

    return new Promise((resolve, reject) => {
      const req = request(options, res => {
        // 500's should reject, everything else passes
        if (res.statusCode?.toString().startsWith('5')) {
          reject(res.statusCode!.toString());
        }

        const chunks: Buffer[] = [];

        res.on('data', data => {
          chunks.push(data);
        });

        res.on('end', () => {
          let data: T;
          try {
            const body = Buffer.concat(chunks);
            const isJSON = res.headers['content-type']?.includes('/json');
            if (isJSON) {
              data = JSON.parse(body.toString());
            }
            // data = JSON.parse(raw);
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

  public async getUser<T = User>(): Promise<T> {
    const url = '/api/user';
    return this.get<T>(url);
  }

  /**
   * Post run through results.
   */
  public async postResults() {
    const url = 'api/run-through';
    return this.post(url, {});
    // curl -H "api_session_token: fYBIu4nP85qE-0xW0BhyooG5EdbPrUZ6QcwnkM3JCH3Ea30sO9unMNOOThsWl" -d "branch=feature/cool&commit=983u92f9ejwio3j9efw&project_id=2" -X POST https://early-testing-emtrey.herokuapp.com/api/run-through
  }
}
