import { Signal, WritableSignal } from '@angular/core';
import { TableState } from '@mmstack/table-core';

export function createPaginatedData<T>(
  source: Signal<T[]>,
  state: WritableSignal<TableState>,
): Signal<T[]> {
  return source;
}
