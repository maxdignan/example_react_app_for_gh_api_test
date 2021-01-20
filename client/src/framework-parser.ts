import fs from 'fs';

import { FileExtension, Framework } from './models/parser';

/**
 * Sniffs a project directory to determine the type
 * of client-side framework/lib used.
 */
export class FrameworkParser {
  constructor(private dir: string) {}

  public async getFramework(): Promise<Framework> {
    if (await this.isProjectAngular()) {
      console.log('project is angular');
      return Framework.Angular;
    }
    if (await this.isProjectReact()) {
      console.log('project is react');
      return Framework.React;
    }
    if (await this.isProjectVue()) {
      console.log('project is vue');
      return Framework.Vue;
    }
    console.log('project is vanilla');
    return Framework.Vanilla;
  }

  /**
   * @todo: Do we need to do `tsx` and `jsx` for react?
   */
  public async getExtension(): Promise<FileExtension> {
    const isTypescript = await this.isProjectTypeScript();
    return isTypescript ? 'ts' : 'js';
  }

  /**
   * Resolves `true` if any npm package exists with the name.
   */
  private findProjectPackage(packageName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.access(`${this.dir}/node_modules/${packageName}`, err => {
        if (err) {
          console.log('framework parser : findProjectPackage :', err);
          return resolve(false);
        }
        resolve(true);
      });
    });
  }

  /**
   * If installed package typescript exists, assume TS.
   */
  private async isProjectTypeScript() {
    return this.findProjectPackage('typescript');
  }

  private async isProjectAngular() {
    return this.findProjectPackage('@angular/core');
  }

  private async isProjectReact() {
    return this.findProjectPackage('react');
  }

  private async isProjectVue() {
    return this.findProjectPackage('vue');
  }
}
