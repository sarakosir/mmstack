import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import {
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  MatEndDate,
  MatStartDate,
} from '@angular/material/datepicker';
import {
  FloatLabelType,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatError,
  MatFormField,
  MatFormFieldAppearance,
  MatHint,
  MatLabel,
  MatSuffix,
  SubscriptSizing,
} from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { DateRangeState, SignalErrorValidator } from './adapters';

@Component({
  selector: 'mm-date-range-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatSuffix,
    MatDatepickerToggle,
    MatDateRangePicker,
    MatDateRangeInput,
    MatStartDate,
    MatEndDate,
    MatTooltip,
    SignalErrorValidator,
  ],
  host: {
    class: 'mm-date-range-field',
  },
  template: `
    <mat-form-field
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      [subscriptSizing]="subscriptSizing()"
      [hideRequiredMarker]="hideRequiredMarker()"
    >
      <mat-label>{{ state().label() }}</mat-label>

      <mat-date-range-input
        [rangePicker]="picker"
        [min]="state().min()"
        [max]="state().max()"
        [disabled]="state().disabled()"
        [required]="state().required()"
      >
        <input
          matStartDate
          [(ngModel)]="state().children().start.value"
          [readonly]="state().readonly()"
          [placeholder]="state().children().start.placeholder()"
          [mmSignalError]="state().error()"
          (blur)="state().children().start.markAsTouched()"
        />
        <input
          matEndDate
          [readonly]="state().readonly()"
          [(ngModel)]="state().children().end.value"
          [placeholder]="state().children().end.placeholder()"
          [mmSignalError]="state().error()"
          (blur)="state().children().end.markAsTouched()"
        />
      </mat-date-range-input>

      <mat-datepicker-toggle
        matIconSuffix
        [for]="picker"
        [disabled]="state().disabled() || state().readonly()"
      />
      <mat-date-range-picker #picker (closed)="state().markAsTouched()" />

      <mat-error
        [matTooltip]="state().errorTooltip()"
        matTooltipPositionAtOrigin
        matTooltipClass="mm-multiline-tooltip"
        >{{ state().error() }}</mat-error
      >

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .mm-date-range-field {
      display: contents;

      mat-form-field {
        width: 100%;

        .mat-mdc-notch-piece.mdc-notched-outline__notch:has(mat-label:empty) {
          display: none;
        }
      }
    }
  `,
})
export class DateRangeFieldComponent<TParent = undefined, TDate = Date> {
  readonly state = input.required<DateRangeState<TParent, TDate>>();

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

  private readonly models = viewChildren(NgModel);

  constructor() {
    effect(() => {
      if (this.state().touched())
        this.models().forEach((m) => m.control.markAsTouched());
      else this.models().forEach((m) => m.control.markAsUntouched());
    });
  }
}
