import { join } from 'path';
import * as fs from 'fs';

export interface UserTokenInterface {
  token: string;
  email?: string;
  organizationId?: number;
}

export class UserToken implements UserTokenInterface {
  readonly token: string;
  readonly email?: string;
  readonly organizationId?: number;

  // Relative location of cached user token on fs.
  static tokenName = 'stmp/.emtrey';

  private static fromJSON(json: string): UserToken {
    let token: UserTokenInterface = {} as UserTokenInterface;
    try {
      token = JSON.parse(json);
    } catch (err) {
      // console.log('user token : from json :', json);
      // console.log(err);
    }
    return new UserToken(token);
  }

  /**
   * Read cached token from Emtrey dir.
   * `./tmp/.emtrey`
   */
  static async readFromFile(): Promise<UserToken | null> {
    let fileContent = '';
    try {
      const path = join(__dirname, '..', '..', UserToken.tokenName);
      fileContent = await fs.promises.readFile(path, 'utf-8');
      return UserToken.fromJSON(fileContent);
    } catch (err) {
      // console.log('user token : error reading from file :', err);
      return null;
    }
  }

  constructor(data: UserTokenInterface) {
    this.token = data.token;
    this.email = data.email;
    this.organizationId = data.organizationId;
  }
}
