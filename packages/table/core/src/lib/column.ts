import { computed, Signal } from '@angular/core';
import { CellDef } from './cell';

export type ColumnDef<T, U> = CellDef<T, U>;

export type ComparableColumnDef<T, U> = ColumnDef<T, U> & {
  identity: string;
};

export type ColumnState = {
  align: Signal<'left' | 'right'>;
  name: string;
  show: Signal<boolean>;
  toggleVisibility: () => void;
};

export function createColumnDefSignals<T>(
  defs: Signal<ColumnDef<T, any>[]>,
): Signal<Signal<ColumnDef<T, any>>[]> {
  const defLength = computed(() => defs().length);

  return computed(
    () =>
      Array.from({ length: defLength() }).map((_, i) =>
        computed(() => defs()[i], {
          equal: (a, b) => a.name === b.name,
        }),
      ),
    {
      equal: (a, b) => a.length === b.length,
    },
  );
}
