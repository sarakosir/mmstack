import { computed, Signal, WritableSignal } from '@angular/core';
import { TableState } from '@mmstack/table-core';

export function createGlobalFiltering<T>(
  source: Signal<T[]>,
  state: WritableSignal<TableState>,
  toString?: (value: T) => string,
): Signal<T[]>  {
  if (!toString) return source;
  const query = computed(() => state().globalFilter.toLowerCase().trim());

  const values = computed(() => source().map((value) => ({value, searchStr: toString(value).toLowerCase() })));

  return computed(() => {
    const q = query();
    if (!q) return source();
    return values().filter((item) => item.searchStr.includes(query())).map((item) => item.value);
  })
}
