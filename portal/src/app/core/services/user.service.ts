import { Injectable } from '@angular/core';
import { pluck, tap, filter, take, map } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';

import { User, ActionStatus, UserInterface, App } from '@app/shared/models';
import * as actions from '@app/store/user/user.actions';
import * as reducer from '@app/store/user/user.reducer';
import { ThrowStmt } from '@angular/compiler';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  static cacheUser(user: UserInterface) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  constructor(
    private store: Store<{
      user: reducer.State;
    }>,
  ) {}

  public getUser() {
    return this.store.pipe(
      select(s => s.user.user),
      tap(u => console.log(u)),
    );
  }

  public getToken() {
    return this.store.pipe(select(s => s.user.token));
  }

  public getStatus() {
    return this.store.pipe(select(s => s.user.status));
  }

  public getApps() {
    return this.store.pipe(select(s => s.user.apps));
  }

  public getAppContext() {
    return this.store.pipe(select(s => s.user.appContext));
  }

  public getAppId() {
    return this.getAppContext().pipe(
      filter(app => !!app),
      pluck('id'),
      take(1),
    );
  }

  public login(form: { email: string; password: string; returnUrl: string }) {
    this.store.dispatch(actions.login(form));
  }

  public initializeUser() {
    this.store.dispatch(actions.initializeUser());
  }

  public logout() {
    this.store.dispatch(actions.logout());
  }

  public setAppContext(app: App | null) {
    this.store.dispatch(actions.setAppContext({ app }));
  }
}
