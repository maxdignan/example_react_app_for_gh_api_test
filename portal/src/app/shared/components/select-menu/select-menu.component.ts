import {
  Component,
  Input,
  forwardRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MenuOption } from './select-menu.model';

@Component({
  selector: 'art-select-menu',
  templateUrl: './select-menu.component.html',
  styles: [
    `
      :host ::ng-deep gat-loading-indicator {
        pointer-events: none;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectMenuComponent),
      multi: true,
    },
  ],
})
export class SelectMenuComponent implements ControlValueAccessor, OnChanges {
  @Input()
  label: string;

  @Input()
  options: Array<MenuOption[] | number[]> = [];

  @Input() set value(v: string | number) {
    this.inputValue = v;
    this.onChange(v);
  }

  public inputValue?: string | number;

  /** Value for reverse lookup on options list. */
  @Input()
  asyncValue?: string | number;

  @Input()
  disabled = false;

  @Input()
  keyField = 'id';

  @Input()
  valueField = 'name';

  @Input()
  loading = false;

  ngOnChanges(changes: SimpleChanges) {
    // Reverse lookup and select `asyncValue` when async data is ready.
    if (this.asyncValue && changes.options && changes.options.currentValue) {
      const selectedValue = changes.options.currentValue.find(
        o => o[this.valueField] === this.asyncValue,
      );
      if (selectedValue) {
        this.writeValue(selectedValue[this.keyField]);
      }
    }
  }

  onChange = (value: string | number) => {};
  onTouched = (value: string | number) => {};

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  public selectOption(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.writeValue(value);
  }

  writeValue(value: string) {
    this.value = value;
    this.onChange(value);
  }
}
