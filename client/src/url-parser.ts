import * as fs from 'fs';
const glob = require('glob');

import { ParserConfig, Framework, FileExtension } from './models/parser';
import { Route } from './models/route';
import { exitWithError, uniqueArrayBy } from './util';

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
          ignore: ['**/node_modules/**', '**/dist/**'],
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
    } catch (err) {
      exitWithError('Cannot parse project files.');
    }

    let routes: Route[][];

    if (this.framework === Framework.Angular) {
      routes = await this.getAngularProjectRoutes(files);
    } else if (this.framework === Framework.React) {
      routes = await this.getReactProjectRoutes(files);
    } else if (this.framework === Framework.Vue) {
      throw new Error('Framework not implemented yet');
    } else {
      throw new Error('Framework not implemented yet');
    }

    const flat = uniqueArrayBy('url', routes.flat());
    console.log('url parser : routes :', flat);
    return flat;
  }

  /**
   * Get all routes from an angular project.
   * All routes should be defined in a `routing` module, if not they suck.
   */
  private async getAngularProjectRoutes(files: string[]): Promise<Route[][]> {
    const routerFiles = files.filter(
      file => file.includes('routing.module') || file.includes('.routing'),
    );
    const routes = await Promise.all(
      routerFiles.map(router => this.parseAngularRouter(router)),
    );
    return routes;
  }

  /**
   * Get all routes from a react project.
   * Your guess on how this should work is as good as mine.
   */
  private async getReactProjectRoutes(files: string[]): Promise<Route[][]> {
    const routerFiles = files.filter(
      file =>
        file.includes('routing.') ||
        file.includes('router.') ||
        file.includes('index.'),
    );
    const routes = await Promise.all(
      routerFiles.map(router => this.parseReactRouter(router)),
    );
    return routes;
  }

  /**
   * Parse angular route files into route blocks.
   */
  private parseAngularRoutes(blocks: string[], routes: Route[] = []): Route[] {
    let currentPath: string;

    for (const block of blocks) {
      const pathBlocks: string[] = block.match(/path:\s.+/gi);
      const paths = pathBlocks.map(b => b.replace(/\'|\"|path:\s|,/g, ''));
      const [path] = paths;
      // Must have value, cannot be wildcard
      if (path && path !== '**') {
        if (block.includes('children:')) {
          // Child paths exist, recurse
          currentPath = path;
          this.parseAngularRoutes(pathBlocks, routes);
        } else {
          // No child paths, push current
          const url = currentPath ? `${currentPath}/${path}` : path;
          routes.push(Route.fromURL(url));
        }
      }
    }

    return routes;
  }

  /**
   * Main entry for parsing angular router files.
   */
  private async parseAngularRouter(path: string): Promise<Route[]> {
    const fileContent = await fs.promises.readFile(path, 'utf-8');
    const routes: string[] = fileContent
      .split(/{(\n|\r)+/)
      .filter(p => p.includes('path:'));
    return this.parseAngularRoutes(routes);
  }

  /**
   * Parse react route files into route blocks.
   */
  private parseReactRoutes(paths: string[], routes: Route[] = []): Route[] {
    for (const path of paths) {
      // Cannot be wildcard
      if (path === '*') {
        continue;
      }
      routes.push(Route.fromURL(path));
    }
    return routes;
  }

  /**
   * Main entry for parsing react router files.
   *
   * With a router tree as such:
   * <Router history={browserHistory}>
   *   <Route path="/" component={App}>
   *     <IndexRoute component={Welcome} />
   *     <Route path="/projects" component={Projects}/>
   *     <Route path="/project/:projectId" component={Project}/>
   *     <Route path="/about" component={About}/>
   *     <Route path="*" component={PageNotFound}/>
   *   </Route>
   * </Router>
   *
   * This supports the package `react-router`, which is likely most react projects,
   * but we should do some research into others.
   */
  private async parseReactRouter(path: string) {
    const fileContent = await fs.promises.readFile(path, 'utf-8');

    // Get all children of the parent `<Router />` JSX element
    const routerElement = fileContent.split('<Router').pop();

    // All paths attached to `<Route />` JSX elements
    // Example: ["path="/"", "path="/projects"", "path="/project/:projectId"", ...]
    const pathAttributes = routerElement.match(/path=.+(\"|\')/g);

    // Narrow attributes down to final array
    // Example: ["/", "/projects", "/project/:projectId", "/about", "*"]
    const paths = pathAttributes
      .map(p => p.split('=').pop().replace(/\"/g, ''))
      .filter(p => !!p);

    return this.parseReactRoutes(paths);
  }
}
