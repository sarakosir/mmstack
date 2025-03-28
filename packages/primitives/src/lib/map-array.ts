import {
  computed,
  type CreateSignalOptions,
  isSignal,
  linkedSignal,
  type Signal,
} from '@angular/core';

/**
 * Options for the mapArray function.
 * @template T The type of elements in the array.
 * @extends CreateSignalOptions<T> Inherits options for creating individual signals.
 */
export type MapArrayOptions<T> = CreateSignalOptions<T> & {
  /**
   * An optional function to transform each element from the source array.
   * If not provided, the original element is used.
   * @param source The current value of the source array signal.
   * @param index The index of the element being mapped.
   * @returns The transformed element for the corresponding signal.
   */
  map?: (source: T[], index: number) => T;
};

function createReconciler<T>(source: Signal<T[]>, opt?: MapArrayOptions<T>) {
  const map = opt?.map ?? ((source, index) => source[index]);

  return (
    length: number,
    prev?: {
      value: Signal<T>[];
      source: number;
    },
  ): Signal<T>[] => {
    if (!prev)
      return Array.from({ length }, (_, i) =>
        computed(() => map(source(), i), opt),
      );

    if (length === prev.source) return prev.value;

    if (length < prev.source) {
      return prev.value.slice(0, length);
    } else {
      const next = [...prev.value];
      for (let i = prev.source; i < length; i++) {
        next.push(computed(() => map(source(), i), opt));
      }

      return next;
    }
  };
}

/**
 * Creates a reactive array of signals from a source array signal (or a function returning one),
 * applying an optional mapping function to each element.
 *
 * This is useful for scenarios like rendering lists where each item
 * needs its own reactive state derived from the source array. It efficiently
 * handles changes in the source array's length by reusing existing signals
 * for elements that remain, adding signals for new elements, and removing signals
 * for deleted elements.
 *
 * @template T The type of elements in the source array.
 * @param source A function that returns the source array (or readonly array).
 * This function will be tracked for changes.
 * @param opt Optional configuration including a `map` function to transform elements
 * and options (`CreateSignalOptions`) for the created signals.
 * @returns A signal (`Signal<Signal<T | undefined>[]>`) where the outer signal updates
 * when the array length changes, and the inner array contains signals
 * representing each element (potentially mapped).
 */
export function mapArray<T>(
  source: () => T[],
  opt?: MapArrayOptions<T | undefined>,
): Signal<Signal<T | undefined>[]>;

/**
 * Creates a reactive array of signals from a source readonly array (or a function returning one),
 * applying an optional mapping function to each element.
 *
 * This is useful for scenarios like rendering lists where each item
 * needs its own reactive state derived from the source array. It efficiently
 * handles changes in the source array's length by reusing existing signals
 * for elements that remain, adding signals for new elements, and removing signals
 * for deleted elements.
 *
 * @template T The type of elements in the source array.
 * @param source A function that returns the source readonly array.
 * This function will be tracked for changes.
 * @param opt Optional configuration including a `map` function to transform elements
 * and options (`CreateSignalOptions`) for the created signals.
 * @returns A signal (`Signal<Signal<T>[]>`) where the outer signal updates
 * when the array length changes, and the inner array contains signals
 * representing each element (potentially mapped).
 */
export function mapArray<T>(
  source: () => readonly T[],
  opt?: MapArrayOptions<T>,
): Signal<Signal<T>[]>;

export function mapArray<T>(
  source: (() => T[]) | (() => readonly T[]),
  opt?: MapArrayOptions<T>,
): Signal<Signal<T | undefined>[]> {
  const data = isSignal(source) ? source : computed(source);
  const length = computed(() => data().length);

  const reconciler = createReconciler<T>(data as Signal<T[]>, opt);

  return linkedSignal<number, Signal<T>[]>({
    source: () => length(),
    computation: (len, prev) => reconciler(len, prev),
  });
}
