import fs from 'fs';
import { join } from 'path';
import { inspect } from 'util';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

import { exitWithError } from '../util';
import { logger } from '../logger';
import { User } from './user';
import { Project } from './project';

export interface UserTokenInterface {
  token: string;
  email?: string;
  first_name: string;
  organizationId: number;
  project: Project;
}

export class UserToken implements UserTokenInterface {
  /** @todo: This repeats in project config, share it. */
  static emtreyDir = '.emtrey';
  static cryptoSecret = Array.from({ length: 32 }, (_, i) =>
    String.fromCharCode(88 + ++i),
  ).join('');

  readonly token: string;
  readonly email?: string;
  readonly first_name: string;
  readonly organizationId: number;
  readonly project: Project;

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

  /**
   * Write user info to file system.
   */
  static async saveToFS(
    appDir: string,
    user: User,
    sessionToken: string,
    project: Project,
    organizationId: number,
  ): Promise<UserToken> {
    const token: UserTokenInterface = {
      email: user.email,
      first_name: user.first_name || 'Anon',
      token: sessionToken,
      project,
      organizationId,
    };
    logger.debug('user token : saving');
    try {
      const emtreyDir = join(appDir, UserToken.emtreyDir);
      const exists = fs.existsSync(emtreyDir);
      // Need to create parent directory
      !exists && fs.mkdirSync(emtreyDir);
      const fileName = UserToken.getJoinedFileName(appDir);
      // Encrypt content
      const encrypted = UserToken.encrypt(JSON.stringify(token));
      const fileContent = JSON.stringify(encrypted);
      await fs.promises.writeFile(fileName, fileContent, 'utf-8');
      await UserToken.tryPatchingGitIgnore(appDir);
    } catch (err) {
      exitWithError(err);
    }
    return token;
  }

  static async tryPatchingGitIgnore(appDir: string): Promise<boolean> {
    logger.debug('user token : trying to patch .gitignore :', appDir);
    const filePath = `${appDir}/.gitignore`;
    let fileContent: string;
    try {
      fileContent = await fs.promises.readFile(filePath, 'utf-8');
    } catch (err) {
      logger.debug(err);
      return false;
    }
    const hasIgnoredEmtreyDir = fileContent.includes(UserToken.emtreyDir);
    if (hasIgnoredEmtreyDir) {
      logger.debug('user token : emtrey content already ignored');
      return true;
    }
    const newFileContent = `${fileContent}\n${UserToken.emtreyDir}`;
    logger.debug('user token : writing emtrey content to .gitignore');
    try {
      await fs.promises.writeFile(filePath, newFileContent, 'utf-8');
    } catch (err) {
      logger.debug(err);
      return false;
    }
    logger.notice(
      "Your project's .gitignore file has been modified to include Emtrey content, please commit this change.",
    );
    return true;
  }

  /**
   * Read cached user info from file system.
   */
  static async readUserFromFS(dir: string): Promise<UserToken | null> {
    let token: UserToken | null = null;
    try {
      const fileName = UserToken.getJoinedFileName(dir);
      logger.debug('user token : reading from file :', fileName);
      const fileContent = await fs.promises.readFile(fileName, 'utf-8');
      token = UserToken.fromJSON(UserToken.decrypt(JSON.parse(fileContent)));
      logger.debug('user token : content :', inspect(token, true, 3));
    } catch (err) {
      // Assume error is ENOENT (no entity)
      logger.debug('user token : error :', err);
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
    this.project = data.project;
    this.first_name = data.first_name;
  }
}
