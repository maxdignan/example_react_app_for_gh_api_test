import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { App } from '@app/shared/models';

@Injectable({
  providedIn: 'root',
})
export class DashboardHttpService {
  constructor(private http: HttpClient) {}

  getVRBuilds() {
    return this.http.get<any[]>('vr', App.getParams());
  }
}
