import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import * as fromVisualRegression from './visual-regression.reducer';
import { VisualRegressionEffects } from './visual-regression.effects';

@NgModule({
  imports: [
    StoreModule.forFeature(
      fromVisualRegression.visualRegressionFeatureKey,
      fromVisualRegression.reducer,
    ),
    EffectsModule.forFeature([VisualRegressionEffects]),
  ],
  exports: [StoreModule, EffectsModule],
})
export class VisualRegressionStoreModule {}
