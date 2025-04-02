import { computed, Signal, WritableSignal } from '@angular/core';
import { TableState } from '@mmstack/table-core';

export function createPaginatedData<T>(
  source: Signal<T[]>,
  state: WritableSignal<TableState>,
): Signal<T[]> {

  const from = computed(() => state().pagination.page * state().pagination.pageSize);
  const to = computed(() => (state().pagination.page + 1) * state().pagination.pageSize);
 return computed(() => source().slice(from(), to()));
}
