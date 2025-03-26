import { computed, type Signal } from '@angular/core';
import {
  type AutocompleteState as GenericAutocompleteState,
  type AutocompleteStateOptions as GenericAutocompleteStateOptions,
  createAutocompleteState as genericCreateAutocompleteState,
  injectCreateAutocompleteState as genericInjectCreateAutocompleteState,
} from '@mmstack/form-adapters';
import { type StringValidatorOptions } from '@mmstack/form-validation';
import { type DerivedSignal } from '@mmstack/primitives';

export type AutocompleteState<TParent = undefined> =
  GenericAutocompleteState<TParent> & {
    panelWidth: Signal<string | number>;
  };

export type AutocompleteStateOptions = GenericAutocompleteStateOptions & {
  panelWidth?: () => string | number;
};

function toMaterialSpecifics<TParent = undefined>(
  state: GenericAutocompleteState<TParent>,
  opt?: AutocompleteStateOptions,
): AutocompleteState<TParent> {
  return {
    ...state,
    panelWidth: computed(() => opt?.panelWidth?.() ?? 'auto'),
  };
}

export function createAutocompleteState<TParent>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: AutocompleteStateOptions,
): AutocompleteState<TParent> {
  return toMaterialSpecifics(genericCreateAutocompleteState(value, opt), opt);
}

export function injectCreateAutocompleteState() {
  const factory = genericInjectCreateAutocompleteState();

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: Omit<AutocompleteStateOptions, 'required' | 'validator'> & {
      validation?: () => StringValidatorOptions;
    },
  ) => {
    return toMaterialSpecifics(factory(value, opt), opt);
  };
}
