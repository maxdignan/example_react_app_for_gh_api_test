import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { App } from '@app/shared/models';

@Injectable({
  providedIn: 'root',
})
export class UserHttpService {
  constructor(private http: HttpClient) {}

  public loadApps() {
    return this.http.get<App[]>('app');
  }
}
