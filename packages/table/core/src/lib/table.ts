import {
  computed,
  isSignal,
  linkedSignal,
  Signal,
  ValueEqualityFn,
} from '@angular/core';
import { ColumnDef, createColumnDefSignals } from './column';
import { createRowState, RowState } from './row';

export type CreateTableOptions<T> = {
  data: () => T[];
  columns: () => ColumnDef<T, any>[];
  equal?: ValueEqualityFn<T>;
};

function createDataSignals<T>(
  data: Signal<T[]>,
  equal: ValueEqualityFn<T>,
): Signal<Signal<T>[]> {
  const dataLength = computed(() => data().length);

  return computed(() =>
    Array.from({ length: dataLength() }).map((_, i) =>
      computed(() => data()[i], {
        equal,
      }),
    ),
  );
}

function createRowReconciler<T>(defs: Signal<Signal<ColumnDef<T, any>>[]>) {
  return (
    source: Signal<T>[],
    prev?: { source: Signal<T>[]; value: RowState<T>[] },
  ): RowState<T>[] => {
    if (!prev) return source.map((source) => createRowState(defs, source));

    if (source.length === prev.source.length) return prev.value;

    if (source.length < prev.source.length) {
      return prev.value.slice(0, source.length);
    } else {
      const next = [...prev.value];
      for (let i = prev.source.length; i < source.length; i++) {
        next.push(createRowState(defs, source[i]));
      }
      return next;
    }
  };
}

export function createTableState<T>(opt: CreateTableOptions<T>) {
  const eq = opt.equal ?? Object.is;

  const columns = createColumnDefSignals<T>(
    isSignal(opt.columns) ? opt.columns : computed(() => opt.columns()),
  );

  const data = createDataSignals<T>(
    isSignal(opt.data) ? opt.data : computed(() => opt.data()),
    eq,
  );

  const reconciler = createRowReconciler(columns);
  const rows = linkedSignal<Signal<T>[], RowState<T>[]>({
    source: () => data(),
    computation: (source, prev) => reconciler(source, prev),
  });

  return {
    rows,
  };
}

export type TableState<T> = ReturnType<typeof createTableState<T>>;
