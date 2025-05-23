import {
  computed,
  inject,
  LOCALE_ID,
  type Signal,
  untracked,
} from '@angular/core';
import {
  type CreateFormControlOptions,
  type DerivedSignal,
  formControl,
  type FormControlSignal,
} from '@mmstack/form-core';
import {
  injectValidators,
  NumberValidatorOptions,
} from '@mmstack/form-validation';
import { tooltip } from '../util';

const ALLOWED_SEPARATOR_CODES = ['Comma', 'Period', 'Decimal', 'NumpadDecimal'];
const ALLOWED_DIGIT_CODES = [
  'Numpad',
  'Minus',
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'Numpad0',
  'Numpad1',
  'Numpad2',
  'Numpad3',
  'Numpad4',
  'Numpad5',
  'Numpad6',
  'Numpad7',
  'Numpad8',
  'Numpad9',
];
const ALLOWED_EDIT_CODES = ['Backspace', 'Delete'];
const ALLOWED_CONTROL_CODES = [
  'Tab',
  'Enter',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
];

const SHORTCUT_CODES = ['KeyC', 'KeyX', 'KeyV', 'KeyA', 'KeyZ', 'KeyY'];

const ALLOWED_NON_META_CODES = new Set([
  ...ALLOWED_SEPARATOR_CODES,
  ...ALLOWED_DIGIT_CODES,
  ...ALLOWED_EDIT_CODES,
  ...ALLOWED_CONTROL_CODES,
]);

const ALLOWED_SHORTCUT_CODES = new Set(SHORTCUT_CODES);

function isAllowedKey(e?: KeyboardEvent) {
  if (!e || !e.code) return false;
  if (ALLOWED_NON_META_CODES.has(e.code)) return true;

  return (e.metaKey || e.ctrlKey) && ALLOWED_SHORTCUT_CODES.has(e.code);
}

const DEFAULT_ISO_DECIMAL_SEPARATOR = '.';

function isIsoDecimalSeparator(sep: string) {
  return sep === DEFAULT_ISO_DECIMAL_SEPARATOR;
}

function getDecimalSeparator(locale?: string) {
  if (!locale) return '.';
  const numberFormat = new Intl.NumberFormat(locale);
  const parts = numberFormat.formatToParts(1.1);
  const decimalPart = parts.find((part) => part.type === 'decimal');
  return decimalPart ? decimalPart.value : '.';
}

/**
 * Represents the reactive state for a number input form control.
 *
 * Extends `FormControlSignal<number | null>` with properties and helpers
 * for handling placeholders, step increments/decrements, localized number formatting
 * (decimal separators), keyboard input filtering/handling for non-standard separators,
 * and enhanced error display (error vs tooltip).
 *
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @see FormControlSignal
 */
export type NumberState<TParent = undefined> = FormControlSignal<
  number | null,
  TParent
