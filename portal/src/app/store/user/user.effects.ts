import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of, EMPTY } from 'rxjs';
import {
  map,
  tap,
  switchMap,
  catchError,
  filter,
  delay,
  take,
} from 'rxjs/operators';

import { User, App } from '@app/shared/models';
import { AuthService } from '@app/core/services/auth.service';
import { UserService } from '@app/core/services/user.service';
import { UserHttpService } from '@app/core/services/user-http.service';
import * as actions from './user.actions';

@Injectable({
  providedIn: 'root',
})
export class UserEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private http: UserHttpService,
  ) {}

  /**
   * Set cached user model in store.
   */
  hydrateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.initializeUser),
      take(1),
      switchMap(() => {
        const cached = localStorage.getItem('user');
        return of(cached).pipe(
          filter(s => !!s),
          map(s => User.fromJSON(JSON.parse(s))),
          map(user => actions.loginSuccess({ user })),
          catchError(err => {
            console.error(err);
            return EMPTY;
          }),
        );
      }),
    ),
  );

  /*
   * Hit server to auth email/pass.
   */
  loginUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.login),
      switchMap(form => {
        return this.authService
          .xhrLogin({ email: form.email, password: form.password })
          .pipe(
            tap(res => AuthService.cacheToken(res.token)),
            tap(res => {
              const { name, email, id } = res;
              UserService.cacheUser({ name, email, id });
            }),
            switchMap(res => {
              const user = new User(res);
              return [
                actions.loginSuccess({ user }),
                actions.setCachedToken({ token: res.token }),
              ];
            }),
            tap(() => this.router.navigateByUrl(form.returnUrl || '/')),
            catchError(() => of(actions.loginFailure())),
          );
      }),
    ),
  );

  /**
   * Load apps when user is logged in.
   */
  startLoadApps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loginSuccess),
      take(1),
      map(() => actions.loadApps()),
    ),
  );

  /**
   * Load apps when user is logged in.
   */
  loadApps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadApps),
      switchMap(() =>
        this.http.loadApps().pipe(
          map(res => res.map(r => App.fromJSON(r))),
          map(apps => actions.loadAppsSuccess({ apps })),
          catchError(() => of(actions.loadAppsFailure())),
        ),
      ),
    ),
  );

  /**
   * When apps load set context from browser cache or use first app.
   */
  setAppContextFromLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadAppsSuccess),
      map(({ apps }) => {
        const cachedAppId = localStorage.getItem('appId');
        let app = apps[0];
        if (cachedAppId) {
          app = apps.find(a => a.id === cachedAppId) || app;
        }
        return actions.setAppContext({ app });
      }),
      catchError(err => of(err)),
    ),
  );

  /*
   * When a successful login is dispatched navigate away
   * from the login component
   */
  // redirectSuccess$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(actions.loginSuccess),
  //       filter(() => !!this.returnUrl),
  //       tap(() => this.router.navigateByUrl(this.returnUrl)),
  //     ),
  //   { dispatch: false },
  // );

  /*
   * JWT is available, load a user from server (requires token).
   * @todo:
   * - Skip when user exists in store
   */
  // loadUser$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(actions.setCachedToken),
  //     // Likely not needed anymore...
  //     switchMap(() =>
  //       this.userService.getToken().pipe(
  //         filter(t => !!t),
  //         first(),
  //       ),
  //     ),
  //     switchMap(() => {
  //       return this.http.xhrQueryUser().pipe(
  //         map(res => {
  //           const user = User.fromJSON(res.data.me);
  //           return actions.queryUserSuccess({ user });
  //         }),
  //         catchError(err => {
  //           console.error(err);
  //           return of(actions.queryUserFailure());
  //         }),
  //       );
  //     }),
  //   ),
  // );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.logout),
        tap(() => {
          window.localStorage.clear();
          this.router.navigateByUrl('/login');
        }),
      ),
    { dispatch: false },
  );
}
