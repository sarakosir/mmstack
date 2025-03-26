import { type DerivedSignal } from '@mmstack/primitives';
import {
  BooleanStateOptions,
  createBooleanState,
  injectCreateBooleanState,
  type BooleanState,
} from './base-boolean';

export type ToggleState<TParent = undefined> = Omit<
  BooleanState<TParent>,
  'type'
> & {
  type: 'toggle';
};

export type ToggleStateOptions = BooleanStateOptions;

export function createToggleState<TParent = undefined>(
  value: boolean | DerivedSignal<TParent, boolean>,
  opt?: ToggleStateOptions,
): ToggleState<TParent> {
  return {
    ...createBooleanState(value, opt),
    type: 'toggle',
  };
}

export function injectCreateToggleState() {
  const factory = injectCreateBooleanState();
  return <TParent = undefined>(
    value: boolean | DerivedSignal<TParent, boolean>,
    opt?: Omit<ToggleStateOptions, 'validator'> & {
      validation?: () => {
        requireTrue?: boolean;
      };
    },
  ): ToggleState<TParent> => {
    return {
      ...factory(value, opt),
      type: 'toggle',
    };
  };
}
