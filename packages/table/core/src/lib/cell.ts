import { computed, Signal } from '@angular/core';
import { ColumnDef } from './column';

export type Cell<U> = {
  name: string;
  value: Signal<U>;
};

export function createCell<T, U>(
  source: Signal<T>,
  def: ColumnDef<T, U>,
): Cell<U> {
  return {
    name: def.name,
    value: computed(() => def.accessor(source()), def),
  };
}

export function createHeaderCell<T, U>(def: ColumnDef<T, U>): Cell<string> {
  return {
    name: def.name,
    value: computed(() => def.header?.() ?? ''),
  };
}

export function createFooterCell<T, U>(def: ColumnDef<T, U>): Cell<string> {
  return {
    name: def.name,
    value: computed(() => def.footer?.() ?? ''),
  };
}
