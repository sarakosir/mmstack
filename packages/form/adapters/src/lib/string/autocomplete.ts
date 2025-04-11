import { computed, type Signal } from '@angular/core';
import { type StringValidatorOptions } from '@mmstack/form-validation';
import { type DerivedSignal } from '@mmstack/primitives';
import {
  createStringState,
  injectCreateStringState,
  type StringState,
  type StringStateOptions,
} from './base-string';

/**
 * Represents the reactive state for an autocomplete input form control,
 * typically used with components like Angular Material's `mat-autocomplete`.
 *
 * Extends `StringState` by adding a dynamically filtered list of selectable
 * string options (`options` signal) based on user input and the configuration
 * provided via `AutocompleteStateOptions`.
 *
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @see StringState
 * @see FormControlSignal
 */
export type AutocompleteState<TParent = undefined> = Omit<
  StringState<TParent>,
  'type'
> & {
  /**
   * A signal holding the array of currently available autocomplete options that match
   * the user's input value. The matching is typically a case-insensitive substring check
   * against the option's display label (determined by `displayWith`).
   *
   * Each option object in the array includes:
   * - `value`: The original string value of the option.
   * - `label`: A signal containing the display label for the option.
   *
   * Bind the UI component's options list (e.g., `mat-option` loop) to this signal.
   */
  options: Signal<{ value: string; label: Signal<string> }[]>;
  /** Type discriminator for autocomplete controls. */
  type: 'autocomplete';
};

/**
 * Configuration options for the `createAutocompleteState` function (the non-DI version).
 * Extends `StringStateOptions` with settings for providing the list of autocomplete
 * suggestions and customizing their display text.
 *
 * @see StringStateOptions
 * @see createAutocompleteState
 */
export type AutocompleteStateOptions = StringStateOptions & {
  /**
   * Optional function returning the **complete, unfiltered** array of available
   * string options for the autocomplete suggestions. Defaults to `() => []`.
   * The `AutocompleteState` automatically filters this list based on user input
   * to populate the reactive `options` signal.
   * @example options: () => ['Action', 'Adventure', 'Comedy', 'Drama']
   */
  options?: () => string[];
  /**
   * Optional function that transforms an option's raw string `value` (from the `options` array)
   * into the string that should be displayed as its `label` in the UI suggestions list
   * and used for filtering against user input.
   * Defaults to an identity function `(value) => value`.
   * @param value The raw option value.
   * @returns The string label to display and filter against.
   * @example // To display options with a prefix:
   * displayWith: () => (value) => `Category: ${value}`
   */
  displayWith?: () => (value: string) => string;
};

/**
 * Configuration options specifically for the factory function returned by
 * `injectCreateAutocompleteState`.
 *
 * Extends `AutocompleteStateOptions` but omits base properties handled internally
 * by the injected factory (`validator`, `required`). Requires validation rules
 * for the text input portion via the `validation` property using `StringValidatorOptions`.
 *
 * @see injectCreateAutocompleteState
 * @see AutocompleteStateOptions
 * @see InjectedStringStateOptions
 * @see StringValidatorOptions
 */
export type InjectedAutocompleteStateOptions = Omit<
  AutocompleteStateOptions,
  'required' | 'validator' // Properties handled internally via String adapter DI
> & {
  /**
   * Optional function returning a `StringValidatorOptions` object defining validation rules
   * for the text input associated with the autocomplete.
   * The factory uses this configuration with the injected `validators.string.all()` method.
   * Note: Validation typically applies to the input text value itself. It does not, by default,
   * require the value to be one of the autocomplete options unless a custom validator enforcing
   * this is added via the `validator` property within `StringValidatorOptions` if needed.
   * @example validation: () => ({ required: true, maxLength: 30 })
   */
  validation?: () => StringValidatorOptions;
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
    type: 'autocomplete',
  };
}

/**
 * Creates the reactive state object (`AutocompleteState`) for an autocomplete form control
 * without relying on Angular's dependency injection for validation.
 *
 * Builds upon `createStringState` by adding the logic for filtering the provided `options`
 * based on the current input value, using the `displayWith` function for matching.
 * Prefer `injectCreateAutocompleteState` for easier validation integration within Angular.
 *
 * @template TParent The type of the parent form group's value, if applicable.
 * @param value The initial string value (`string | null`), or a `DerivedSignal` linking it to a parent state.
 * @param opt Optional configuration options (`AutocompleteStateOptions`), including `options` and `displayWith`.
 * @returns An `AutocompleteState` instance managing the control's reactive state.
 * @see injectCreateAutocompleteState
 * @see createStringState
 */
export function createAutocompleteState<TParent>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: AutocompleteStateOptions,
): AutocompleteState<TParent> {
  const state = createStringState(value, opt);

  return toAutocompleteState(state, opt);
}

/**
 * Creates and returns a factory function for generating `AutocompleteState` instances.
 *
 * This factory utilizes Angular's dependency injection by wrapping `injectCreateStringState`.
 * It seamlessly integrates validation configuration (via `StringValidatorOptions` in the `validation` option)
 * and enhanced error display, while adding the autocomplete-specific logic for filtering options
 * based on user input.
 *
 * This is the **recommended** way to create `AutocompleteState` within an Angular application.
 *
 * @returns A factory function: `(value: string | null | DerivedSignal<TParent, string | null>, opt?: InjectedAutocompleteStateOptions) => AutocompleteState<TParent>`.
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 *
 * @example
 * // Within an injection context:
 * const createAutocomplete = injectCreateAutocompleteState();
 *
 * const stateState = createAutocomplete('', {
 * label: () => 'US State',
 * placeholder: () => 'Type state name...',
 * options: () => ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', ... ],
 * validation: () => ({ required: true })
 * });
 *
 * // Template usage (conceptual):
 * // <input type="text" [matAutocomplete]="auto" [state]="stateState"> * //
 * // <mat-autocomplete #auto="matAutocomplete">
 * //   @for (option of stateState.options(); track option.value) {
 * //     <mat-option [value]="option.value">{{ option.label() }}</mat-option>
 * //   }
 * // </mat-autocomplete>
 */
export function injectCreateAutocompleteState() {
  const factory = injectCreateStringState();

  /**
   * Factory function (returned by `injectCreateAutocompleteState`) that creates `AutocompleteState`.
   * Builds on `injectCreateStringState` for validation/error handling and adds autocomplete options filtering.
   *
   * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
   * @param value The initial string value (`string | null`), or a `DerivedSignal` linking it to a parent state.
   * @param opt Configuration options (`InjectedAutocompleteStateOptions`), including `options`,
   * `displayWith`, and the `validation` property (accepting `StringValidatorOptions`).
   * @returns An `AutocompleteState` instance managing the control's reactive state.
   */

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: InjectedAutocompleteStateOptions,
  ) => {
    const state = factory(value, opt);

    return toAutocompleteState(state, opt);
  };
}
