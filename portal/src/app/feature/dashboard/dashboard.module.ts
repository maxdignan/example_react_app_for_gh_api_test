import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@app/shared/shared.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardService } from './services/dashboard.service';
import { DashboardHttpService } from './services/dashboard-http.service';
import { DashboardStoreModule } from './store/dashboard-store.module';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardStoreModule,
    SharedModule,
  ],
  providers: [DashboardService, DashboardHttpService],
  declarations: [DashboardComponent],
})
export class DashboardModule {}
