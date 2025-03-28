import { computed, type Signal } from '@angular/core';

export type CellDef<T, U> = {
  name: string;
  accessor: (row: T) => U;
  equal?: (a: U, b: U) => boolean;
};

export type CellState<T, U> = {
  name: string; // unique name used for @for loop tracking
  value: Signal<U>; // the resolved value of the cell
};

export function createCellState<T, U>(
  def: Signal<CellDef<T, U>>,
  source: Signal<T>,
): Signal<CellState<T, U>> {
  return computed(
    () => {
      const d = def();
      return {
        name: d.name,
        value: computed(() => d.accessor(source()), { equal: d.equal }),
      };
    },
    {
      equal: (a, b) => a.name === b.name,
    },
  );
}
