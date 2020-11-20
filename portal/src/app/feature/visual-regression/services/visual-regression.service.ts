import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';

import * as actions from '../store/visual-regression.actions';
import * as reducer from '../store/visual-regression.reducer';

@Injectable({
  providedIn: 'root',
})
export class VisualRegressionService {
  constructor(
    private store: Store<{
      [reducer.visualRegressionFeatureKey]: reducer.State;
    }>,
  ) {}

  public getContext() {
    return this.store.pipe(select(s => s.visualRegression.context));
  }

  public getStatus() {
    return this.store.pipe(select(s => s.visualRegression.status));
  }

  public loadVR(id: string) {
    this.store.dispatch(actions.loadContext({ id }));
  }
}
