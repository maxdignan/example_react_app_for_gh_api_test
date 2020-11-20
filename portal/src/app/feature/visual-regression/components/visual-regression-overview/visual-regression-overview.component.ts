import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { ActionStatus } from '@app/shared/models';
import { VisualRegressionService } from '../../services/visual-regression.service';

@Component({
  selector: 'art-visual-regression-overview',
  templateUrl: './visual-regression-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualRegressionOverviewComponent implements OnInit {
  public status$: Observable<ActionStatus>;
  public context$: Observable<any>;
  public readonly statuses = ActionStatus;

  constructor(
    private route: ActivatedRoute,
    private vrService: VisualRegressionService,
  ) {}

  ngOnInit() {
    this.vrService.loadVR(this.route.snapshot.params.id);
    this.status$ = this.vrService.getStatus();
    this.context$ = this.vrService.getContext();
  }
}