> & {
  /** Signal holding the input placeholder text (e.g., "Enter quantity", "0"). */
  placeholder: Signal<string>;
  /**
   * Signal holding the step value used for incrementing/decrementing the number,
   * typically via spinner buttons or the ArrowUp/ArrowDown keys handled by `keydownHandler`.
   * Defaults to `1`.
   */
  step: Signal<number>;
  /**
   * Signal holding the formatted error message suitable for tooltips or detailed display.
   * When multiple validation errors occur, this may contain all messages, while `error()` might show a summary.
   * (Generated by `injectCreateNumberState` using the validator's `.resolve()` method, or shortened by provided maxErrorHintLength).
   */
  errorTooltip: Signal<string>;
  /** signal for hint tooltip, default is shortened when hint is longer than 40 chars */
  hintTooltip: Signal<string>;
  /**
   * Signal holding the current numeric value formatted for display.
   * If the configured decimal separator is the standard '.', this returns the raw `number | null`.
   * Otherwise, it returns a `string | null` with the decimal point replaced by the configured separator.
   * Useful for binding directly to the `value` of an `<input [type]="state.inputType()">`.
   */
  localizedValue: Signal<string | number | null>;
  /**
   * Function to update the control's underlying numeric value from user input,
   * which might be a string containing a localized decimal separator (e.g., ',').
   * Parses the input string (replacing the localized separator with '.') back into a number.
   * Handles `null`, empty string, and non-numeric input gracefully (sets value to `null`).
   * Intended for use with `(input)` or `(change)` events, especially when `inputType` is 'string'.
   * No-op if the control is disabled or readonly.
   * @param value The string, number, or null value received from the input element.
   */
  setLocalizedValue: (value: string | number | null) => void;
  /**
   * Signal indicating the appropriate HTML `input` element `type` attribute ('number' or 'string').
   * Returns `'number'` if the configured decimal separator is '.', otherwise returns `'string'`.
   * Using `<input type="string">` is necessary to allow users to type non-standard decimal separators (like ',').
   * Bind using `[type]="state.inputType()"`.
   */
  inputType: Signal<'string' | 'number'>;
  /**
   * Signal returning a keydown event handler function: `(e?: KeyboardEvent) => void`.
   * Attach this to the `(keydown)` event of the input element, particularly when `inputType` might be 'string'.
   * When active (not disabled/readonly and using non-'.' separator), it:
   * - Prevents input of disallowed characters (allows digits, configured separator, minus, editing keys, standard shortcuts).
   * - Handles ArrowUp/ArrowDown keys to increment/decrement the value by `step()`.
   * It's a no-op if `inputType` is 'number' or the control is disabled/readonly.
   */
  keydownHandler: Signal<(e?: KeyboardEvent) => void>;
  /** Type discriminator for number controls. */
  type: 'number';
};

/**
 * Configuration options for the `createNumberState` function (the non-DI version).
 * Extends base form control options for a `number | null` value.
 *
 * @see CreateFormControlOptions
 * @see createNumberState
 */
export type NumberStateOptions = CreateFormControlOptions<
  number | null,
  'control'
> & {
  /** Optional function returning the step value for number increments/decrements. Defaults to `() => 1`. */
  step?: () => number;
  /** Optional function returning the placeholder text for the number input. */
  placeholder?: () => string;
  /**
   * Optional function returning the desired decimal separator character (e.g., ',', '.').
   * If not provided, defaults to '.' (ISO standard). This affects the behavior of
   * `localizedValue`, `setLocalizedValue`, `inputType`, and `keydownHandler`.
   * If using `injectCreateNumberState`, prefer the `localizeDecimal` option instead.
   */
  decimalSeparator?: () => string;
  /* shortens error/hint message & provides errorTooltip with full message, default 40 */
  maxErrorHintLength?: () => number;
};

/**
 * Configuration options specifically for the factory function returned by
 * `injectCreateNumberState`.
 *
 * This type omits base properties handled internally by the factory (like `validator`, `required`, `decimalSeparator`)
 * and requires validation rules to be provided via the `validation` property using `NumberValidatorOptions`.
 * It adds the `localizeDecimal` option for streamlined locale-based or manual separator configuration.
 *
 * @see injectCreateNumberState
 * @see NumberStateOptions
 * @see NumberValidatorOptions
 */
export type InjectedNumberStateOptions = Omit<
  NumberStateOptions,
  'required' | 'validator' | 'decimalSeparator' // Properties handled by the injected factory or new options
> & {
  /**
   * Optional function returning a `NumberValidatorOptions` object defining the validation rules.
   * The factory uses this configuration with the injected `validators.number.all()` method.
   * @example validation: () => ({ required: true, min: 0, integer: true })
   */
  validation?: () => NumberValidatorOptions;
  /**
   * Configures if and how the decimal separator should be localized, affecting input type,
   * formatting (`localizedValue`), parsing (`setLocalizedValue`), and keyboard handling (`keydownHandler`).
   * Options:
   * - `() => true`: Use the decimal separator determined from the injected `LOCALE_ID`.
   * - `() => string`: Use the provided string literal as the decimal separator (e.g., `() => ','`).
   * - `() => false` or `undefined` (or omit): Use the default '.' separator (results in `<input type="number">`).
   * @example localizeDecimal: () => true // Use locale's separator (e.g., ',' for 'de-DE') -> input type="string"
   * @example localizeDecimal: () => ',' // Force comma separator -> input type="string"
   * @example // No option provided -> uses '.' separator -> input type="number"
   */
  localizeDecimal?: () => boolean | string;
};

