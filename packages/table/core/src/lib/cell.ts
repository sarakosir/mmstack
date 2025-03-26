import { type Signal } from '@angular/core';
import { type DerivedSignal } from '@mmstack/primitives';
import { type SharedColumnState } from './column';

export type CellDef<T, U> = {
  value: (row: T) => U;
  equal?: (a: U, b: U) => boolean;
};

export type CellState<T, U> = {
  id: string;
  value: Signal<U>;
  column: SharedColumnState;
  source: Signal<T>;
};

export function createCellState<T, U>(
  def: CellDef<T, U>,
  source: Signal<T>,
  col: SharedColumnState,
  columnVisibilityState: DerivedSignal<
    TableStateValue,
    Record<string, boolean | undefined>
  >,
);
