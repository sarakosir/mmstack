import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  FloatLabelType,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldAppearance,
  SubscriptSizing,
} from '@angular/material/form-field';
import { BooleanState, SignalErrorValidator } from './adapters';

@Component({
  selector: 'mm-boolean-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, MatCheckbox, SignalErrorValidator],
  host: {
    class: 'mm-boolean-field',
  },
  template: `
    <div class="mm-checkbox-field-container">
      <mat-checkbox
        class="mm-checkbox-field"
        [class.readonly]="state().readonly()"
        [class.error]="!!state().error()"
        [disabled]="state().disabled()"
        [required]="state().required()"
        [(ngModel)]="state().value"
        (ngModelChange)="state().markAsTouched()"
        [mmSignalError]="state().error()"
      >
        {{ state().label() }}
      </mat-checkbox>

      @let showError = state().error() && state().touched();

      @if (state().hint() && !showError) {
        <span class="mm-checkbox-field-hint">{{ state().hint() }}</span>
      }

      @if (showError) {
        <span class="mm-checkbox-field-error">{{ state().error() }}</span>
      }
    </div>
  `,
  styles: `
    .mm-boolean-field {
      display: contents;

      .mm-checkbox-field-container {
        display: contents;

        &:has(span.mm-checkbox-field-hint),
        &:has(span.mm-checkbox-field-error) {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        span.mm-checkbox-field-error,
        span.mm-checkbox-field-hint {
          font-family: var(
            --mat-form-field-subscript-text-font,
            var(--mat-sys-body-small-font)
          );
          line-height: var(
            --mat-form-field-subscript-text-line-height,
            var(--mat-sys-body-small-line-height)
          );
          font-size: var(
            --mat-form-field-subscript-text-size,
            var(--mat-sys-body-small-size)
          );
          letter-spacing: var(
            --mat-form-field-subscript-text-tracking,
            var(--mat-sys-body-small-tracking)
          );
          font-weight: var(
            --mat-form-field-subscript-text-weight,
            var(--mat-sys-body-small-weight)
          );
        }

        span.mm-checkbox-field-error {
          color: var(--mat-sys-error);
        }

        .mm-checkbox-field {
          &.readonly {
            pointer-events: none;
            user-select: none;
            touch-action: none;
          }
          &.error {
            --mdc-checkbox-selected-icon-color: var(--mat-sys-error);
          }
        }
      }
    }
  `,
})
export class BooleanFieldComponent<TParent = undefined> {
  readonly state = input.required<BooleanState<TParent>>();

  readonly appearance = input<MatFormFieldAppearance>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.appearance ??
      'fill',
  );
  readonly floatLabel = input<FloatLabelType>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.floatLabel ??
      'auto',
  );
  readonly subscriptSizing = input<SubscriptSizing>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })
      ?.subscriptSizing ?? 'fixed',
  );
  readonly hideRequiredMarker = input<boolean>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })
      ?.hideRequiredMarker ?? false,
  );

  private readonly model = viewChild.required(NgModel);

  constructor() {
    effect(() => {
      if (this.state().touched()) this.model().control.markAsTouched();
      else this.model().control.markAsUntouched();
    });
  }
}
