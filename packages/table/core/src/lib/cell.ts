import { computed, type Signal } from '@angular/core';
import { v7 } from 'uuid';

export type CellDef<T, U> = {
  id?: () => string;
  accessor: (row: T) => U;
  equal?: (a: U, b: U) => boolean;
};

export type CellState<T, U> = {
  id: string; // unique id used for @for loop tracking
  value: Signal<U>; // the resolved value of the cell
};

export function createCellState<T, U>(
  def: CellDef<T, U>,
  source: Signal<T>,
): CellState<T, U> {
  return {
    id: def.id?.() ?? v7(),
    value: computed(() => def.accessor(source()), {
      equal: def.equal,
    }),
  };
}
