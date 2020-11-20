import { createAction, props } from '@ngrx/store';

export const loadVRBuilds = createAction(
  '[dashboard] load visual regression builds',
);

export const loadVRBuildsSuccess = createAction(
  '[dashboard] load visual regression builds success',
  props<{ builds: any[] }>(),
);

export const loadVRBuildsFailure = createAction(
  '[dashboard] load visual regression builds failure',
);
