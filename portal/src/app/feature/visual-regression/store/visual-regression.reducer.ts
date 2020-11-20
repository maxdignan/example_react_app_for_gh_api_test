import { createReducer, on } from '@ngrx/store';

import { ActionStatus } from '@app/shared/models';
import * as VisualRegressionActions from './visual-regression.actions';

export const visualRegressionFeatureKey = 'visualRegression';

export interface State {
  /** Current visual regression in details view. */
  context: any;
  /** Status of API request for context. */
  status: ActionStatus;
}

export const initialState: State = {
  context: null,
  status: ActionStatus.Default,
};

export const reducer = createReducer(
  initialState,

  on(VisualRegressionActions.loadContext, state => ({
    ...state,
    status: ActionStatus.Loading,
  })),

  on(VisualRegressionActions.loadContextSuccess, (state, { context }) => ({
    ...state,
    status: ActionStatus.Success,
    context,
  })),

  on(VisualRegressionActions.loadContextFailure, state => ({
    ...state,
    status: ActionStatus.Failure,
  })),
);
