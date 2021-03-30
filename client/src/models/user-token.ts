import * as fs from 'fs';
import { join } from 'path';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

import { exitWithError } from '../util';
import { User } from './user';

export interface UserTokenInterface {
  token: string;
  email?: string;
  first_name: string;
  organizationId: number;
  projectId: number;
}

export class UserToken implements UserTokenInterface {
  static emtreyDir = '.emtrey';
  static cryptoSecret = Array.from({ length: 32 }, (_, i) =>
    String.fromCharCode(88 + ++i),
  ).join('');

  readonly token: string;
  readonly email?: string;
  readonly first_name: string;
  readonly organizationId: number;
  readonly projectId: number;

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

  static encrypt(
    text: string,
    algorithm = 'aes-256-ctr',
  ): { iv: string; content: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(algorithm, UserToken.cryptoSecret, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
    };
  }

  static decrypt(
    hash: { iv: string; content: string },
    algorithm = 'aes-256-ctr',
  ): string {
    const decipher = createDecipheriv(
      algorithm,
      UserToken.cryptoSecret,
      Buffer.from(hash.iv, 'hex'),
    );
    const decrpyted = Buffer.concat([
      decipher.update(Buffer.from(hash.content, 'hex')),
      decipher.final(),
    ]);
    return decrpyted.toString();
  }

  static getJoinedFileName(dir: string): string {
    return join(dir, UserToken.emtreyDir, 'token');
  }

  static createEmtreyDirectory(dir: string) {}
  /**
   * Write user info to file system.
   */
  static async saveToFS(
    dir: string,
    user: User,
    sessionToken: string,
    projectId: number,
    organizationId: number,
  ): Promise<UserToken> {
    const token: UserTokenInterface = {
      email: user.email,
      first_name: user.first_name || 'Anon',
      token: sessionToken,
      projectId,
      organizationId,
    };
    console.log('user token : saving');
    try {
      const emtreyDir = join(dir, UserToken.emtreyDir);
      const exists = fs.existsSync(emtreyDir);
      // Need to create parent directory
      !exists && fs.mkdirSync(emtreyDir);
      const fileName = UserToken.getJoinedFileName(dir);
      // Encrypt content
      const encrypted = UserToken.encrypt(JSON.stringify(token));
      const fileContent = JSON.stringify(encrypted);
      await fs.promises.writeFile(fileName, fileContent, 'utf-8');
    } catch (err) {
      exitWithError(err);
    }
    return token;
  }

  /**
   * Read cached user info from file system.
   */
  static async readUserFromFS(dir: string): Promise<UserToken | null> {
    let token: UserToken | null = null;
    try {
      const fileName = UserToken.getJoinedFileName(dir);
      console.log('user token : reading from file :', fileName);
      const fileContent = await fs.promises.readFile(fileName, 'utf-8');
      token = UserToken.fromJSON(UserToken.decrypt(JSON.parse(fileContent)));
    } catch (err) {
      // Assume error is ENOENT (no entity)
      console.log('user token : error :', err);
    }
    return token;
  }

  /**
   * Deletes cached user info file.
   */
  static deleteUserFromFS(dir: string) {
    const fileName = UserToken.getJoinedFileName(dir);
    return fs.promises.unlink(fileName);
  }

  constructor(data: UserTokenInterface) {
    this.token = data.token;
    this.email = data.email;
    this.organizationId = data.organizationId;
    this.projectId = data.projectId;
    this.first_name = data.first_name;
  }
}
