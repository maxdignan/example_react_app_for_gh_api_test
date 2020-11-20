import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'art-visual-regression',
  template: `<router-outlet></router-outlet>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualRegressionComponent {}
