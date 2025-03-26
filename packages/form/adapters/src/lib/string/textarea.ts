import { computed, Signal } from '@angular/core';
import { StringValidatorOptions } from '@mmstack/form-validation';
import { DerivedSignal } from '@mmstack/primitives';
import {
  createStringState,
  injectCreateStringState,
  StringState,
  StringStateOptions,
} from './base-string';

export type TextareaState<TParent = undefined> = Omit<
  StringState<TParent>,
  'type'
> & {
  rows: Signal<number>;
  minRows: Signal<number>;
  maxRows: Signal<number>;
  type: 'textarea';
};

export type TextareaStateOptions = StringStateOptions & {
  rows?: () => number;
  minRows?: () => number;
  maxRows?: () => number;
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

export function createTextareaState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: TextareaStateOptions,
): TextareaState<TParent> {
  return toTextareaState(createStringState(value, opt), opt);
}

export function injectCreateTextareaState() {
  const factory = injectCreateStringState();

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: Omit<TextareaStateOptions, 'required' | 'validator'> & {
      validation?: () => StringValidatorOptions;
    },
  ): TextareaState<TParent> => {
    return toTextareaState(factory(value, opt), opt);
  };
}
