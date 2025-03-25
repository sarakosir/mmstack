import { computed, type Signal } from '@angular/core';
import { StringValidatorOptions } from '@mmstack/form-validation';
import { type DerivedSignal } from '@mmstack/primitives';
import {
  createStringState,
  injectCreateStringState,
  type StringState,
  type StringStateOptions,
} from './base-string';

export type AutocompleteState<TParent = undefined> = Omit<
  StringState<TParent>,
  'type'
> & {
  options: Signal<{ value: string; label: Signal<string> }[]>;
  panelWidth: Signal<string | number>;
  type: 'autocomplete';
};

export type AutocompleteStateOptions = StringStateOptions & {
  options?: () => string[];
  displayWith?: () => (value: string) => string;
  panelWidth?: () => string | number;
};

function toAutocompleteState<TParent = undefined>(
  state: StringState<TParent>,
  opt?: AutocompleteStateOptions,
): AutocompleteState<TParent> {
  const displayFn = computed(() => opt?.displayWith?.() ?? ((v: string) => v));

  const allOptions = computed(() => opt?.options?.() ?? []);

  const lcsValue = computed(() => state.value()?.toLowerCase() ?? '');

  const options = computed(() =>
    allOptions().map((value) => {
      const label = computed(() => displayFn()(value));
      const lcsLabel = computed(() => label().toLowerCase());

      return {
        value,
        label,
        show: computed(() => !lcsValue() || lcsLabel().includes(lcsValue())),
      };
    }),
  );

  return {
    ...state,
    options: computed(() => options().filter((o) => o.show())),
    panelWidth: computed(() => opt?.panelWidth?.() ?? 'auto'),
    type: 'autocomplete',
  };
}

export function createAutocompleteState<TParent>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: AutocompleteStateOptions,
): AutocompleteState<TParent> {
  const state = createStringState(value, opt);

  return toAutocompleteState(state, opt);
}

export function injectCreateAutocompleteState() {
  const factory = injectCreateStringState();

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: Omit<AutocompleteStateOptions, 'required' | 'validator'> & {
      validation?: () => StringValidatorOptions;
    },
  ) => {
    const state = factory(value, opt);

    return toAutocompleteState(state, opt);
  };
}
