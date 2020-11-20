import {
  Component,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';

@Component({
  selector: 'gat-form-field-error',
  template: ` <ng-content></ng-content> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldErrorComponent {
  @HostBinding('class')
  cls = `block bg-red w-full mt-2 text-xs text-white p-2 pl-4 pr-4 rounded`;
}
