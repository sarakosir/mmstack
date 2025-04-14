import { type DerivedSignal } from '@mmstack/primitives';
import {
  createSelectState,
  injectCreateSelectState,
  type SelectState,
  type SelectStateOptions,
} from './select';

/**
 * Represents the reactive state for a single-selection button group form control
 * (e.g., `<mat-button-toggle-group>`).
 *
 * This type is functionally equivalent to `SelectState` but omits the `placeholder`
 * property (as it's not typically used in button groups) and overrides the `type`
 * discriminator to `'button-group'`. It manages the selected value (`T`), the list
 * of available button options, display labels, etc., inheriting most logic from `SelectState`.
 *
 * @template T The type of the individual button option values (e.g., string, number). Usually non-nullable.
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @see SelectState
 * @see FormControlSignal
 */
export type ButtonGroupState<T, TParent = undefined> = Omit<
  SelectState<T, TParent>,
  'type' | 'hintTooltip' | 'errorTooltip' | 'placeholder' // Omits placeholder, changes type discriminator
> & {
  /** Type discriminator for button group controls. */
  type: 'button-group';
};

/**
 * Configuration options for the `createButtonGroupState` function (the non-DI version).
 *
 * Inherits all options from `SelectStateOptions` (like `options`, `identify`, `display`, `disableOption`)
 * **except** for `placeholder`, which is not applicable to button groups.
 * The `options` function (returning the available choices) is required.
 *
 * @template T The type of the individual button option values.
 * @see SelectStateOptions
 * @see createButtonGroupState
 */
export type ButtonGroupStateOptions<T> = Omit<
  SelectStateOptions<T>,
  'placeholder' | 'maxErrorHintLength'
>;

/**
 * Configuration options for the factory function returned by `injectCreateButtonGroupState`.
 *
 * Currently defined as a direct type alias for `ButtonGroupStateOptions`.
 *
 * @template T The type of the individual button option values.
 *
 * @see ButtonGroupStateOptions
 * @see injectCreateButtonGroupState
 * @see InjectedSelectStateOptions (Note: This alias differs from the pattern used by other injected option types which typically omit validator/required and add a `validation` property. The underlying select factory still expects the simplified validation format).
 */
export type InjectedButtonGroupStateOptions<T> = ButtonGroupStateOptions<T>;

/**
 * Creates the reactive state object (`ButtonGroupState`) for a button group form control
 * without relying on Angular's dependency injection for validation.
 *
 * This function wraps `createSelectState`, applying the same logic for handling options,
 * identification, display, and equality, but sets the `type` discriminator to `'button-group'`
 * and uses options that exclude the `placeholder`.
 *
 * Prefer `injectCreateButtonGroupState` for standard usage within Angular applications,
 * particularly for easier `required` validation integration.
 *
 * @template T The type of the individual button option values.
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @param value The initial selected value (`T`), or a `DerivedSignal` linking it to a parent state.
 * @param opt Configuration options (`ButtonGroupStateOptions`). **Note:** This parameter (and `opt.options`) is required.
 * @returns A `ButtonGroupState` instance managing the control's reactive state.
 * @see injectCreateButtonGroupState
 * @see createSelectState
 */
export function createButtonGroupState<T, TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: ButtonGroupStateOptions<T>,
): ButtonGroupState<T, TParent> {
  return {
    ...createSelectState(value, opt),
    type: 'button-group',
  };
}

/**
 * Creates and returns a factory function for generating `ButtonGroupState` instances.
 *
 * This factory utilizes Angular's dependency injection by wrapping the factory returned
 * from `injectCreateSelectState`. It primarily simplifies the application of basic `required`
 * validation through the underlying select factory's handling of the `validation` option
 * (even though `InjectedButtonGroupStateOptions` is currently an alias for the non-injected options).
 *
 * This is the **recommended** way to create `ButtonGroupState` within an Angular application.
 *
 * @returns A factory function: `(value: T | DerivedSignal<TParent, T>, opt: InjectedButtonGroupStateOptions<T>) => ButtonGroupState<T, TParent>`.
 * @template T The type of the individual button option values.
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @see injectCreateSelectState
 * @see InjectedButtonGroupStateOptions
 *
 * @example
 * // Within an injection context:
 * const createBtnGroup = injectCreateButtonGroupState();
 *
 * const viewModeOptions = ['list', 'grid'] as const;
 * type ViewMode = typeof viewModeOptions[number];
 *
 * const viewState = createBtnGroup<ViewMode>('list', {
 * label: () => 'View As',
 * options: () => [...viewModeOptions],
 * // Pass validation using the structure expected by injectCreateSelectState
 * // even though InjectedButtonGroupStateOptions doesn't explicitly define it
 * validation: () => ({ required: true })
 * } as InjectedButtonGroupStateOptions<ViewMode>); // Type assertion might be needed
 *
 * // Template usage (conceptual):
 * // <mat-button-toggle-group [(ngModel)]="viewState.value">
 * //   @for (option of viewState.options(); track option.id) {
 * //     <mat-button-toggle [value]="option.value" [disabled]="option.disabled()">
 * //       {{ option.label() }}
 * //     </mat-button-toggle>
 * //   }
 * // </mat-button-toggle-group>
 */
export function injectCreateButtonGroupState() {
  const factory = injectCreateSelectState();

  /**
   * Factory function (returned by `injectCreateButtonGroupState`) that creates `ButtonGroupState`.
   * Wraps the factory from `injectCreateSelectState` and sets the `type` to `'button-group'`.
   * Integrates with validation via the underlying select factory.
   *
   * @template T The type of the individual button option values.
   * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
   * @param value The initial selected value (`T`), or a `DerivedSignal` linking it to a parent state.
   * @param opt Configuration options (`InjectedButtonGroupStateOptions`). **Note:** This parameter (and `opt.options`) is required.
   * Although `InjectedButtonGroupStateOptions` is currently an alias for `ButtonGroupStateOptions`,
   * it's passed to the underlying select factory which expects simplified validation options
   * (e.g., `{ validation: () => ({ required: true }) }`). Ensure the provided `opt` object structure
   * matches what the underlying `injectCreateSelectState` factory needs for validation if applicable.
   * @returns A `ButtonGroupState` instance managing the control's reactive state.
   */
  return <T, TParent = undefined>(
    value: T | DerivedSignal<TParent, T>,
    opt: InjectedButtonGroupStateOptions<T>,
  ): ButtonGroupState<T, TParent> => {
    return {
      ...factory(value, opt),
      type: 'button-group',
    };
  };
}
