import { HttpResourceRequest } from '@angular/common/http';
import { computed, Signal, WritableSignal } from '@angular/core';
import {
  CreateFormControlOptions,
  DerivedSignal,
  formControl,
  FormControlSignal,
} from '@mmstack/form-core';
import { injectValidators } from '@mmstack/form-validation';
import { debounced } from '@mmstack/primitives';

export type SearchState<T, TParent = undefined> = FormControlSignal<
  T,
  TParent
> & {
  placeholder: Signal<string>;
  searchPlaceholder: Signal<string>;
  identify: Signal<(item: NoInfer<T>) => string>;
  displayWith: Signal<(item: NoInfer<T>) => string>;
  disableOption: Signal<(item: NoInfer<T>) => boolean>;
  query: WritableSignal<string>;
  request: Signal<HttpResourceRequest | undefined>;
  panelWidth: Signal<string | number | null>;
  disableOptionCentering: Signal<boolean>;
  hideSingleSelectionIndicator: Signal<boolean>;
  overlayPanelClass: Signal<string>;
  type: 'search';
  valueLabel: Signal<string>;
  valueId: Signal<string>;
  onSelected: (value: T) => void;
};

export type SearchStateOptions<T> = CreateFormControlOptions<T, 'control'> & {
  placeholder?: () => string;
  searchPlaceholder?: () => string;
  identify?: () => (item: NoInfer<T>) => string;
  displayWith?: () => (item: NoInfer<T>) => string;
  disableOption?: () => (item: NoInfer<T>) => boolean;
  toRequest: () => (query: string) => HttpResourceRequest | undefined;
  panelWidth?: () => string | number | null;
  onSelected?: (value: T) => void;
  disableOptionCentering?: () => boolean;
  hideSingleSelectionIndicator?: () => boolean;
  overlayPanelClass?: () => string;
  debounce?: number;
};

export function createSearchState<T, TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: SearchStateOptions<T>,
): SearchState<T, TParent> {
  const identify = computed(() => opt.identify?.() ?? ((v: T) => `${v}`));

  const equal = (a: T, b: T) => {
    return identify()(a) === identify()(b);
  };

  const state = formControl<T, TParent>(value, {
    ...opt,
    equal: opt.equal ?? equal,
  });

  const query = debounced('', { ms: opt.debounce });

  const displayWith = computed(() => opt.displayWith?.() ?? ((v: T) => `${v}`));

  const disableOption = computed(() => opt.disableOption?.() ?? (() => false));

  const toRequest = computed(() => opt.toRequest());

  const onSelected =
    opt.onSelected ??
    (() => {
      // noop
    });

  return {
    ...state,
    placeholder: computed(() => opt.placeholder?.() ?? ''),
    searchPlaceholder: computed(() => opt.searchPlaceholder?.() ?? ''),
    identify,
    displayWith,
    disableOption,
    query,
    request: computed(() => {
      if (state.disabled() || state.readonly()) return;

      return toRequest()(query());
    }),
    panelWidth: computed(() => {
      const pw = opt.panelWidth?.();
      if (!pw || pw === 'auto') return null;
      return pw;
    }),
    disableOptionCentering: computed(
      () => opt.disableOptionCentering?.() ?? false,
    ),
    overlayPanelClass: computed(() => opt.overlayPanelClass?.() ?? ''),
    hideSingleSelectionIndicator: computed(
      () => opt.hideSingleSelectionIndicator?.() ?? false,
    ),
    valueLabel: computed(() => displayWith()(state.value())),
    valueId: computed(() => identify()(state.value())),
    onSelected,
    type: 'search',
  };
}

export function injectCreateSearchState() {
  const validators = injectValidators();

  return <T, TParent = undefined>(
    value: T | DerivedSignal<TParent, T>,
    opt: Omit<SearchStateOptions<T>, 'required' | 'validator'> & {
      validation?: () => {
        required?: boolean;
      };
    },
  ) => {
    const validation = computed(() => ({
      required: false,
      ...opt.validation?.(),
    }));

    const required = computed(() => validation().required);

    const validator = computed(() =>
      required() ? validators.general.required() : () => '',
    );

    return createSearchState(value, { ...opt, required, validator });
  };
}