/**
 * Creates the reactive state object (`NumberState`) for a number form control
 * without relying on Angular's dependency injection for validation or localization.
 *
 * Use this function directly only if creating state outside an injection context, providing
 * a fully custom `validator`, or needing to manually specify the `decimalSeparator`.
 * Prefer `injectCreateNumberState` for standard usage within Angular applications, as it
 * integrates validation, locale-based formatting, and enhanced error display.
 *
 * Note: The `errorTooltip` signal returned by this function will initially be empty.
 *
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 * @param value The initial number value (`number | null`), or a `DerivedSignal` linking it to a parent state.
 * @param opt Optional configuration options (`NumberStateOptions`), potentially including `validator`, `decimalSeparator`, `step`, `placeholder`.
 * @returns A `NumberState` instance managing the control's reactive state.
 * @see injectCreateNumberState
 */
export function createNumberState<TParent = undefined>(
  value: number | null | DerivedSignal<TParent, number | null>,
  opt?: NumberStateOptions,
): NumberState<TParent> {
  const decimal = computed(
    () => opt?.decimalSeparator?.() ?? DEFAULT_ISO_DECIMAL_SEPARATOR,
  );

  const state = formControl(value, opt);

  const step = computed(() => opt?.step?.() ?? 1);

  const isIsoSeparator = computed(() => isIsoDecimalSeparator(decimal()));

  const arrowFns = computed(() => {
    const stp = step();

    return {
      inc: () => {
        state.value.update((cur) => {
          if (cur === null) return 0;
          return cur + stp;
        });
      },
      dec: () => {
        state.value.update((cur) => {
          if (cur === null) return 0;
          return cur - stp;
        });
      },
    };
  });

  const { shortened: error, tooltip: errorTooltip } = tooltip(
    state.error,
    opt?.maxErrorHintLength,
  );
  const { shortened: hint, tooltip: hintTooltip } = tooltip(
    state.hint,
    opt?.maxErrorHintLength,
  );

  return {
    ...state,
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    step,
    error,
    errorTooltip,
    hint,
    hintTooltip,
    localizedValue: computed(() => {
      const v = state.value();
      if (isIsoSeparator()) return v;
      if (v === null) return null;

      return String(v).replace(DEFAULT_ISO_DECIMAL_SEPARATOR, decimal());
    }),
    setLocalizedValue: (value: string | number | null) => {
      if (untracked(state.disabled) || untracked(state.readonly)) return;
      if (value === null || value === '') return state.value.set(null);
      if (typeof value === 'number') return state.value.set(value);
      if (typeof value !== 'string') return;

      const sep = untracked(decimal);
      const parsed = Number(value.replace(sep, DEFAULT_ISO_DECIMAL_SEPARATOR));
      if (isNaN(parsed)) return state.value.set(null);
      return state.value.set(parsed);
    },
    keydownHandler: computed(() => {
      if (isIsoSeparator() || state.disabled() || state.readonly()) {
        return () => {
          // noop
        };
      }

      const { inc, dec } = arrowFns();

      return (e?: KeyboardEvent) => {
        if (!isAllowedKey(e) || !e?.isTrusted) return e?.preventDefault();

        if (e?.code === 'ArrowUp') {
          e.preventDefault();
          return inc();
        }
        if (e?.code === 'ArrowDown') {
          e.preventDefault();
          return dec();
        }
      };
    }),
    inputType: computed(() => (isIsoSeparator() ? 'number' : 'string')),
    type: 'number',
  };
}

