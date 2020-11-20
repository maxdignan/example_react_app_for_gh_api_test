import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { App } from '@app/shared/models';

@Injectable({
  providedIn: 'root',
})
export class VisualRegressionHttpService {
  constructor(private http: HttpClient) {}

  public getVR(id: string) {
    return this.http.get<any>(`vr/${id}`, App.getParams());
  }
}
