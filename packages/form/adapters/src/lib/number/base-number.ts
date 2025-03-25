import { computed, Signal } from '@angular/core';
import {
  CreateFormControlOptions,
  DerivedSignal,
  formControl,
  FormControlSignal,
} from '@mmstack/form-core';
import {
  injectValidators,
  NumberValidatorOptions,
} from '@mmstack/form-validation';

export type NumberState<TParent = undefined> = FormControlSignal<
  number | null,
  TParent
> & {
  placeholder: Signal<string>;
  step: Signal<number>;
  errorTooltip: Signal<string>;
  type: 'number';
};

export type NumberStateOptions = CreateFormControlOptions<
  number | null,
  'control'
> & {
  step?: () => number;
  placeholder?: () => string;
};

export function createNumberState<TParent = undefined>(
  value: number | null | DerivedSignal<TParent, number | null>,
  opt?: NumberStateOptions,
): NumberState<TParent> {
  return {
    ...formControl(value, opt),
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    step: computed(() => opt?.step?.() ?? 1),
    errorTooltip: computed(() => ''),
    type: 'number',
  };
}

export function injectCreateNumberState() {
  const validators = injectValidators();

  return <TParent = undefined>(
    value: number | null | DerivedSignal<TParent, number | null>,
    opt?: Omit<NumberStateOptions, 'required' | 'validator'> & {
      validation?: () => NumberValidatorOptions;
    },
  ): NumberState<TParent> => {
    const mergedValidator = computed(() =>
      validators.number.all(opt?.validation?.() ?? {}),
    );

    const validator = computed(() => {
      const merged = mergedValidator();

      return (value: number | null) => {
        return merged(value);
      };
    });

    const state = createNumberState(value, {
      ...opt,
      required: computed(() => opt?.validation?.()?.required ?? false),
      validator,
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
