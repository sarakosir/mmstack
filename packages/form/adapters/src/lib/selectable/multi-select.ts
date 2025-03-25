import { computed, Signal } from '@angular/core';
import { formControl } from '@mmstack/form-core';
import {
  ArrayValidatorOptions,
  injectValidators,
} from '@mmstack/form-validation';
import { DerivedSignal } from '@mmstack/primitives';
import { SelectState, SelectStateOptions } from './select';

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
};

export function createMultiSelectState<T extends any[], TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: MultiSelectStateOptions<T>,
): MultiSelectState<T, TParent> {
  const identify = computed(() => opt.identify?.() ?? ((v: T) => `${v}`));

  const equal = (a: T, b: T) => {
    return identify()(a) === identify()(b);
  };

  const state = formControl<T, TParent>(value, {
    ...opt,
    equal: opt.equal ?? equal,
  });

  const display = computed(() => opt.display?.() ?? ((v: T) => `${v}`));

  const disableOption = computed(() => opt.disableOption?.() ?? (() => false));

  const valueId = computed(() => identify()(state.value()));
  const valueLabel = computed(() => display()(state.value()));

  const identifiedOptions = computed(() => {
    const identityFn = identify();

    return opt.options().map((value) => ({
      value,
      id: identityFn(value),
    }));
  });

  const allOptions = computed(() => {
    return identifiedOptions().map((o) => ({
      ...o,
      label: computed(() => display()(o.value)),
      disabled: computed(() => {
        if (valueId() === o.id) return false;
        return state.disabled() || state.readonly() || disableOption()(o.value);
      }),
    }));
  });

  const options = computed(() => {
    const currentId = valueId();

    const opt = allOptions();
    if (opt.some((o) => o.id === currentId)) return opt;

    return [
      {
        id: currentId,
        value: state.value(),
        label: valueLabel,
        disabled: computed(() => false),
      },
      ...opt,
    ];
  });

  return {
    ...state,
    valueLabel,
    options,
    panelWidth: computed(() => {
      const pw = opt.panelWidth?.();
      if (!pw || pw === 'auto') return null;
      return pw;
    }),
    equal,
    placeholder: computed(() => opt.placeholder?.() ?? ''),
    errorTooltip: computed(() => ''),
    disableOptionCentering: computed(
      () => opt.disableOptionCentering?.() ?? false,
    ),
    overlayPanelClass: computed(() => opt.overlayPanelClass?.() ?? ''),
    hideSingleSelectionIndicator: computed(
      () => opt.hideSingleSelectionIndicator?.() ?? false,
    ),
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
