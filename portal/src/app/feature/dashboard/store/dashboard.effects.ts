import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { concatMap, catchError, map, switchMap } from 'rxjs/operators';

import { DashboardHttpService } from '../services/dashboard-http.service';
import * as actions from './dashboard.actions';

@Injectable()
export class DashboardEffects {
  loadDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadVRBuilds),
      concatMap(() =>
        this.http.getVRBuilds().pipe(
          map(builds => actions.loadVRBuildsSuccess({ builds })),
          catchError(() => of(actions.loadVRBuildsFailure())),
        ),
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private http: DashboardHttpService,
  ) {}
}
