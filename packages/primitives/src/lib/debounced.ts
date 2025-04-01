import {
  computed,
  type CreateSignalOptions,
  type Signal,
  signal,
  type WritableSignal,
} from '@angular/core';
import { toWritable } from './to-writable';

/**
 * Options for creating a debounced writable signal.
 * Extends Angular's `CreateSignalOptions` with a debounce time setting.
 *
 * @template T The type of value held by the signal.
 */
export type CreateDebouncedOptions<T> = CreateSignalOptions<T> & {
  /**
   * The debounce delay in milliseconds. Specifies how long to wait after the
   * last `set` or `update` call before the debounced signal reflects the new value.
   */
  ms?: number;
};

/**
 * A specialized `WritableSignal` whose publicly readable value updates are debounced.
 *
 * It provides access to the underlying, non-debounced signal via the `original` property.
 *
 * @template T The type of value held by the signal.
 */
export type DebouncedSignal<T> = WritableSignal<T> & {
  /**
   * A reference to the original, inner `WritableSignal`.
   * This signal's value is updated *immediately* upon calls to `set` or `update`
   * on the parent `DebouncedSignal`. Useful for accessing the latest value
   * without the debounce delay.
   */
  original: Signal<T>;
};

/**
 * Creates a `WritableSignal` whose publicly readable value is updated only after
 * a specified debounce period (`ms`) has passed since the last call to its
 * `.set()` or `.update()` method.
 *
 * This implementation avoids using `effect` by leveraging intermediate `computed`
 * signals and a custom `equal` function to delay value propagation based on a timer.
 *
 * @template T The type of value the signal holds.
 * @param initial The initial value of the signal.
 * @param opt Options for signal creation, including:
 * - `ms`: The debounce time in milliseconds. Defaults to 0 if omitted (no debounce).
 * - Other `CreateSignalOptions` (like `equal`) are passed to underlying signals.
 * @returns A `DebouncedSignal<T>` instance. Its readable value updates are debounced,
 * and it includes an `.original` property providing immediate access to the latest set value.
 *
 * @example
 * ```ts
 * import { effect } from '@angular/core';
 *
 * // Create a debounced signal with a 500ms delay
 * const query = debounced('', { ms: 500 });
 *
 * effect(() => {
 * // This effect runs 500ms after the last change to 'query'
 * console.log('Debounced Query:', query());
 * });
 *
 * effect(() => {
 * // This effect runs immediately when 'query.original' changes
 * console.log('Original Query:', query.original());
 * });
 *
 * console.log('Setting query to "a"');
 * query.set('a');
 * // Output: Original Query: a
 *
 * setTimeout(() => {
 * console.log('Setting query to "ab"');
 * query.set('ab');
 * // Output: Original Query: ab
 * }, 200); // Before debounce timeout
 *
 * setTimeout(() => {
 * console.log('Setting query to "abc"');
 * query.set('abc');
 * // Output: Original Query: abc
 * }, 400); // Before debounce timeout
 *
 * // ~500ms after the *last* set (at 400ms), the debounced effect runs:
 * // Output (at ~900ms): Debounced Query: abc
 * ```
 */
export function debounced<T>(
  initial: T,
  opt: CreateDebouncedOptions<T>,
): DebouncedSignal<T> {
  const internal = signal(initial, opt);
  const ms = opt.ms ?? 0;

  const trigger = signal(false);

  let timeout: ReturnType<typeof setTimeout> | undefined;

  const set = (value: T) => {
    if (timeout) clearTimeout(timeout);
    internal.set(value);

    timeout = setTimeout(() => {
      trigger.update((c) => !c);
    }, ms);
  };

  const update = (fn: (prev: T) => T) => {
    if (timeout) clearTimeout(timeout);
    internal.update(fn);

    timeout = setTimeout(() => {
      trigger.update((c) => !c);
    }, ms);
  };

  const stable = computed(
    () => ({
      trigger: trigger(),
      value: internal(),
    }),
    {
      equal: (a, b) => a.trigger === b.trigger,
    },
  );

  const writable = toWritable(
    computed(() => stable().value, opt),
    set,
    update,
  ) as DebouncedSignal<T>;
  writable.original = internal;

  return writable;
}
