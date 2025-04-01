import { ValueEqualityFn } from '@angular/core';
import { mapArray } from '@mmstack/primitives';
import { ColumnDef } from './column';
import { createRows } from './row';

export type CreateTableOptions<T> = {
  data: () =>  T[];
  columns: () =>  ColumnDef<T, any>[];
  equal?: ValueEqualityFn<T>;
};

export function createTableState<T>(opt: CreateTableOptions<T>) {
  const eq = opt.equal ?? Object.is;

  const columns = mapArray(opt.columns, {
    equal: (a, b) => a.name === b.name,
  });

  const data = mapArray<T, number, typeof columns>(opt.data, {
    ctx: columns,
    mapper: (source, index, columns) => {
      return 1;
    },
    equal: eq,
  });

  // const columns = createColumnDefSignals<T>(
  //   isSignal(opt.columns) ? opt.columns : computed(() => opt.columns()),
  // );

  // const data = createDataSignals<T>(
  //   isSignal(opt.data) ? opt.data : computed(() => opt.data()),
  //   eq,
  // );

  const rows = createRows(columns, data);
  return {
    rows,
  };
}

export type TableState<T> = ReturnType<typeof createTableState<T>>;
