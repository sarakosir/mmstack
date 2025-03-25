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
import { QueryResourceOptions } from '@mmstack/resource';

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
  resourceOptions: QueryResourceOptions<T[]>;
  panelWidth: Signal<string | number | null>;
  type: 'search';
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
  debounce?: number;
  resourceOptions?: QueryResourceOptions<T[]>;
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

  return {
    ...state,
    placeholder: computed(() => opt.placeholder?.() ?? ''),
    searchPlaceholder: computed(() => opt.searchPlaceholder?.() ?? ''),
    identify,
    displayWith,
    disableOption,
    query,
    request: computed(() => toRequest()(query())),
    panelWidth: computed(() => {
      const pw = opt.panelWidth?.();
      if (!pw || pw === 'auto') return null;
      return pw;
    }),
    resourceOptions: opt.resourceOptions ?? {},
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
