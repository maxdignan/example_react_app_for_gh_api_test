import { get, RequestOptions } from 'https';
import { exitWithError } from './util';

export class HttpClient {
  static get<T>(hostname: string, path: string, token?: string): Promise<T> {
    if (!path.startsWith('/')) {
      throw new Error('Path must start with a forward slash');
    }

    const headers = token ? { api_session_token: token } : null;
    const options = {
      hostname,
      path,
      headers,
    } as RequestOptions;

    // console.log('http client : get :', hostname, path, token);

    return new Promise((resolve, reject) => {
      get(options, res => {
        // 500's should reject, everything else passes
        if (res.statusCode?.toString().startsWith('5')) {
          reject(res.statusCode!.toString());
        }

        let raw = '';
        res.on('data', d => {
          // console.log('http : got data :', d);
          raw += d;
        });

        res.on('end', () => {
          let data: T;
          try {
            data = JSON.parse(raw);
          } catch (err) {
            // console.log('http : error parsing data as json :', data!);
            resolve(data!);
          }
          resolve(data!);
        });

        res.on('error', err => reject(err.message));
      });
    });
  }

  token: string;

  constructor(private apiURL: string, private apiPort = 0) {}

  public getWithAuth<T>(url: string): Promise<T> {
    return HttpClient.get(this.apiURL, url, this.token);
  }

  /**
   * Hits API to get a session token, registers it on class
   */
  public async generateSessionToken(): Promise<string> {
    const path = '/api/user/generate-raw-api-session';
    try {
      const res = await HttpClient.get<{ token: string }>(this.apiURL, path);
      this.token = res.token;
      // console.log('http client : generated token :', res.token);
    } catch (err) {
      exitWithError(err);
    }
    return this.token;
  }

  public async getUser(): Promise<any> {
    const url = '/api/user';
    return this.getWithAuth<any>(url);
  }
}
