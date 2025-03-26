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
import {
  FloatLabelType,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatError,
  MatFormField,
  MatFormFieldAppearance,
  MatHint,
  MatLabel,
  SubscriptSizing,
} from '@angular/material/form-field';
import {
  MatOption,
  MatSelect,
  MatSelectTrigger,
} from '@angular/material/select';
import { SelectState, SignalErrorValidator } from '@mmstack/form-adapters';

@Component({
  selector: 'mm-select-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatSelect,
    MatOption,
    MatSelectTrigger,
    SignalErrorValidator,
  ],
  host: {
    class: 'mm-select-field',
  },
  template: `
    <mat-form-field
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      [subscriptSizing]="subscriptSizing()"
      [hideRequiredMarker]="hideRequiredMarker()"
    >
      <mat-label>{{ state().label() }}</mat-label>

      <mat-select
        [class.readonly]="state().readonly()"
        [(ngModel)]="state().value"
        [required]="state().required()"
        [mmSignalError]="state().error()"
        [panelWidth]="state().panelWidth()"
        [disabled]="state().disabled()"
        [compareWith]="state().equal"
        [placeholder]="state().placeholder()"
        [disableOptionCentering]="state().disableOptionCentering()"
        [hideSingleSelectionIndicator]="state().hideSingleSelectionIndicator()"
        (blur)="state().markAsTouched()"
        (closed)="state().markAsTouched()"
      >
        <mat-select-trigger>
          {{ state().valueLabel() }}
        </mat-select-trigger>

        @for (opt of state().options(); track opt.id) {
          <mat-option [value]="opt.value" [disabled]="opt.disabled()">
            {{ opt.label() }}
          </mat-option>
        }
      </mat-select>

      <mat-error>{{ state().error() }}</mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .mm-select-field {
      display: contents;

      mat-form-field {
        width: 100%;
      }
    }
  `,
})
export class SelectFieldComponent<T, TParent = undefined> {
  readonly state = input.required<SelectState<T, TParent>>();

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
