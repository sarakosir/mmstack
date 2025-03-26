import { computed, Signal } from '@angular/core';
import { formControl } from '@mmstack/form-core';
import {
  ArrayValidatorOptions,
  injectValidators,
} from '@mmstack/form-validation';
import { DerivedSignal } from '@mmstack/primitives';
import { SelectState, SelectStateOptions } from './select';

function defaultJoinLabel(labels: string[]) {
  const first = labels.at(0);
  if (!first) return '';
  if (labels.length === 1) return first;
  return `${first}, +${labels.length - 1}`;
}

export type MultiSelectState<T extends any[], TParent = undefined> = Omit<
  SelectState<T, TParent>,
  'type' | 'equal' | 'options'
> & {
  equal: SelectState<T[number], TParent>['equal'];
  options: SelectState<T[number], TParent>['options'];
  errorTooltip: Signal<string>;
  type: 'multi-select';
};

export type MultiSelectStateOptions<T extends any[]> = Omit<
  SelectStateOptions<T>,
  'options' | 'identify' | 'display' | 'disableOption'
> & {
  options: SelectStateOptions<T[number]>['options'];
  identify?: SelectStateOptions<T[number]>['identify'];
  display?: SelectStateOptions<T[number]>['display'];
  disableOption?: SelectStateOptions<T[number]>['disableOption'];
  joinLabel?: () => (labels: string[]) => string;
};

export function createMultiSelectState<T extends any[], TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: MultiSelectStateOptions<T>,
): MultiSelectState<T, TParent> {
  const identify = computed(() => opt.identify?.() ?? ((v: T) => `${v}`));

  const equal = (a: T[number], b: T[number]) => {
    return identify()(a) === identify()(b);
  };

  const state = formControl<T, TParent>(value, {
    ...opt,
    equal:
      opt.equal ??
      ((a: T, b: T) => {
        return a.length === b.length && a.every((v, i) => equal(v, b[i]));
      }),
  });

  const display = computed(() => opt.display?.() ?? ((v: T[number]) => `${v}`));

  const disableOption = computed(() => opt.disableOption?.() ?? (() => false));

  const valueIds = computed(() => new Set(state.value().map(identify())));
  const joinLabel = computed(() => opt.joinLabel?.() ?? defaultJoinLabel);
  const valueLabel = computed(() => joinLabel()(state.value().map(display())));

  const identifiedOptions = computed(() => {
    const identityFn = identify();

    return opt.options().map((value) => ({
      value,
      id: identityFn(value),
    }));
  });

  const options = computed(() => {
    return identifiedOptions().map((o) => ({
      ...o,
      label: computed(() => display()(o.value)),
      disabled: computed(() => {
        if (valueIds().has(o.id)) return false;
        return state.disabled() || state.readonly() || disableOption()(o.value);
      }),
    }));
  });

  return {
    ...state,
    valueLabel,
    options,
    equal,
    placeholder: computed(() => opt.placeholder?.() ?? ''),
    errorTooltip: computed(() => ''),
    type: 'multi-select',
  };
}

export function injectCreateMultiSelectState() {
  const validators = injectValidators();

  return <T extends any[], TParent = undefined>(
    value: T | DerivedSignal<TParent, T>,
    opt: Omit<SelectStateOptions<T>, 'required' | 'validator'> & {
      validation?: () => ArrayValidatorOptions;
    },
  ): MultiSelectState<T, TParent> => {
    const validation = computed(() => ({
      minLength: 0,
      maxLength: Infinity,
      ...opt.validation?.(),
    }));

    const mergedValidator = computed(() => validators.array.all(validation()));

    const validator = computed(() => {
      const merged = mergedValidator();

      return (value: T) => {
        return merged(value);
      };
    });

    const required = computed(() => validation().minLength > 0);

    const state = createMultiSelectState(value, {
      ...opt,
      required,
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
