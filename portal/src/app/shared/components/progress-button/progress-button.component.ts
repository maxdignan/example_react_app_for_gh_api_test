import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';

@Component({
  selector: 'art-progress-button',
  templateUrl: './progress-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressButtonComponent {
  @Input()
  width = 140;

  @Input()
  disabled = true;

  @Input()
  updating = false;

  @Input()
  label = 'Save';

  @Input()
  buttonModifier = 'success';

  @Output()
  clicked = new EventEmitter<undefined>();
}
