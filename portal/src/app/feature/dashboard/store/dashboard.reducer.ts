import { createReducer, on } from '@ngrx/store';
import { ActionStatus } from '@app/shared/models';
import * as actions from './dashboard.actions';

export const dashboardFeatureKey = 'dashboard';

export interface State {
  visualRegression: {
    status: ActionStatus;
    builds: any[];
  };
}

export const initialState: State = {
  visualRegression: {
    status: ActionStatus.Default,
    builds: [],
  },
};

export const reducer = createReducer(
  initialState,

  on(actions.loadVRBuilds, state => ({
    ...state,
    visualRegression: {
      ...state.visualRegression,
      status: ActionStatus.Loading,
    },
  })),

  on(actions.loadVRBuildsSuccess, (state, { builds }) => ({
    ...state,
    visualRegression: {
      ...state.visualRegression,
      status: ActionStatus.Success,
      builds,
    },
  })),

  on(actions.loadVRBuildsFailure, state => ({
    ...state,
    visualRegression: {
      ...state.visualRegression,
      status: ActionStatus.Failure,
    },
  })),
);
