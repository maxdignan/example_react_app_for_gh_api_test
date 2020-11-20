import { createReducer, on, Action } from '@ngrx/store';
import { Modal } from '@app/shared/models';
import * as actions from './modal.actions';

export interface State {
  modal: Modal | null;
}

export const initialState: State = {
  modal: null,
};

const modalReducer = createReducer(
  initialState,

  on(actions.showModal, (state, action) => ({
    ...state,
    modal: action.modal,
  })),

  on(actions.closeModal, state => ({
    ...state,
    modal: null,
  })),
);

export function reducer(state: State | undefined, action: Action) {
  return modalReducer(state, action);
}
