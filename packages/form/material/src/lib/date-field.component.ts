import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
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
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { DateState, SignalErrorValidator } from './adapters';

@Component({
  selector: 'mm-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatInput,
    MatSuffix,
    MatDatepicker,
    MatDatepickerToggle,
    MatDatepickerInput,
    MatTooltip,
    SignalErrorValidator,
  ],
  host: {
    class: 'mm-date-field',
  },
  template: `
    <mat-form-field
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      [subscriptSizing]="subscriptSizing()"
      [hideRequiredMarker]="hideRequiredMarker()"
    >
      <mat-label>{{ state().label() }}</mat-label>

      <input
        matInput
        [(ngModel)]="state().value"
        [disabled]="state().disabled()"
        [readonly]="state().readonly()"
        [required]="state().required()"
        [placeholder]="state().placeholder()"
        [matDatepicker]="picker"
        [min]="min()"
        [max]="max()"
        [mmSignalError]="state().error()"
        (blur)="state().markAsTouched()"
      />

      <mat-datepicker-toggle
        matIconSuffix
        [for]="picker"
        [disabled]="state().disabled() || state().readonly()"
      />
      <mat-datepicker #picker (closed)="state().markAsTouched()" />

      <mat-error [matTooltip]="state().errorTooltip()">
        {{ state().error() }}
      </mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .mm-date-field {
      display: contents;

      mat-form-field {
        width: 100%;
      }
    }
  `,
})
export class DateFieldComponent<TParent = undefined, TDate = Date> {
  readonly state = input.required<DateState<TParent, TDate>>();

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

  protected readonly min = computed(() => this.state().min?.() ?? null);
  protected readonly max = computed(() => this.state().max?.() ?? null);

  constructor() {
    effect(() => {
      if (this.state().touched()) this.model().control.markAsTouched();
      else this.model().control.markAsUntouched();
    });
  }
}
