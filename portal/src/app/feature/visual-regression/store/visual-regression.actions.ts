import { createAction, props } from '@ngrx/store';

export const loadContext = createAction(
  '[VisualRegression] load context',
  props<{ id: string }>(),
);

export const loadContextSuccess = createAction(
  '[VisualRegression] load context success',
  props<{ context: any }>(),
);

export const loadContextFailure = createAction(
  '[VisualRegression] load context failure',
);
