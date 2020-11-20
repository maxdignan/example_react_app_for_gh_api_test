import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { ActionStatus } from '@app/shared/models';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'art-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  public vrBuilds$: Observable<any[]>;
  public vrStatus$: Observable<ActionStatus>;

  public readonly statuses = ActionStatus;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.loadVRBuilds();
    this.vrBuilds$ = this.dashboardService.getVRBuilds();
    this.vrStatus$ = this.dashboardService.getVRBuildsStatus();
  }
}
