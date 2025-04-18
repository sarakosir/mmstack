import {
  computed,
  CreateSignalOptions,
  signal,
  untracked,
  type WritableSignal,
} from '@angular/core';
import type { UnknownObject } from '@mmstack/object';
import { toWritable } from './to-writable';

/**
 * Options for creating a derived signal using the full `derived` function signature.
 * @typeParam T - The type of the source signal's value (parent).
 * @typeParam U - The type of the derived signal's value (child).
 */
type CreateDerivedOptions<T, U> = CreateSignalOptions<U> & {
  /**
   * A function that extracts the derived value (`U`) from the source signal's value (`T`).
   */
  from: (v: T) => U;
  /**
   * A function that updates the source signal's value (`T`) when the derived signal's value (`U`) changes.
   * This establishes the two-way binding.
   */
  onChange: (newValue: U) => void;
};

/**
 * A `WritableSignal` that derives its value from another `WritableSignal` (the "source" signal).
 * It provides two-way binding: changes to the source signal update the derived signal, and
 * changes to the derived signal update the source signal.
 *
 * @typeParam T - The type of the source signal's value (parent).
 * @typeParam U - The type of the derived signal's value (child).
 */
export type DerivedSignal<T, U> = WritableSignal<U> & {
  /**
   * The function used to derive the derived signal's value from the source signal's value.
   * This is primarily for internal use and introspection.
   */
  from: (v: T) => U;
};

/**
 * Creates a `DerivedSignal` that derives its value from another `WritableSignal` (the source signal).
 * This overload provides the most flexibility, allowing you to specify custom `from` and `onChange` functions.
 *
 * @typeParam T - The type of the source signal's value.
 * @typeParam U - The type of the derived signal's value.
 * @param source - The source `WritableSignal`.
 * @param options - An object containing the `from` and `onChange` functions, and optional signal options.
 * @returns A `DerivedSignal` instance.
 *
 * @example
 * const user = signal({ name: 'John', age: 30 });
 * const name = derived(user, {
 *   from: (u) => u.name,
 *   onChange: (newName) => user.update((u) => ({ ...u, name: newName })),
 * });
 */
export function derived<T, U>(
  source: WritableSignal<T>,
  opt: CreateDerivedOptions<T, U>,
): DerivedSignal<T, U>;

/**
 * Creates a `DerivedSignal` that derives a property from an object held by the source signal.
 * This overload simplifies creating derived signals for object properties.
 *
 * @typeParam T - The type of the source signal's value (must be an object).
 * @typeParam TKey - The key of the property to derive.
 * @param source - The source `WritableSignal` (holding an object).
 * @param key - The key of the property to derive.
 * @param options - Optional signal options for the derived signal.
 * @returns A `DerivedSignal` instance.
 *
 * @example
 * const user = signal({ name: 'John', age: 30 });
 * const name = derived(user, 'name');
 */
export function derived<T extends UnknownObject, TKey extends keyof T>(
  source: WritableSignal<T>,
  key: TKey,
  opt?: CreateSignalOptions<T[TKey]>,
): DerivedSignal<T, T[TKey]>;

/**
 * Creates a `DerivedSignal` from an array, and derives an element by index.
 *
 * @typeParam T - The type of the source signal's value (must be an array).
 * @param source - The source `WritableSignal` (holding an array).
 * @param index - The index of the element to derive.
 * @param options - Optional signal options for the derived signal.
 * @returns A `DerivedSignal` instance.
 *
 * @example
 * const numbers = signal([1, 2, 3]);
 * const secondNumber = derived(numbers, 1); // secondNumber() === 2
 * secondNumber.set(5); // numbers() === [1, 5, 3]
 */
export function derived<T extends any[]>(
  source: WritableSignal<T>,
  index: number,
  opt?: CreateSignalOptions<T[number]>,
): DerivedSignal<T, T[number]>;

export function derived<T, U>(
  source: WritableSignal<T>,
  optOrKey: CreateDerivedOptions<T, U> | keyof T,
  opt?: CreateSignalOptions<U>,
): DerivedSignal<T, U> {
  const isArray =
    Array.isArray(untracked(source)) && typeof optOrKey === 'number';

  const from =
    typeof optOrKey === 'object' ? optOrKey.from : (v: T) => v[optOrKey] as U;
  const onChange =
    typeof optOrKey === 'object'
      ? optOrKey.onChange
      : isArray
        ? (next: U) => {
            source.update(
              (cur) =>
                (cur as unknown as any[]).map((v, i) =>
                  i === optOrKey ? next : v,
                ) as T,
            );
          }
        : (next: U) => {
            source.update((cur) => ({ ...cur, [optOrKey]: next }));
          };

  const rest = typeof optOrKey === 'object' ? optOrKey : opt;

  const sig = toWritable<U>(
    computed(() => from(source()), rest),
    (newVal) => onChange(newVal),
  ) as DerivedSignal<T, U>;

  sig.from = from;

  return sig;
}

/**
 * Creates a "fake" `DerivedSignal` from a simple value. This is useful for creating
 * `FormControlSignal` instances that are not directly derived from another signal.
 * The returned signal's `from` function will always return the initial value.
 *
 * @typeParam T -  This type parameter is not used in the implementation but is kept for type compatibility with `DerivedSignal`.
 * @typeParam U - The type of the signal's value.
 * @param initial - The initial value of the signal.
 * @returns A `DerivedSignal` instance.
 * @internal
 */
export function toFakeDerivation<T, U>(initial: U): DerivedSignal<T, U> {
  const sig = signal(initial) as DerivedSignal<T, U>;
  sig.from = () => initial;

  return sig;
}

/**
 * Creates a "fake" `DerivedSignal` from an existing `WritableSignal`. This is useful
 * for treating a regular `WritableSignal` as a `DerivedSignal` without changing its behavior.
 *  The returned signal's `from` function returns the current value of signal, using `untracked`.
 *
 * @typeParam T - This type parameter is not used in the implementation but is kept for type compatibility with `DerivedSignal`.
 * @typeParam U - The type of the signal's value.
 * @param initial - The existing `WritableSignal`.
 * @returns A `DerivedSignal` instance.
 * @internal
 */
export function toFakeSignalDerivation<T, U>(
  initial: WritableSignal<U>,
): DerivedSignal<T, U> {
  const sig = initial as DerivedSignal<T, U>;
  sig.from = () => untracked(initial);
  return sig;
}

/**
 * Type guard function to check if a given `WritableSignal` is a `DerivedSignal`.
 *
 * @typeParam T - The type of the source signal's value (optional, defaults to `any`).
 * @typeParam U - The type of the derived signal's value (optional, defaults to `any`).
 * @param sig - The `WritableSignal` to check.
 * @returns `true` if the signal is a `DerivedSignal`, `false` otherwise.
 */
export function isDerivation<T, U>(
  sig: WritableSignal<U>,
): sig is DerivedSignal<T, U> {
  return 'from' in sig;
}
