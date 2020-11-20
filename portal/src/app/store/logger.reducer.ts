import { ActionReducer } from '@ngrx/store';

import { State } from './app.reducer';

export function loggerReducer(
  reducer: ActionReducer<State>,
): ActionReducer<State> {
  return (state, action) => {
    const result = reducer(state, action);
    console.groupCollapsed(action.type);
    console.log('prev state', state);
    console.log('action', action);
    console.log('next state', result);
    console.groupEnd();
    return result;
  };
}
