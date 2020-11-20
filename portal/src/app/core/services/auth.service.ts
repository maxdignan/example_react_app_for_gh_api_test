import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { UserInterface } from '@app/shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * This is picked up by our http interceptor.
   */
  static cacheToken(token: string) {
    localStorage.setItem('token', token);
  }

  constructor(private router: Router, private http: HttpClient) {}

  public xhrLogin(params: { email: string; password: string }) {
    return this.http.post<UserInterface & { token: string }>('auth', params);
  }

  public logout(navigate = true) {
    localStorage.removeItem('token');
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }
}
