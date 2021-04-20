import { exec } from 'child_process';
import { Choice, prompt } from 'prompts';
import { logger } from './logger';
import { exitWithError } from './util';

export class BaseBranch {
  private branchOptions: Choice[] = [];

  /**
   * Find the main branch (used to just be master).
   */
  static isRootBranch(branchName: string): boolean {
    return branchName.includes('master') || branchName.includes('main');
  }

  static getBranchOptions(cwd: string): Promise<Choice[]> {
    return new Promise((resolve, reject) => {
      /** @todo: Do we need to parse locals as well? */
      exec(
        'git branch -r',
        {
          cwd,
        },
        (err: Error, stdout: string, stderr: string) => {
          if (err || stderr) {
            // Git may not be initialized, or other host of issues
            reject(err.message || stderr);
          }
          logger.debug('base branch : finding...');
          const branches = stdout
            .split('\n')
            .map(b => b.trim())
            .filter(b => !!b)
            .sort((a, b) => (BaseBranch.isRootBranch(a) ? -1 : 1));
          logger.debug('base branch : got branches :', branches);
          const options: Choice[] = branches.map(b => ({
            title: b,
            value: b,
            selected: BaseBranch.isRootBranch(b),
          }));
          resolve(options);
        },
      );
    });
  }

  constructor(private appDir: string) {}

  public async init() {
    return BaseBranch.getBranchOptions(this.appDir)
      .then(o => this.promptUserToSelectBaseBranch(o))
      .catch(err => exitWithError(err));
  }

  public async promptUserToSelectBaseBranch(
    choices: Choice[],
  ): Promise<{
    branchName: string;
  }> {
    const menu = {
      choices,
      type: 'select',
      name: 'branchName',
      /** @todo: This wording should be more helpful. */
      message: 'Select the main (base) branch for this project.',
    };
    return await prompt(menu);
  }
}
