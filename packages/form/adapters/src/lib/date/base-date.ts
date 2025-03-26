import { computed, inject, LOCALE_ID, Signal } from '@angular/core';
import {
  CreateFormControlOptions,
  DerivedSignal,
  formControl,
  FormControlSignal,
} from '@mmstack/form-core';
import {
  DateValidatorOptions,
  injectValidators,
} from '@mmstack/form-validation';

export type DateState<TParent = undefined, TDate = Date> = FormControlSignal<
  TDate | null,
  TParent
> & {
  min: Signal<Date | null>;
  max: Signal<Date | null>;
  placeholder: Signal<string>;
  errorTooltip: Signal<string>;
  type: 'date';
};

export type DateStateOptions<TDate = Date> = CreateFormControlOptions<
  TDate | null,
  'control'
> & {
  locale: string;
  placeholder?: () => string;
  min?: () => string | Date | null;
  max?: () => string | Date | null;
};

export function createDateState<TParent = undefined, TDate = Date>(
  value: TDate | null | DerivedSignal<TParent, TDate | null>,
  opt: DateStateOptions<TDate>,
): DateState<TParent, TDate> {
  const state = formControl<TDate | null, TParent>(value, opt);

  return {
    ...state,
    min: computed(() => {
      const min = opt.min?.();
      if (!min) return null;
      return typeof min === 'string' ? new Date(min) : min;
    }),
    max: computed(() => {
      const max = opt.max?.();
      if (!max) return null;
      return typeof max === 'string' ? new Date(max) : max;
    }),
    placeholder: computed(() => opt.placeholder?.() ?? ''),
    errorTooltip: computed(() => ''),
    type: 'date',
  };
}

export function injectCreateDateState() {
  const validators = injectValidators();
  const locale = inject(LOCALE_ID);

  return <TDate = Date, TParent = undefined>(
    value: TDate | null | DerivedSignal<TParent, TDate | null>,
    opt?: Omit<
      DateStateOptions<TDate>,
      'required' | 'validator' | 'locale' | 'min' | 'max'
    > & {
      validation?: () => DateValidatorOptions;
    },
  ) => {
    const validation = computed(() => opt?.validation?.() ?? {});

    const mergedValidator = computed(() => validators.date.all(validation()));

    const validator = computed(() => {
      const merged = mergedValidator();

      return (value: TDate | null) => {
        return merged(value as Date);
      };
    });

    const state = createDateState(value, {
      ...opt,
      locale,
      required: computed(() => opt?.validation?.()?.required ?? false),
      validator,
      min: computed(() => validation().min ?? null),
      max: computed(() => validation().max ?? null),
    });

    const resolvedError = computed(() => {
      const merger = mergedValidator();

      return merger.resolve(state.error());
    });

    return {
      ...state,
      error: computed(() => resolvedError().error),
      errorTooltip: computed(() => resolvedError().tooltip),
    };
  };
}
