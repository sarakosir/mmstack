import { computed } from '@angular/core';
import {
  formControl,
  type CreateFormControlOptions,
  type DerivedSignal,
  type FormControlSignal,
} from '@mmstack/form-core';
import { injectValidators } from '@mmstack/form-validation';

export type BooleanState<TParent = undefined> = FormControlSignal<
  boolean,
  TParent
> & {
  type: 'boolean';
};

export type BooleanStateOptions = Omit<
  CreateFormControlOptions<boolean, 'control'>,
  'required'
>;

export function createBooleanState<TParent = undefined>(
  value: boolean | DerivedSignal<TParent, boolean>,
  opt?: BooleanStateOptions,
): BooleanState<TParent> {
  return {
    ...formControl(value, opt),
    type: 'boolean',
  };
}

export function injectCreateBooleanState() {
  const validators = injectValidators();

  return <TParent = undefined>(
    value: boolean | DerivedSignal<TParent, boolean>,
    opt?: Omit<BooleanStateOptions, 'validator'> & {
      validation?: () => {
        requireTrue?: boolean;
      };
    },
  ): BooleanState<TParent> => {
    const validation = computed(() => ({
      requireTrue: false,
      ...opt?.validation?.(),
    }));

    const validator = computed(() => {
      if (validation().requireTrue) return validators.boolean.mustBeTrue();
      return () => '';
    });

    return createBooleanState(value, { ...opt, validator });
  };
}
