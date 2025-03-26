const GENERIC_FILTER_MATCHERS = ['eq', 'neq'] as const;
const STRING_FILTER_MATCHERS = [
  ...GENERIC_FILTER_MATCHERS,
  'ilike',
  'nilike',
] as const;
const NUMBER_FILTER_MATCHERS = [
  ...GENERIC_FILTER_MATCHERS,
  'gt',
  'lt',
  'gte',
  'lte',
] as const;

const DATE_FILTER_MATCHERS = [
  'eqd',
  'neqd',
  ...NUMBER_FILTER_MATCHERS,
] as const;

// const matchers = {
//   string: STRING_FILTER_MATCHERS,
//   number: NUMBER_FILTER_MATCHERS,
//   date: DATE_FILTER_MATCHERS,
// } satisfies Record<FilterValue['valueType'], readonly FilterValue['matcher'][]>;

type StringFilterMatcher = (typeof STRING_FILTER_MATCHERS)[number];

type NumberFilterMatcher = (typeof NUMBER_FILTER_MATCHERS)[number];
type DateFilterMatcher = (typeof DATE_FILTER_MATCHERS)[number];

type StringFilterValue = {
  value: string | null;
  valueType: 'string';
  matcher: StringFilterMatcher;
};

type NumberFilterValue = {
  value: number | null;
  valueType: 'number';
  matcher: NumberFilterMatcher;
};

type DateFilterValue = {
  value: Date | null;
  valueType: 'date';
  matcher: DateFilterMatcher;
};

type FilterValue = StringFilterValue | NumberFilterValue | DateFilterValue;

export type ColumnFilterValue = Record<string, FilterValue>;
