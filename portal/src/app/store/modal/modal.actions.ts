import { createAction, props } from '@ngrx/store';
import { Modal } from '@app/shared/models';

export const showModal = createAction(
  '[modal] show modal',
  props<{
    modal: Modal;
  }>(),
);

export const closeModal = createAction('[modal] close modal');
