import * as fs from 'fs';
const glob = require('glob');

import { ParserConfig, Framework, FileExtension } from './models/parser';
import { Route } from './models/route';
import { uniqueArrayBy } from './util';

/**
 * Sniffs a project directory to compile a list of URLs to hit.
 */
export class URLParser {
  private framework: Framework;
  private extension: FileExtension;

  constructor(config: ParserConfig = {} as ParserConfig) {
    this.framework = config.framework;
    this.extension = config.extension;
    if (config.framework === undefined || config.extension === undefined) {
      throw new Error(`Invalid parser configuation ${JSON.stringify(config)}`);
    }
  }

  /**
   * Get all project ts/js source files.
   */
  private async getAllProjectFiles(path: string): Promise<string | string[]> {
    return new Promise((resolve, reject) => {
      glob(
        `${path}/**/*.${this.extension}`,
        {
          ignore: ['node_modules'],
          nosort: true,
        },
        (err: string, files: string[]) => {
          if (err) {
            reject(err);
          }
          resolve(files);
        },
      );
    });
  }

  /**
   * Entrypoint for app. Returns array of all route paths.
   */
  public async getRoutes(path: string): Promise<Route[]> {
    let files: string[] = [];
    try {
      files = (await this.getAllProjectFiles(path)) as string[];
    } catch (err) {}

    let routes: Route[][];

    if (this.framework === Framework.Angular) {
      const routerFiles = files.filter(
        file => file.includes('routing.module') || file.includes('.routing'),
      );
      routes = await Promise.all(
        routerFiles.map(router => this.parseAngularRouter(router)),
      );
    } else if (this.framework === Framework.React) {
      throw new Error('Framework not implemented yet');
    } else if (this.framework === Framework.Vue) {
      throw new Error('Framework not implemented yet');
    } else {
      throw new Error('Framework not implemented yet');
    }

    const flat = uniqueArrayBy('url', routes.flat());
    // Log all found routes.
    // console.log(flat);
    return flat;
  }

  /**
   * Parse angular route files into route blocks.
   */
  private parseAngularRouteBlocks(
    blocks: string[],
    routes: Route[] = [],
  ): Route[] {
    let currentPath: string;
    blocks.forEach(block => {
      const pathBlocks: string[] = block.match(/path:\s.+/gi);
      const paths = pathBlocks.map(b => b.replace(/\'|\"|path:\s|,/g, ''));
      const [path] = paths;
      // Must have value, cannot be wildcard
      if (path && path !== '**') {
        if (block.includes('children:')) {
          // Child paths exist, recurse
          currentPath = path;
          this.parseAngularRouteBlocks(pathBlocks, routes);
        } else {
          // No child paths, push current
          const url = currentPath ? `${currentPath}/${path}` : path;
          const route = new Route({ url });
          routes.push(route);
        }
      }
    });
    return routes;
  }

  /**
   * Main entry for parsing angular router files.
   */
  private async parseAngularRouter(path: string): Promise<Route[]> {
    const fileContent = await fs.promises.readFile(path, 'utf-8');
    const routeBlocks: string[] = fileContent
      .split(/{(\n|\r)+/)
      .filter(p => p.includes('path:'));
    return this.parseAngularRouteBlocks(routeBlocks);
  }

  /**
   * Parse react route files into route blocks.
   */
  private parseReactRouteBlocks(
    blocks: string[],
    routes: Route[] = [],
  ): Route[] {
    const r: Route[] = [];
    return r;
  }

  /**
   * Main entry for parsing react router files.
   */
  private async parseReactRouter(path: string) {
    const fileContent = await fs.promises.readFile(path, 'utf-8');
    const routeBlocks: string[] = fileContent
      .split(/{(\n|\r)+/)
      .filter(p => p.includes('path:'));
    return this.parseReactRouteBlocks(routeBlocks);
  }
}
