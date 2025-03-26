import { computed, type Signal } from '@angular/core';
import {
  type BooleanState as GenericBooleanState,
  type BooleanStateOptions as GenericBooleanStateOptions,
  createBooleanState as genericCreateBooleanState,
  injectCreateBooleanState as genericInjectCreateBooleanState,
} from '@mmstack/form-adapters';
import { type DerivedSignal } from '@mmstack/form-core';

export type BooleanState<TParent = undefined> = GenericBooleanState<TParent> & {
  labelPosition: Signal<'before' | 'after'>;
};

export type BooleanStateOptions = GenericBooleanStateOptions & {
  labelPosition?: () => 'before' | 'after';
};

function addMaterialSpecifics<TParent>(
  state: GenericBooleanState<TParent>,
  opt?: BooleanStateOptions,
): BooleanState<TParent> {
  return {
    ...state,
    labelPosition: computed(() => opt?.labelPosition?.() ?? 'after'),
  };
}

export function createBooleanState<TParent = undefined>(
  value: boolean | DerivedSignal<TParent, boolean>,
  opt?: BooleanStateOptions,
): BooleanState<TParent> {
  return addMaterialSpecifics(genericCreateBooleanState(value, opt));
}

export function injectCreateBooleanState() {
  const factory = genericInjectCreateBooleanState();

  return <TParent = undefined>(
    value: boolean | DerivedSignal<TParent, boolean>,
    opt?: Omit<BooleanStateOptions, 'validator'> & {
      validation?: () => {
        requireTrue?: boolean;
      };
    },
  ): BooleanState<TParent> => {
    return addMaterialSpecifics(factory(value, opt), opt);
  };
}
