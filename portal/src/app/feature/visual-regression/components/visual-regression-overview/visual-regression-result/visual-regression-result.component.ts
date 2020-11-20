import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'art-visual-regression-result',
  templateUrl: './visual-regression-result.component.html',
  styleUrls: ['./visual-regression-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualRegressionResultComponent {
  @Input()
  result: any;
}
