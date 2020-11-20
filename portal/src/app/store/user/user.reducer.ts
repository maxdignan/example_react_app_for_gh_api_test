import { createReducer, on, Action } from '@ngrx/store';
import { User, ActionStatus, App } from '@app/shared/models';
import * as actions from './user.actions';

export interface State {
  user: User | null;
  token: string | null;
  status: ActionStatus;
  apps: App[];
  appsStatus: ActionStatus;
  appContext: App | null;
}

export const initialState: State = {
  user: null,
  token: null,
  status: ActionStatus.Default,
  apps: [],
  appsStatus: ActionStatus.Default,
  appContext: null,
};

const userReducer = createReducer(
  initialState,

  on(actions.login, state => ({
    ...state,
    status: ActionStatus.Loading,
  })),

  on(actions.loginSuccess, (state, { user }) => ({
    ...state,
    status: ActionStatus.Success,
    user,
  })),

  on(actions.loginFailure, state => ({
    ...state,
    status: ActionStatus.Failure,
  })),

  on(actions.setCachedToken, (state, { token }) => ({
    ...state,
    token,
  })),

  on(actions.logout, () => initialState),

  on(actions.loadApps, state => ({
    ...state,
    appsStatus: ActionStatus.Loading,
  })),

  on(actions.loadAppsSuccess, (state, { apps }) => ({
    ...state,
    appsStatus: ActionStatus.Success,
    apps,
  })),

  on(actions.loadAppsFailure, state => ({
    ...state,
    appsStatus: ActionStatus.Failure,
  })),

  on(actions.setAppContext, (state, { app }) => ({
    ...state,
    appContext: app,
  })),
);

export function reducer(state: State | undefined, action: Action) {
  return userReducer(state, action);
}
