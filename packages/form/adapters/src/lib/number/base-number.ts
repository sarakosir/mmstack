import { computed, inject, LOCALE_ID, Signal, untracked } from '@angular/core';
import {
  CreateFormControlOptions,
  DerivedSignal,
  formControl,
  FormControlSignal,
} from '@mmstack/form-core';
import {
  injectValidators,
  NumberValidatorOptions,
} from '@mmstack/form-validation';

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

export type NumberState<TParent = undefined> = FormControlSignal<
  number | null,
  TParent
> & {
  placeholder: Signal<string>;
  step: Signal<number>;
  errorTooltip: Signal<string>;
  localizedValue: Signal<string | number | null>;
  setLocalizedValue: (value: string | number | null) => void;
  inputType: Signal<'string' | 'number'>;
  keydownHandler: Signal<(e?: KeyboardEvent) => void>;
  type: 'number';
};

export type NumberStateOptions = CreateFormControlOptions<
  number | null,
  'control'
> & {
  step?: () => number;
  placeholder?: () => string;
  decimalSeparator?: () => string;
};

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

  return {
    ...state,
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    step,
    errorTooltip: computed(() => ''),
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

export function injectCreateNumberState() {
  const validators = injectValidators();
  const locale = inject(LOCALE_ID, { optional: true }) ?? 'en-US';

  return <TParent = undefined>(
    value: number | null | DerivedSignal<TParent, number | null>,
    opt?: Omit<NumberStateOptions, 'required' | 'validator' | 'decimal'> & {
      validation?: () => NumberValidatorOptions;
      localizeDecimal?: () => boolean | string;
    },
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

      return merger.resolve(state.error());
    });

    return {
      ...state,
      error: computed(() => resolvedError().error),
      errorTooltip: computed(() => resolvedError().tooltip),
    };
  };
}
