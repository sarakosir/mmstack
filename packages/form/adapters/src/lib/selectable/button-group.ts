import { DerivedSignal } from '@mmstack/primitives';
import {
  createSelectState,
  injectCreateSelectState,
  SelectState,
  SelectStateOptions,
} from './select';

export type ButtonGroupState<T, TParent = undefined> = Omit<
  SelectState<T, TParent>,
  'type' | 'placeholder'
> & {
  type: 'button-group';
};

export type ButtonGroupStateOptions<T> = Omit<
  SelectStateOptions<T>,
  'placeholder'
>;

export function createButtonGroupState<T, TParent = undefined>(
  value: T | DerivedSignal<TParent, T>,
  opt: ButtonGroupStateOptions<T>,
): ButtonGroupState<T, TParent> {
  return {
    ...createSelectState(value, opt),
    type: 'button-group',
  };
}

export function injectCreateButtonGroupState() {
  const factory = injectCreateSelectState();

  return <T, TParent = undefined>(
    value: T | DerivedSignal<TParent, T>,
    opt: ButtonGroupStateOptions<T>,
  ): ButtonGroupState<T, TParent> => {
    return {
      ...factory(value, opt),
      type: 'button-group',
    };
  };
}
