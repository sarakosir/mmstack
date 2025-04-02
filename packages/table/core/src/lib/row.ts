import { computed, Signal } from '@angular/core';
import { v7 } from 'uuid';
import { Cell, createCell, createHeaderCell } from './cell';
import { ColumnDef } from './column';

export type Row<T> = {
  id: string;
  source: Signal<T>;
  cells: Signal<Cell<any>[]>;
};

export type FooterRow = {
  id: string;
  cells: Signal<Cell<string>[]>;
};

export type HeaderRow = FooterRow;

export function createRow<T>(
  source: Signal<T>,
  defs: ColumnDef<T, any>[],
): Row<T> {
  return {
    id: v7(),
    source,
    cells: computed(() => defs.map((d) => createCell(source, d))),
  };
}

export function createHeaderRow<T>(defs: ColumnDef<T, any>[]): HeaderRow {
  return {
    id: v7(),
    cells: computed(() => defs.map((d) => createHeaderCell(d))),
  };
}

export function createFooterRow<T>(defs: ColumnDef<T, any>[]): FooterRow {
  return {
    id: v7(),
    cells: computed(() => defs.map((d) => createHeaderCell(d))),
  };
}
