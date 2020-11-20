export interface AppInterface {
  readonly id: string;
  readonly name: string;
  readonly created: string;
}

export class App {
  readonly id: string;
  readonly name: string;
  readonly created: string;

  /**
   * Flags interceptor to add current app context to request.
   * Example:
   * this.http.get<any>(`vr/${id}`, App.getParams());`
   */
  static getParams(appContext = 'app'): { params: { appContext: string } } {
    return { params: { appContext } };
  }

  static fromJSON(json: AppInterface): App {
    return new App(json);
  }

  constructor(data: AppInterface) {
    this.id = data.id;
    this.name = data.name;
    this.created = data.created;
  }
}
