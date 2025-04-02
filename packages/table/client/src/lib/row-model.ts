import { computed, isSignal, Signal, WritableSignal } from '@angular/core';
import { TableState } from '@mmstack/table-core';
import { createGlobalFiltering, createPaginatedData } from './features';

export function clientRowModel<T>(
  source: () => T[],
  state: WritableSignal<TableState>,
  toString?: (val: T) => string,
): Signal<T[]> {
  const data = isSignal(source) ? source : computed(source);

  return createPaginatedData(createGlobalFiltering(data, state, toString), state);
}
