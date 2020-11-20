import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from 'src/environments/environment';

import * as fromUser from './user/user.reducer';
import * as fromModal from './modal/modal.reducer';

import { loggerReducer } from './logger.reducer';

export interface State {
  user: fromUser.State;
  modal: fromModal.State;
}

export const reducers: ActionReducerMap<State> = {
  user: fromUser.reducer,
  modal: fromModal.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production
  ? [loggerReducer]
  : [];
