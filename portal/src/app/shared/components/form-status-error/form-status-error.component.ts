import {
  Component,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';

@Component({
  selector: 'art-form-status-error',
  template: ` <ng-content></ng-content> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormStatusErrorComponent {
  @HostBinding('class')
  cls = `p-3 w-full flex items-center text-center justify-center mb-3 rounded text-red text-sm`;
}
