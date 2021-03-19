import { tmpdir } from 'os';
import { exitWithError } from '../util';
import * as fs from 'fs';
import { User } from './user';

export interface UserTokenInterface {
  token: string;
  email?: string;
  organizationId?: number;
}

export class UserToken implements UserTokenInterface {
  readonly token: string;
  readonly email?: string;
  readonly first_name?: string;
  readonly organizationId?: number;

  // Temp location of cached user token on fs
  static tokenFile = `${tmpdir()}/emtrey`;

  /**
   * Instantiate user token from string.
   */
  public static fromJSON(json: string): UserToken {
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
   * Write user info to file system.
   */
  static async saveToFS(user: User, sessionToken: string) {
    const token = {
      email: user.email,
      first_name: user.first_name || 'Anon',
      token: sessionToken,
    };
    try {
      await fs.promises.writeFile(
        UserToken.tokenFile,
        JSON.stringify(token),
        'utf-8',
      );
      return true;
    } catch (err) {
      exitWithError(err);
    }
  }

  /**
   * Read cached user info from file system.
   */
  static async readUserFromFS(): Promise<UserToken | null> {
    let token: UserToken | null = null;
    console.log('user token : reading from file :', UserToken.tokenFile);
    try {
      const fileContent = await fs.promises.readFile(
        UserToken.tokenFile,
        'utf-8',
      );
      console.log('got user file contents', fileContent);
      token = UserToken.fromJSON(fileContent);
    } catch (err) {
      // Assume error is ENOENT (no entity)
      // console.log(err);
    }
    return token;
  }

  /**
   * Deletes cached user info file.
   */
  static deleteUserFromFS() {
    return fs.promises.unlink(UserToken.tokenFile);
  }

  constructor(data: UserTokenInterface) {
    this.token = data.token;
    this.email = data.email;
    this.organizationId = data.organizationId;
  }
}
