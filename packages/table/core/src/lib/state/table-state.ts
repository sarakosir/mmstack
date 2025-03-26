import { type ColumnFilterValue } from './column-filter';
import { type ColumnOrderValue } from './column-order';
import { type ColumnVisibilityValue } from './column-visibility';
import { type GlobalFilterValue } from './global-filter';
import { type PaginationValue } from './pagination';
import { type PinValue } from './pin';
import { type SortValue } from './sort';

export type TableStateValue = {
  columnVisibility?: ColumnVisibilityValue;
  columnOrder?: ColumnOrderValue;
  pin?: PinValue;
  globalFilter?: GlobalFilterValue;
  sort?: SortValue;
  pagination?: PaginationValue;
  columnFilter?: ColumnFilterValue;
};

export type TableState<T> = {
  header: unknown;
  body: unknown;
  column: unknown;
  pagination: unknown;
};
