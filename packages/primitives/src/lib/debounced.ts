import {
  computed,
  type CreateSignalOptions,
  signal,
  untracked,
  type WritableSignal,
} from '@angular/core';
import { toWritable } from './to-writable';

/**
 * A `DebouncedSignal` is a special type of `WritableSignal` that delays updates
 * to its value.  This is useful for scenarios where you want to avoid
 * frequent updates, such as responding to user input in a search field.
 * It keeps a reference to the original `WritableSignal` via the `original` property.
 *
 * @typeParam T - The type of value held by the signal.
 */
export type DebouncedSignal<T> = WritableSignal<T> & {
  /**
   * A reference to the original, un-debounced `WritableSignal`. This allows
   * you to access the immediate value (without the debounce delay) if needed,
   * and also ensures that any direct modifications to the original signal
   * are reflected in the debounced signal after the debounce period.
   */
  original: WritableSignal<T>;
};

/**
 * Options for creating a debounced signal.
 *
 * @typeParam T - The type of value held by the signal.
 */
export type CreateDebouncedOptions<T> = CreateSignalOptions<T> & {
  /**
   * The debounce delay in milliseconds. Defaults to 300.
   */
  ms?: number;
};

/**
 * Creates a debounced signal. The signal's value will only be propagated to
 * subscribers after a specified delay (debounce time) has passed since the last
 * time it was set or updated.  Crucially, updates to the *original* signal
 * are also debounced.
 *
 * @see {@link DebouncedSignal}
 * @see {@link CreateDebouncedOptions}
 *
 * @example
 * ```typescript
 * // Create a debounced signal with an initial value and a custom delay.
 * const searchTerm = debounced('initial value', { ms: 500 });
 *
 * // Update the debounced signal. The actual update will be delayed by 500ms.
 * searchTerm.set('new value');
 *
 * // Access the original, un-debounced signal.
 * console.log(searchTerm.original()); // Outputs 'new value' (immediately)
 * // ... after 500ms ...
 * console.log(searchTerm()); // Outputs 'new value' (debounced)
 *
 * // Directly update the *original* signal.
 * searchTerm.original.set('direct update');
 * console.log(searchTerm.original()); // Outputs 'direct update' (immediately)
 * console.log(searchTerm()); // Outputs 'new value' (still debounced from the previous set)
 * // ... after 500ms ...
 * console.log(searchTerm()); // Outputs 'direct update' (now reflects the original signal)
 *
 * // Create a debounced signal with undefined initial value and default delay
 * const anotherSignal = debounced();
 * ```
 * @typeParam T - The type of the signal's value.
 * @param initial The initial value of the signal. Optional; defaults to `undefined`.
 * @param opt Configuration options for the signal, including the debounce delay (`ms`).
 * @returns A `DebouncedSignal` instance.
 */
export function debounced<T>(): DebouncedSignal<T | undefined>;
/**
 * Creates a debounced signal with a defined initial value.
 *
 * @typeParam T - The type of the signal's value.
 * @param initial The initial value of the signal.
 * @param opt Configuration options for the signal, including the debounce delay (`ms`).
 * @returns A `DebouncedSignal` instance.
 */
export function debounced<T>(
  initial: T,
  opt?: CreateDebouncedOptions<T>,
): DebouncedSignal<T>;
export function debounced<T>(
  value?: T,
  opt?: CreateDebouncedOptions<T | undefined>,
): DebouncedSignal<T | undefined> {
  const sig = signal<T | undefined>(value, opt) as DebouncedSignal<
    T | undefined
  >;
  const ms = opt?.ms ?? 300;

  let timeout: ReturnType<typeof setTimeout> | undefined;

  const originalSet = sig.set;
  const originalUpdate = sig.update;

  const trigger = signal(false);

  // Set on the original signal, then trigger the debounced update
  const set = (value: T | undefined) => {
    originalSet(value); // Update the *original* signal immediately

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      trigger.update((cur) => !cur); // Trigger the computed signal
    }, ms);
  };

  // Update on the original signal, then trigger the debounced update
  const update = (fn: (prev: T | undefined) => T | undefined) => {
    originalUpdate(fn); // Update the *original* signal immediately

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      trigger.update((cur) => !cur); // Trigger the computed signal
    }, ms);
  };

  // Create a computed signal that depends on the trigger.
  // This computed signal is what provides the debounced behavior.
  const writable = toWritable(
    computed(() => {
      trigger();
      return untracked(sig);
    }),
    set,
    update,
  ) as DebouncedSignal<T | undefined>;

  writable.original = sig;

  return writable;
}
