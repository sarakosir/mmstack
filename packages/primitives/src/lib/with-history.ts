import {
  computed,
  type CreateSignalOptions,
  type Signal,
  untracked,
  type ValueEqualityFn,
  type WritableSignal,
} from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';
import { mutable } from './mutable';
import { toWritable } from './to-writable';

export type SignalWithHistory<T> = WritableSignal<T> & {
  history: Signal<T[]>;
  undo: () => void;
  redo: () => void;
  canRedo: Signal<boolean>;
  canUndo: Signal<boolean>;
  clear: () => void;
  canClear: Signal<boolean>;
};

export type CreateHistoryOptions<T> = Omit<
  CreateSignalOptions<T[]>,
  'equal'
> & {
  maxSize?: number;
};

export function withHistory<T>(
  source: WritableSignal<T>,
  opt?: CreateHistoryOptions<T>,
): SignalWithHistory<T> {
  const { equal = Object.is, debugName } = source[SIGNAL] as {
    equal?: ValueEqualityFn<T>;
    debugName?: string;
  };

  const maxSize = opt?.maxSize ?? Infinity;

  const history = mutable<T[]>([], opt);

  const redoArray = mutable<T[]>([]);

  const set = (value: T) => {
    const current = untracked(source);
    if (equal(value, current)) return;

    source.set(value);

    history.mutate((c) => {
      if (c.length >= maxSize) {
        c = c.slice(Math.floor(maxSize / 2));
      }
      c.push(current);
      return c;
    });
    redoArray.set([]);
  };

  const update = (updater: (prev: T) => T) => {
    set(updater(untracked(source)));
  };

  const internal = toWritable(
    computed(() => source(), {
      equal,
      debugName,
    }),
    set,
    update,
  ) as SignalWithHistory<T>;
  internal.history = history;

  internal.undo = () => {
    const last = untracked(history);
    if (last.length === 0) return;

    const prev = last.at(-1)!;
    const cur = untracked(source);

    history.inline((c) => c.pop());
    redoArray.inline((c) => c.push(cur));

    source.set(prev);
  };

  internal.redo = () => {
    const last = untracked(redoArray);
    if (last.length === 0) return;

    const prev = last.at(-1)!;

    redoArray.inline((c) => c.pop());

    set(prev);
  };

  internal.clear = () => {
    history.set([]);
    redoArray.set([]);
  };

  internal.canUndo = computed(() => history().length > 0);
  internal.canRedo = computed(() => redoArray().length > 0);
  internal.canClear = computed(() => internal.canUndo() || internal.canRedo());

  return internal;
}
