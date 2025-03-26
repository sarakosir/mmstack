import {
  type MultiSelectState as GenericMultiSelectState,
  type MultiSelectStateOptions as GenericMultiSelectStateOptions,
  createMultiSelectState as genericCreateMultiSelectState,
  injectCreateMultiSelectState as genericInjectCreateMultiSelectState,
} from '@mmstack/form-adapters';
import { ArrayValidatorOptions } from '@mmstack/form-validation';
import { DerivedSignal } from '@mmstack/primitives';
import {
  MaterialSelectStateExtension,
  MaterialSelectStateOptionsExtension,
  SelectStateOptions,
  toMaterialSelectSpecifics,
} from './select';

export type MultiSelectState<
  T extends any[],
  TParent = undefined,
> = GenericMultiSelectState<T, TParent> & MaterialSelectStateExtension;

export type MultiSelectStateOptions<T extends any[]> =
  GenericMultiSelectStateOptions<T> & MaterialSelectStateOptionsExtension;

export function createMultiSelectState<T extends any[], TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: MultiSelectStateOptions<T>,
): MultiSelectState<T, TParent> {
  return toMaterialSelectSpecifics(
    genericCreateMultiSelectState(value, opt),
    opt,
  );
}

export function injectCreateMultiSelectState() {
  const factory = genericInjectCreateMultiSelectState();

  return <T extends any[], TParent = undefined>(
    value: T | DerivedSignal<TParent, T>,
    opt: Omit<SelectStateOptions<T>, 'required' | 'validator'> & {
      validation?: () => ArrayValidatorOptions;
    },
  ): MultiSelectState<T, TParent> => {
    return toMaterialSelectSpecifics(factory(value, opt), opt);
  };
}
