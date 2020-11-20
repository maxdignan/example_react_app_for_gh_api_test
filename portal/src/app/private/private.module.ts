import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '@app/shared/shared.module';
import { PrivateComponent } from './components/private/private.component';
import { PrivateRoutingModule } from './private-routing.module';
import { AppNavComponent } from './components/private/app-nav/app-nav.component';
import { AppNavLinkComponent } from './components/private/app-nav/app-nav-link/app-nav-link.component';
import { AppNavUserComponent } from './components/private/app-nav/app-nav-user/app-nav-user.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PrivateRoutingModule,
    SharedModule,
  ],
  declarations: [
    PrivateComponent,
    AppNavComponent,
    AppNavLinkComponent,
    AppNavUserComponent,
  ],
})
export class PrivateModule {}
