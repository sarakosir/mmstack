import { computed, inject, LOCALE_ID, Signal } from '@angular/core';
import {
  createDateState as genericCreateDateState,
  type DateState as GenericDateState,
  type DateStateOptions as GenericDateStateOptions,
  injectCreateDateState as genericInjectCreateDateState,
} from '@mmstack/form-adapters';
import { DerivedSignal } from '@mmstack/form-core';
import { DateValidatorOptions } from '@mmstack/form-validation';

export type DateState<TParent = undefined, TDate = Date> = GenericDateState<
  TParent,
  TDate
> & {
  min: Signal<Date | null>;
  max: Signal<Date | null>;
};

export type DateStateOptions<TDate = Date> = GenericDateStateOptions<TDate> & {
  min?: () => string | Date | null;
  max?: () => string | Date | null;
};

function addMaterialSpecifics<TParent = undefined, TDate = Date>(
  state: GenericDateState<TParent, TDate>,
  opt: DateStateOptions<TDate>,
): DateState<TParent, TDate> {
  return {
    ...state,
    min: computed(() => {
      const min = opt.min?.();
      if (!min) return null;
      return typeof min === 'string' ? new Date(min) : min;
    }),
    max: computed(() => {
      const max = opt.max?.();
      if (!max) return null;
      return typeof max === 'string' ? new Date(max) : max;
    }),
  };
}

export function createDateState<TParent = undefined, TDate = Date>(
  value: TDate | null | DerivedSignal<TParent, TDate | null>,
  opt: DateStateOptions<TDate>,
): DateState<TParent, TDate> {
  return addMaterialSpecifics(genericCreateDateState(value, opt), opt);
}

export function injectCreateDateState() {
  const factory = genericInjectCreateDateState();
  const locale = inject(LOCALE_ID);

  return <TDate = Date, TParent = undefined>(
    value: TDate | null | DerivedSignal<TParent, TDate | null>,
    opt?: Omit<
      DateStateOptions<TDate>,
      'required' | 'validator' | 'locale' | 'min' | 'max'
    > & {
      validation?: () => DateValidatorOptions;
    },
  ) => {
    const validation = computed(() => opt?.validation?.() ?? {});

    return addMaterialSpecifics(factory(value, opt), {
      min: () => validation().min ?? null,
      max: () => validation().max ?? null,
      locale,
    });
  };
}
