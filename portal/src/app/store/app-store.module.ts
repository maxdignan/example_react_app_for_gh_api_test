import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule, RouterState } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';

import { reducers, metaReducers } from './app.reducer';
import { UserEffects } from './user/user.effects';

/*
 * App store houses all common stores/effects.
 */
@NgModule({
  imports: [
    StoreRouterConnectingModule.forRoot({ routerState: RouterState.Minimal }),
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: false,
        strictActionSerializability: false,
      },
    }),
    EffectsModule.forRoot([UserEffects]),
  ],
  exports: [StoreModule],
})
export class AppStoreModule {}
