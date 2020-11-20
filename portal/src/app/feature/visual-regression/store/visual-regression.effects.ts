import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { concatMap, catchError, map, delay } from 'rxjs/operators';
import { of } from 'rxjs';

import { VisualRegressionHttpService } from '../services/visual-regression-http.service';
import * as actions from './visual-regression.actions';

@Injectable()
export class VisualRegressionEffects {
  /**
   * Load full VR suite data for context/details.
   */
  loadVisualRegressions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadContext),
      delay(1000),
      concatMap(({ id }) =>
        this.http.getVR(id).pipe(
          map(res => actions.loadContextSuccess({ context: res })),
          catchError(() => of(actions.loadContextFailure())),
        ),
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private http: VisualRegressionHttpService,
  ) {}
}
