import {
  computed,
  isSignal,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { derived, mapArray } from '@mmstack/primitives';
import { ColumnDef } from './column';
import {
  createPaginationFeature,
  mergePaginationState,
  PaginationFeature,
  PaginationOptions,
  PaginationState,
} from './features';
import {
  createFooterRow,
  createHeaderRow,
  createRow,
  FooterRow,
  HeaderRow,
  Row,
} from './row';

export type TableState = {
  pagination: PaginationState;
};

type TableOptions = {
  pagination?: PaginationOptions;
};

export type CreateTableOptions<T> = {
  data: () => T[];
  columns: ColumnDef<T, any>[];
  state: WritableSignal<TableState>;
  opt?: TableOptions;
};

export type Table<T> = {
  header: {
    rows: Signal<HeaderRow[]>;
  };
  body: {
    rows: Signal<Row<T>[]>;
  };
  footer: {
    rows: Signal<FooterRow[]>;
  };
  features: {
    pagination: PaginationFeature;
  };
};

type DeepPartial<T> = T extends any[]
  ? T
  : T extends object
    ? T extends null
      ? null
      : {
          [K in keyof T]?: DeepPartial<T[K]>;
        }
    : T;

function mergeState(state?: DeepPartial<TableState>): TableState {
  return {
    pagination: mergePaginationState(state?.pagination),
  };
}

export function createTableState(
  initial?: DeepPartial<TableState>,
): WritableSignal<TableState> {
  return signal(mergeState(initial));
}

export function createTable<T>(opt: CreateTableOptions<T>): Table<T> {
  const data = isSignal(opt.data) ? opt.data : computed(opt.data);

  const bodyRows = mapArray<T, Row<T>>(data, (source) =>
    createRow(source, opt.columns),
  );

  const headerRows = computed(() => [createHeaderRow(opt.columns)]);
  const footerRows = computed(() => [createFooterRow(opt.columns)]);

  return {
    header: {
      rows: headerRows,
    },
    body: {
      rows: bodyRows,
    },
    footer: {
      rows: footerRows,
    },
    features: {
      pagination: createPaginationFeature(derived(opt.state, 'pagination'), {
        total: () => data().length,
        ...opt.opt?.pagination,
      }),
    },
  };
}
