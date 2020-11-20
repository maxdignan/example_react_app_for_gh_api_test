import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'art-visual-regression-metadata',
  templateUrl: './visual-regression-metadata.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualRegressionMetadataComponent {
  @Input()
  vr: any;
}
