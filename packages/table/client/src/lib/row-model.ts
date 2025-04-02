import { computed, isSignal, Signal, WritableSignal } from '@angular/core';
import { TableState } from '@mmstack/table-core';
import { createPaginatedData } from './features';

export function clientRowModel<T>(
  source: () => T[],
  state: WritableSignal<TableState>,
): Signal<T[]> {
  const data = isSignal(source) ? source : computed(source);

  return createPaginatedData(data, state);
}
