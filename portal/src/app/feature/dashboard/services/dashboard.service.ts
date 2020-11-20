import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';

import * as actions from '../store/dashboard.actions';
import * as reducer from '../store/dashboard.reducer';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private store: Store<{ [reducer.dashboardFeatureKey]: reducer.State }>,
  ) {}

  public getVRBuilds() {
    return this.store.pipe(select(s => s.dashboard.visualRegression.builds));
  }

  public getVRBuildsStatus() {
    return this.store.pipe(select(s => s.dashboard.visualRegression.status));
  }

  public loadVRBuilds() {
    this.store.dispatch(actions.loadVRBuilds());
  }
}
