import { computed, Signal } from '@angular/core';
import {
  type CreateFormControlOptions,
  type DerivedSignal,
  formControl,
  type FormControlSignal,
} from '@mmstack/form-core';
import {
  injectValidators,
  StringValidatorOptions,
} from '@mmstack/form-validation';

export type StringState<TParent = undefined> = FormControlSignal<
  string | null,
  TParent
> & {
  autocomplete: Signal<AutoFill>;
  placeholder: Signal<string>;
  errorTooltip: Signal<string>;
  type: 'string';
};

export type StringStateOptions = CreateFormControlOptions<
  string | null,
  'control'
> & {
  autocomplete?: () => AutoFill;
  placeholder?: () => string;
};

export function createStringState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: StringStateOptions,
): StringState<TParent> {
  const state = formControl<string | null, TParent>(value, opt);

  return {
    ...state,
    autocomplete: computed(() => opt?.autocomplete?.() ?? 'off'),
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    errorTooltip: computed(() => ''),
    type: 'string',
  };
}

export function injectCreateStringState() {
  const validators = injectValidators();

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: Omit<StringStateOptions, 'required' | 'validator'> & {
      validation?: () => StringValidatorOptions;
    },
  ) => {
    const mergedValidator = computed(() =>
      validators.string.all(opt?.validation?.() ?? {}),
    );

    const validator = computed(() => {
      const merged = mergedValidator();

      return (value: string | null) => {
        return merged(value);
      };
    });

    const state = createStringState(value, {
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
