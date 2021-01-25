import { get, RequestOptions } from 'https';
import { exitWithError, Maybe } from './util';

export class HttpClient {
  static get<T>(hostname: string, path: string, token?: string): Promise<T> {
    const headers = token ? { api_session_token: token } : null;
    const options = {
      hostname,
      path,
      headers,
    } as RequestOptions;
    return new Promise((resolve, reject) => {
      get(options, res => {
        if (res.statusCode !== 200) {
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
            // console.log('http : error parsing data :', data);
            reject(err);
          }
          // console.log('http : got data :', data);
          resolve(data!);
        });

        res.on('error', err => reject(err.message));
      });
    });
  }

  private token: string;

  constructor(private apiURL: string, private apiPort = 0) {}

  public getWithAuth<T>(url: string): Promise<T> {
    return HttpClient.get(this.apiURL, url, this.token);
  }

  /**
   * Hits API to get a session token, registers it on class
   */
  public async generateSessionToken() {
    const path = '/api/user/generate-raw-api-session';
    try {
      const res = await HttpClient.get<{ token: string }>(this.apiURL, path);
      this.token = res.token;
      console.log('http client : got token :', res.token);
    } catch (err) {
      exitWithError(err);
    }
  }

  // public async getUser(): Promise<Maybe<User>> {
  //   const url = 'api/user';
  //   return this.getWithAuth<Maybe<User>>(url);
  // }
}
