import { ProjectConfig } from './project-config';

interface RouteInterface {
  readonly url: string;
}

export class Route implements RouteInterface {
  readonly url: string;

  /**
   * Create file name from full URL.
   * @example: http://localhost:4400/404
   * Will return `404`
   */
  static getFileNameFromURL(url: string): string {
    const parts = url.split('/');
    return parts.pop();
  }

  constructor(data: RouteInterface) {
    this.url = data.url;
  }

  /**
   * Get a URL after we read any mods from project config.
   * Is the use of `:` angular specific?
   * @todo: Needs to work with multiple `:` in path, IE:
   * http://localhost:4400/p/:msa/:org/:loc
   */
  getFullUrl(base: string, config?: ProjectConfig): string {
    if (this.url.includes(':') && config?.hasURL(this.url)) {
      const regexMatch = this.url.match(/:.+/);
      if (regexMatch) {
        // console.log(this.url, config.routes[this.url]);
        // Example: 'my-shit/:id/fo/dat-azz' will produce: [":id", "fo", "dat-azz"]
        const tokenParts = regexMatch[0].split('/');
        const [tokenWithIdentifier] = tokenParts;
        const token = tokenWithIdentifier.replace(':', '');
        const url = `${base}/${this.url.replace(
          tokenWithIdentifier,
          config.routes[this.url as string][token],
        )}`;
        return url;
      }
    }
    return `${base}/${this.url}`;
  }
}
