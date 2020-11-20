import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '@app/shared/shared.module';
import { LoginComponent } from './components/login/login.component';
import { PublicComponent } from './components/public/public.component';
import { LoggedOutComponent } from './components/logged-out/logged-out.component';
import { PublicRoutingModule } from './public-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicRoutingModule,
    SharedModule,
  ],
  declarations: [LoginComponent, PublicComponent, LoggedOutComponent],
})
export class PublicModule {}
