import { exec } from 'child_process';
import { Choice, prompt } from 'prompts';
import { exitWithError } from './util';

export class BaseBranch {
  private branchOptions: Choice[] = [];

  static async promptUserToSelectBaseBranch(
    options: Choice[],
  ): Promise<{
    organizationId: number;
  }> {
    const menu = {
      choices: [],
      type: 'select',
      name: 'branchName',
      message: 'Select the main (base) branch for this project',
    };
    return await prompt(menu);
  }

  static getBranchOptions(cwd: string): Promise<Choice[]> {
    return new Promise((resolve, reject) => {
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
          console.log(stdout);
          process.exit();
          resolve([]);
        },
      );
    });
  }

  constructor(private appDir: string) {
    BaseBranch.getBranchOptions(appDir)
      .then(o => (this.branchOptions = o))
      .catch(err => exitWithError(err));
  }
}
