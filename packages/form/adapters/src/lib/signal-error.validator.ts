import { computed, Directive, effect, input } from '@angular/core';
import { NG_VALIDATORS, type Validator } from '@angular/forms';

@Directive({
  selector: '[ngModel][mmSignalError]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: SignalErrorValidator,
      multi: true,
    },
  ],
})
export class SignalErrorValidator implements Validator {
  readonly mmSignalError = input('');
  private onChange = () => {
    // noop
  };

  private readonly valid = computed(() => {
    return !this.mmSignalError();
  });

  constructor() {
    effect(() => {
      this.valid();
      this.onChange();
    });
  }

  validate() {
    return !this.valid() ? { error: this.mmSignalError() } : null;
  }

  registerOnValidatorChange(fn: () => void) {
    this.onChange = fn;
  }
}
