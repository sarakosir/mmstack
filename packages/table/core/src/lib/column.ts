import { Signal } from '@angular/core';
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