/**
 * Creates and returns a factory function for generating `NumberState` instances.
 *
 * This factory leverages Angular's dependency injection (`injectValidators`, `LOCALE_ID`)
 * to seamlessly integrate:
 * - Validation configuration via `NumberValidatorOptions`.
 * - Optional localization for decimal separators using the `localizeDecimal` option.
 * - Enhanced error message formatting (splitting merged errors into `error` and `errorTooltip`).
 *
 * This is the **recommended** way to create `NumberState` within an Angular application.
 *
 * @returns A factory function: `(value: number | null | DerivedSignal<TParent, number | null>, opt?: InjectedNumberStateOptions) => NumberState<TParent>`.
 * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
 *
 * @example
 * // Within an injection context:
 * const createNumber = injectCreateNumberState();
 *
 * const quantityState = createNumber(1, {
 * label: () => 'Qty',
 * step: () => 1,
 * validation: () => ({ required: true, min: 1, integer: true })
 * });
 *
 * const localPriceState = createNumber(null, {
 * label: () => 'Price',
 * placeholder: () => '0,00', // Example for comma locale
 * localizeDecimal: () => true, // Use locale separator (e.g., ',')
 * validation: () => ({ required: true, min: 0, multipleOf: 0.01 })
 * });
 *
 * // Template usage requires handling localized input if localizeDecimal is not false/undefined:
 * // <input
 * //   [type]="localPriceState.inputType()" // Will be 'string' if locale uses ','
 * //   [value]="localPriceState.localizedValue()" // Formats number with ','
 * //   (input)="localPriceState.setLocalizedValue($any($event).target.value)" // Parses input with ','
 * //   (keydown)="localPriceState.keydownHandler()($event)" // Restricts keys for string input
 * //   ... />
 */
export function injectCreateNumberState() {
  const validators = injectValidators();
  const locale = inject(LOCALE_ID, { optional: true }) ?? 'en-US';

  /**
   * Factory function (returned by `injectCreateNumberState`) that creates `NumberState`.
   * Integrates with `@mmstack/form-validation` via DI for validation and localization.
   * Handles decimal separator localization and enhanced error display.
   *
   * @template TParent The type of the parent form group's value, if applicable. Defaults to `undefined`.
   * @param value The initial number value (`number | null`), or a `DerivedSignal` linking it to a parent state.
   * @param opt Configuration options (`InjectedNumberStateOptions`), including `validation` (using `NumberValidatorOptions`)
   * and the `localizeDecimal` flag/string.
   * @returns A `NumberState` instance managing the control's reactive state, including helpers for
   * localized input handling and separate `error`/`errorTooltip` signals.
   */
  return <TParent = undefined>(
    value: number | null | DerivedSignal<TParent, number | null>,
    opt?: InjectedNumberStateOptions,
  ): NumberState<TParent> => {
    const validationOptions = computed(() => ({
      messageOptions: {
        label: opt?.label?.(),
      },
      ...opt?.validation?.(),
    }));

    const decimal = computed(() => {
      const localizeDec = opt?.localizeDecimal?.();
      if (!localizeDec) return DEFAULT_ISO_DECIMAL_SEPARATOR;
      return typeof localizeDec === 'string'
        ? localizeDec
        : getDecimalSeparator(locale);
    });

    const mergedValidator = computed(() =>
      validators.number.all(validationOptions()),
    );

    const validator = computed(() => {
      const merged = mergedValidator();

      return (value: number | null) => {
        return merged(value);
      };
    });

    const state = createNumberState(value, {
      ...opt,
      decimalSeparator: decimal,
      required: computed(() => opt?.validation?.()?.required ?? false),
      validator,
    });

    const resolvedError = computed(() => {
      const merger = mergedValidator();

      return merger.resolve(state.errorTooltip() || state.error());
    });

    return {
      ...state,
      error: computed(() => resolvedError().error),
      errorTooltip: computed(() => resolvedError().tooltip),
    };
  };
}
