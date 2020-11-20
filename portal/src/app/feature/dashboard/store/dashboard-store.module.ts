import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { DashboardEffects } from './dashboard.effects';
import * as fromDashboard from './dashboard.reducer';

@NgModule({
  imports: [
    EffectsModule.forFeature([DashboardEffects]),
    StoreModule.forFeature(
      fromDashboard.dashboardFeatureKey,
      fromDashboard.reducer,
    ),
  ],
  exports: [StoreModule, EffectsModule],
})
export class DashboardStoreModule {}
