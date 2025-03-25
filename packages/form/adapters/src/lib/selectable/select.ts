import { computed, Signal } from '@angular/core';
import {
  CreateFormControlOptions,
  DerivedSignal,
  formControl,
  FormControlSignal,
} from '@mmstack/form-core';
import { injectValidators } from '@mmstack/form-validation';

export type SelectState<T, TParent = undefined> = FormControlSignal<
  T,
  TParent
> & {
  placeholder: Signal<string>;
  options: Signal<
    { id: string; value: T; label: Signal<string>; disabled: Signal<boolean> }[]
  >;
  valueLabel: Signal<string>;
  equal: (a: T, b: T) => boolean;
  panelWidth: Signal<string | number | null>;
  disableOptionCentering: Signal<boolean>;
  hideSingleSelectionIndicator: Signal<boolean>;
  overlayPanelClass: Signal<string>;
  type: 'select';
};

export type SelectStateOptions<T> = CreateFormControlOptions<T, 'control'> & {
  placeholder?: () => string;
  identify?: () => (value: NoInfer<T>) => string;
  display?: () => (value: NoInfer<T>) => string;
  disableOption?: () => (value: NoInfer<T>) => boolean;
  disableOptionCentering?: () => boolean;
  hideSingleSelectionIndicator?: () => boolean;
  overlayPanelClass?: () => string;
  options: () => T[];
  panelWidth?: () => string | number | null;
};

export function createSelectState<T, TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: SelectStateOptions<T>,
): SelectState<T, TParent> {
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
    if (opt.length && opt.some((o) => o.id === currentId)) return opt;

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
    disableOptionCentering: computed(
      () => opt.disableOptionCentering?.() ?? false,
    ),
    overlayPanelClass: computed(() => opt.overlayPanelClass?.() ?? ''),
    hideSingleSelectionIndicator: computed(
      () => opt.hideSingleSelectionIndicator?.() ?? false,
    ),
    type: 'select',
  };
}

export function injectCreateSelectState() {
  const validators = injectValidators();

  return <T, TParent = undefined>(
    value: T | DerivedSignal<TParent, T>,
    opt: Omit<SelectStateOptions<T>, 'required' | 'validator'> & {
      validation?: () => {
        required?: boolean;
      };
    },
  ): SelectState<T, TParent> => {
    const validation = computed(() => ({
      required: false,
      ...opt.validation?.(),
    }));

    const validator = computed(() =>
      validation().required ? validators.general.required() : () => '',
    );

    const required = computed(() => validation().required);

    return createSelectState(value, {
      ...opt,
      required,
      validator,
    });
  };
}
