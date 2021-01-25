/** Config inside of project dir `emtrey.config.js` */
export interface ProjectConfigInterface {
  readonly outputDirectory: string;
  readonly limit: number;
  readonly login?: {
    url?: string;
    user?: string;
    password?: string;
  };
  readonly routes: {
    id?: number | string;
    auth?: boolean;
    delay?: number;
    enabled?: boolean;
    [key: string]: any;
  };
}

export class ProjectConfig {
  /** Defaults */
  static defaultLimit = 1;
  static defaultDir = '.emtrey_tmp';
  static defaultLoginUrl = 'login';

  /** Location of API. */
  static apiURL = 'early-testing-emtrey.herokuapp.com';
  static apiPort = 9000;

  /** Local directory where screens will be stored. */
  outputDirectory: string;

  /** Maximum amount of screens to take. */
  limit: number;

  /**
   * Construct a new project config from file contents.
   */
  static fromFile(file: ProjectConfigInterface): ProjectConfig {
    return new ProjectConfig(file);
  }

  static createBlank(): ProjectConfig {
    return new ProjectConfig({ routes: {} });
  }

  constructor(public config?: Partial<ProjectConfigInterface>) {
    this.outputDirectory = config?.outputDirectory || ProjectConfig.defaultDir;
    this.limit = config?.limit || ProjectConfig.defaultLimit;
  }

  get routes() {
    return this.config?.routes;
  }

  get login() {
    return this.config?.login;
  }

  /**
   * Get config URL or fallback to default.
   */
  public getLoginUrl(): string {
    return this.login?.url || ProjectConfig.defaultLoginUrl;
  }

  /**
   * Does this URL have a config entry in `routes`?
   */
  public hasURL(url: string): boolean {
    return this.routes! && url in this.routes!;
  }

  /**
   * Get the wildcard config which servers as a base for all routes.
   */
  public getRouteWildcardConfig() {
    const routes = this.config?.routes;
    return routes ? routes['*'] : {};
  }

  /**
   * Does this config block contain `{ auth: true }`?
   */
  private willConfigAuth(config: { auth: boolean }): boolean {
    return config?.auth === true;
  }

  /**
   * Check wildcard config for auth, then direct URL.
   */
  public willAuthorizeURL(url: string): boolean {
    const wildcard = this.getRouteWildcardConfig();
    return (
      (wildcard && this.willConfigAuth(wildcard)) ||
      this.willConfigAuth(this.routes![url])
    );
  }

  public getURLProp(url: string, prop: 'delay' | 'enabled') {
    return this.config?.routes![url][prop];
  }
}
