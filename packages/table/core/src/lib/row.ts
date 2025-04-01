import { computed, Signal } from '@angular/core';
import { v7 } from 'uuid';
import { CellState, createCellState } from './cell';
import { ColumnDef } from './column';

export type RowState<T> = {
  id: string;
  source: Signal<T>;
  columns: Signal<Signal<CellState<T, any>>[]>;
};

export function createRowState<T>(
  defs: Signal<Signal<ColumnDef<T, any>>[]>,
  source: Signal<T>,
): RowState<T> {
  return {
    id: v7(),
    source,
    columns: computed(() => defs().map((def) => createCellState(def, source)), {
      equal: (a, b) => a.length === b.length,
    }),
  };
}

export function createRows<T>(
  defs: Signal<Signal<ColumnDef<T, any>>[]>,
  data: Signal<Signal<T>[]>,
) {

  return computed(() => data().map((src)))
}
