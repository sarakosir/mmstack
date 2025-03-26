import {
  inject,
  InjectionToken,
  Injector,
  LOCALE_ID,
  type Provider,
} from '@angular/core';

const DEFAULT_TABLE_LOCALE = {
  plural: 'results',
  noItemsFound: 'No items found',
  pagination: {
    firstPage: 'First page',
    lastPage: 'Last page',
    nextPage: 'Next page',
    prevPage: 'Previous page',
    perPage: 'per page',
  },
  order: {
    moveLeft: 'Move left',
    moveRight: 'Move right',
    moveToStart: 'Move to start',
    moveToEnd: 'Move to end',
    order: 'Order',
  },
  sort: {
    sort: 'Sort',
    asc: 'Ascending',
    desc: 'Descending',
  },
  pin: {
    pin: 'Pin',
    unpin: 'Unpin',
  },
  visibility: {
    hideColumn: 'Hide column',
    showColumn: 'Show column',
  },
  filter: {
    eq: 'Equals',
    neq: 'Does not equal',
    eqd: 'Equals day',
    neqd: 'Does not equal day',
    contains: 'Contains',
    notContains: 'Does not contain',
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    matcher: 'Matcher',
  },
};

export type TableLocale = typeof DEFAULT_TABLE_LOCALE;

type PartialLocale = Omit<
  Partial<TableLocale>,
  'pagination' | 'order' | 'sort' | 'pin' | 'visibility' | 'filter'
> & {
  pagination?: Partial<TableLocale['pagination']>;
  order?: Partial<TableLocale['order']>;
  sort?: Partial<TableLocale['sort']>;
  pin?: Partial<TableLocale['pin']>;
  visibility?: Partial<TableLocale['visibility']>;
  filter?: Partial<TableLocale['filter']>;
};

const token = new InjectionToken<PartialLocale>('EVENT7_TABLE_LOCALE');

function mergeTableLocale(provided: PartialLocale | null): TableLocale {
  const partial = provided ?? {};
  return {
    ...DEFAULT_TABLE_LOCALE,
    ...partial,
    pagination: { ...DEFAULT_TABLE_LOCALE.pagination, ...partial.pagination },
    order: { ...DEFAULT_TABLE_LOCALE.order, ...partial.order },
    sort: { ...DEFAULT_TABLE_LOCALE.sort, ...partial.sort },
    pin: { ...DEFAULT_TABLE_LOCALE.pin, ...partial.pin },
    visibility: { ...DEFAULT_TABLE_LOCALE.visibility, ...partial.visibility },
    filter: { ...DEFAULT_TABLE_LOCALE.filter, ...partial.filter },
  };
}

export function provideTableLocale(
  fn: (locale: string) => PartialLocale,
): Provider {
  return {
    provide: token,
    useFactory: fn,
    deps: [LOCALE_ID],
  };
}

export function injectTableLocale(injector?: Injector): TableLocale {
  const partial = injector
    ? injector.get(token, null, { optional: true })
    : inject(token, { optional: true });

  return mergeTableLocale(partial);
}
