import { createAction, props } from '@ngrx/store';
import { User, App } from '@app/shared/models';

export const login = createAction(
  '[User] login requested',
  props<{
    email: string;
    password: string;
    returnUrl: string;
  }>(),
);

export const loginSuccess = createAction(
  '[User] login success',
  props<{ user: User }>(),
);

export const loginFailure = createAction('[User] login failure');

export const setCachedToken = createAction(
  '[User] set cahced token',
  props<{ token: string }>(),
);

export const logout = createAction('[User] logout');

export const initializeUser = createAction('[User] initialize');

export const loadApps = createAction('[User] load apps');

export const loadAppsSuccess = createAction(
  '[User] load apps success',
  props<{ apps: App[] }>(),
);

export const loadAppsFailure = createAction('[User] load apps failure');

export const setAppContext = createAction(
  '[User] set app context',
  props<{ app: App | null }>(),
);
