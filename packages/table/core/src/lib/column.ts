import { ValueEqualityFn } from '@angular/core';

export type ColumnDef<T, U> = {
  name: string;
  accessor: (row: T) => U;
  header?: () => string;
  footer?: () => string;
  equal?: ValueEqualityFn<U>;
};
