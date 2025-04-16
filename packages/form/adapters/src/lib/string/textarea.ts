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
 * Represents the reactive state for a multi-line textarea form control.
 *
 * Extends `StringState` by adding signals related to the textarea's row dimensions
 * (`rows`, `minRows`, `maxRows`), often used in conjunction with autosize directives
 * like Angular CDK's `cdkTextareaAutosize`.
 *
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @see StringState
 * @see FormControlSignal
 */
export type TextareaState<TParent = undefined> = Omit<
  StringState<TParent>,
  'type'
> & {
  /**
   * Signal holding the suggested initial number of rows for the textarea display.
   * Calculated based on `TextareaStateOptions.rows`, clamped between `minRows()` and `maxRows()`.
   * Defaults to 3 if not specified or if the provided `rows` is outside the min/max bounds.
   * Useful for setting the initial `rows` attribute on a `<textarea>`.
   */
  rows: Signal<number>;
  /**
   * Signal holding the minimum number of rows the textarea should display,
   * typically used for autosizing directives. Defaults to 3.
   */
  minRows: Signal<number>;
  /**
   * Signal holding the maximum number of rows the textarea should display,
   * typically used for autosizing directives. Defaults to 10.
   */
  maxRows: Signal<number>;
  /** Type discriminator for textarea controls. */
  type: 'textarea';
};

/**
 * Configuration options for the `createTextareaState` function (the non-DI version).
 * Extends `StringStateOptions` with textarea-specific configurations for row dimensions.
 *
 * @see StringStateOptions
 * @see createTextareaState
 */
export type TextareaStateOptions = StringStateOptions & {
  /**
   * Optional function returning the desired initial number of rows for the textarea.
   * Defaults to `() => 3`. The actual value used in the `rows` signal will be
   * clamped between the effective `minRows` and `maxRows`.
   */
  rows?: () => number;
  /**
   * Optional function returning the minimum number of rows for the textarea
   * (e.g., for use with autosize). Defaults to `() => 3`.
   */
  minRows?: () => number;
  /**
   * Optional function returning the maximum number of rows for the textarea
   * (e.g., for use with autosize). Defaults to `() => 10`.
   */
  maxRows?: () => number;
};

/**
 * Configuration options specifically for the factory function returned by
 * `injectCreateTextareaState`.
 *
 * Extends `TextareaStateOptions` but omits base properties handled internally
 * by the injected factory (`validator`, `required`). Requires validation rules
 * for the string content via the `validation` property using `StringValidatorOptions`.
 *
 * @see injectCreateTextareaState
 * @see TextareaStateOptions
 * @see InjectedStringStateOptions
 * @see StringValidatorOptions
 */
export type InjectedTextareaStateOptions = Omit<
  TextareaStateOptions,
  'required' | 'validator' // Properties handled internally via String adapter DI
> & {
  /**
   * Optional function returning a `StringValidatorOptions` object defining validation rules
   * for the textarea's string content.
   * The factory uses this configuration with the injected `validators.string.all()` method.
   * @example validation: () => ({ required: true, maxLength: 1000 })
   */
  validation?: () => StringValidatorOptions;
};

function toTextareaState<TParent = undefined>(
  state: StringState<TParent>,
  opt?: TextareaStateOptions,
): TextareaState<TParent> {
  const minRows = computed(() => opt?.minRows?.() ?? 3);
  const maxRows = computed(() => opt?.maxRows?.() ?? 10);

  const rows = computed(() => {
    const rows = opt?.rows?.() ?? 3;
    if (rows > maxRows() || rows < minRows()) return minRows();
    return rows;
  });
  return {
    ...state,
    rows,
    minRows,
    maxRows,
    type: 'textarea',
  };
}

/**
 * Creates the reactive state object (`TextareaState`) for a textarea form control
 * without relying on Angular's dependency injection for validation.
 *
 * Builds upon `createStringState` by adding signals for row dimensions (`rows`, `minRows`, `maxRows`).
 * Prefer `injectCreateTextareaState` for easier validation integration within Angular applications.
 *
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @param value The initial string value (`string | null`), or a `DerivedSignal` linking it to a parent state.
 * @param opt Optional configuration options (`TextareaStateOptions`), including row settings like `rows`, `minRows`, `maxRows`.
 * @returns A `TextareaState` instance managing the control's reactive state.
 * @see injectCreateTextareaState
 * @see createStringState
 */
export function createTextareaState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: TextareaStateOptions,
): TextareaState<TParent> {
  return toTextareaState(createStringState(value, opt), opt);
}

/**
 * Creates and returns a factory function for generating `TextareaState` instances.
 *
 * This factory utilizes Angular's dependency injection by wrapping `injectCreateStringState`.
 * It handles validation configuration (via `StringValidatorOptions` in the `validation` option)
 * and enhanced error display, while adding the textarea-specific signals for row dimensions.
 *
 * This is the **recommended** way to create `TextareaState` within an Angular application.
 *
 * @returns A factory function: `(value: string | null | DerivedSignal<TParent, string | null>, opt?: InjectedTextareaStateOptions) => TextareaState<TParent>`.
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 *
 * @example
 * // Within an injection context:
 * const createTextarea = injectCreateTextareaState();
 *
 * const notesState = createTextarea('', {
 * label: () => 'Notes',
 * placeholder: () => 'Enter additional notes...',
 * minRows: () => 2,
 * maxRows: () => 6,
 * validation: () => ({ maxLength: 500 })
 * });
 *
 * // Template usage:
 * // <textarea cdkTextareaAutosize
 * //   [cdkAutosizeMinRows]="notesState.minRows()"
 * //   [cdkAutosizeMaxRows]="notesState.maxRows()"
 * //   [rows]="notesState.rows()" * //   [value]="notesState.value()"
 * //   (input)="notesState.value.set($any($event.target).value)"
 * //   [placeholder]="notesState.placeholder()"
 * //   ...bind errors, disabled, readonly etc... />
 */
export function injectCreateTextareaState() {
  const factory = injectCreateStringState();

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: InjectedTextareaStateOptions,
  ): TextareaState<TParent> => {
    return toTextareaState(factory(value, opt), opt);
  };
}
