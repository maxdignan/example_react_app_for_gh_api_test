import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  forwardRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'art-input',
  templateUrl: './input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent {
  @Input()
  placeholder: string;

  @Input()
  type = 'text';

  @Input() set value(v: string | number) {
    this.inputValue = v;
    this.onChange(v);
  }

  @Output()
  enterKeyed = new EventEmitter<undefined>();

  public inputValue?: string | number;

  onChange = (value: string | number) => {};
  onTouched = (value: string | number) => {};

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  writeValue(value: string) {
    this.value = value;
    this.onChange(value);
  }
}
