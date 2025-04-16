import { type DerivedSignal } from '@mmstack/primitives';
import {
  createBooleanState,
  injectCreateBooleanState,
  type BooleanState,
  type BooleanStateOptions,
  type InjectedBooleanStateOptions,
} from './base-boolean';

/**
 * Represents the reactive state for a toggle switch form control (e.g., `mat-slide-toggle`).
 *
 * This type is functionally equivalent to `BooleanState` but overrides the `type`
 * discriminator to `'toggle'` for specific identification if needed.
 *
 * @template TParent The type of the parent form group's value, if applicable.
 * @see BooleanState
 */
export type ToggleState<TParent = undefined> = Omit<
  BooleanState<TParent>,
  'type'
> & {
  /** Type discriminator for toggle switch controls. */
  type: 'toggle';
};

/**
 * Configuration options for `createToggleState`.
 * This is a direct type alias for `BooleanStateOptions`.
 *
 * @see BooleanStateOptions
 * @see createToggleState
 */
export type ToggleStateOptions = BooleanStateOptions;

/**
 * Configuration options for the factory function returned by `injectCreateToggleState`.
 * This is a direct type alias for `InjectedBooleanStateOptions`.
 *
 * @see InjectedBooleanStateOptions
 * @see injectCreateToggleState
 */
export type InjectedToggleStateOptions = InjectedBooleanStateOptions;

/**
 * Creates the reactive state object (`ToggleState`) for a toggle switch form control
 * without relying on Angular's dependency injection for validation setup.
 *
 * This function wraps `createBooleanState` and simply overrides the `type` property
 * to `'toggle'`. Use this function if creating state outside an injection context
 * or providing a manual `validator` function via the options.
 *
 * For easier validation integration (like `requireTrue`), prefer `injectCreateToggleState`.
 *
 * @template TParent The type of the parent form group's value, if applicable.
 * @param value The initial boolean value (`true`/`false`), or a `DerivedSignal` linking it to a parent state.
 * @param opt Optional configuration (`ToggleStateOptions`, alias for `BooleanStateOptions`).
 * @returns A `ToggleState` object managing the toggle's reactive state.
 * @see createBooleanState
 * @see injectCreateToggleState
 */
export function createToggleState<TParent = undefined>(
  value: boolean | DerivedSignal<TParent, boolean>,
  opt?: ToggleStateOptions,
): ToggleState<TParent> {
  return {
    ...createBooleanState(value, opt),
    type: 'toggle',
  };
}

/**
 * Creates and returns a factory function for generating `ToggleState` instances.
 *
 * This factory utilizes Angular's dependency injection by wrapping the factory
 * returned from `injectCreateBooleanState`. It simplifies validation integration
 * (e.g., setting `requireTrue` via the `validation` option).
 *
 * This is the **recommended** way to create `ToggleState` when working within
 * an Angular injection context, especially if validation is needed.
 *
 * @returns A factory function: `(value: boolean | DerivedSignal<TParent, boolean>, opt?: InjectedToggleStateOptions) => ToggleState<TParent>`.
 * @see injectCreateBooleanState
 * @see InjectedToggleStateOptions
 * @example
 * // Within an Angular injection context (component, service, etc.):
 * const createToggle = injectCreateToggleState(); // Get the factory
 *
 * // Create state for an optional dark mode toggle
 * const darkModeState = createToggle(false, { label: () => 'Dark Mode' });
 *
 * // Create state for a toggle that must be enabled
 * const enableAnalyticsState = createToggle(false, {
 * label: () => 'Enable Analytics',
 * validation: () => ({ requireTrue: true }) // Use validation option
 * });
 */
export function injectCreateToggleState() {
  const factory = injectCreateBooleanState();

  /**
   * Factory function (returned by `injectCreateToggleState`) that creates `ToggleState`.
   * It wraps the factory from `injectCreateBooleanState` and sets the `type` to `'toggle'`.
   *
   * @template TParent The type of the parent form group's value, if applicable.
   * @param value The initial boolean value, or a `DerivedSignal` linking it to a parent state.
   * @param opt Configuration options (`InjectedToggleStateOptions`), including the `validation` property.
   * @returns A `ToggleState` instance managing the toggle's reactive state.
   */
  return <TParent = undefined>(
    value: boolean | DerivedSignal<TParent, boolean>,
    opt?: InjectedToggleStateOptions,
  ): ToggleState<TParent> => {
    return {
      ...factory(value, opt),
      type: 'toggle',
    };
  };
}
