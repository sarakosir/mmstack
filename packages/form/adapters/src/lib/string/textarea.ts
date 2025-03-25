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
  type: 'textarea';
};

export type TextareaStateOptions = StringStateOptions;

function toTextareaState<TParent = undefined>(
  state: StringState<TParent>,
): TextareaState<TParent> {
  return {
    ...state,
    type: 'textarea',
  };
}

export function createTextareaState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: TextareaStateOptions,
): TextareaState<TParent> {
  return toTextareaState(createStringState(value, opt));
}

export function injectCreateTextareaState() {
  const factory = injectCreateStringState();

  return <TParent = undefined>(
    value: string | null | DerivedSignal<TParent, string | null>,
    opt?: Omit<TextareaStateOptions, 'required' | 'validator'> & {
      validation?: () => StringValidatorOptions;
    },
  ): TextareaState<TParent> => {
    return toTextareaState(factory(value, opt));
  };
}
