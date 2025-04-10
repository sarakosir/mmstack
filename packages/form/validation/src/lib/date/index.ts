import { createGeneralValidators } from '../general';
import { createMergeValidators } from '../merge-validators';
import { Validator } from '../validator.type';
import { createIsDateValidator, defaultIsDateMessageFactory } from './is-date';
import {
  createMaxDateValidator,
  defaultMaxDateMessageFactory,
} from './max-date';
import {
  createMinDateValidator,
  defaultMinDateMessageFactory,
} from './min-date';
import { defaultFormatDate, defaultToDate } from './util';

export type DateMessageFactories = {
  min: Parameters<typeof createMinDateValidator>[0];
  max: Parameters<typeof createMaxDateValidator>[0];
  isDate: Parameters<typeof createIsDateValidator>[0];
};

const DEFAULT_MESSAGES: DateMessageFactories = {
  min: defaultMinDateMessageFactory,
  max: defaultMaxDateMessageFactory,
  isDate: defaultIsDateMessageFactory,
};

export type DateValidatorOptions = {
  required?: boolean;
  min?: Date | string;
  max?: Date | string;
  mustBe?: Date | string | null;
  not?: Date | string | null;
  oneOf?: (Date | string | null)[];
  notOneOf?: (Date | string | null)[];
  messageOptions?: {
    label?: string;
  };
};

export function createDateValidators<TDate = Date>(
  factories?: Partial<DateMessageFactories>,
  toDate = defaultToDate<TDate>,
  formatDate = defaultFormatDate,
  locale = 'en-US',
  generalValidators = createGeneralValidators(),
  merger = createMergeValidators(),
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };
  const base = {
    min: createMinDateValidator(t.min, toDate, formatDate, locale),
    max: createMaxDateValidator(t.max, toDate, formatDate, locale),
    isDate: createIsDateValidator(t.isDate, toDate),
  };

  const toLabel = (d: TDate | null) =>
    d ? formatDate(toDate(d), locale) : 'null';

  return {
    ...base,
    all: (opt: DateValidatorOptions) => {
      const validators: Validator<TDate | null>[] = [];

      if (opt.required)
        validators.push(generalValidators.required(opt.messageOptions?.label));

      validators.push(base.isDate());

      if (opt.mustBe !== undefined) {
        if (opt.mustBe === null)
          validators.push(generalValidators.mustBeNull<TDate | null>());
        else {
          const d = toDate(opt.mustBe as TDate | string);
          const formatted = formatDate(d, locale);
          validators.push(
            generalValidators.mustBe<TDate | null>(
              d as TDate,
              formatted,
              (a, b) => {
                if (!a && !b) return true;
                if (!a || !b) return false;

                return toDate(a).getTime() === toDate(b).getTime();
              },
            ),
          );
        }
      }

      if (opt.not !== undefined) {
        if (opt.not === null)
          validators.push(generalValidators.not<TDate | null>(null));
        else {
          const d = toDate(opt.not as TDate);
          const formatted = formatDate(d, locale);
          validators.push(
            generalValidators.not<TDate | null>(
              d as TDate,
              formatted,
              (a, b) => {
                if (!a && !b) return true;
                if (!a || !b) return false;

                return toDate(a).getTime() === toDate(b).getTime();
              },
            ),
          );
        }
      }

      if (opt.min !== undefined) validators.push(base.min(opt.min as TDate));
      if (opt.max !== undefined) validators.push(base.max(opt.max as TDate));

      if (opt.oneOf) {
        const dates = opt.oneOf.map((d) => (d ? toDate(d as TDate) : null));

        validators.push(
          generalValidators.oneOf<TDate | null>(
            dates as TDate[],
            toLabel,
            (a) =>
              a === null || a === undefined
                ? 'null'
                : toDate(a).getTime().toString(),
          ),
        );
      }

      if (opt.notOneOf) {
        const dates = opt.notOneOf.map((d) => (d ? toDate(d as TDate) : null));
        validators.push(
          generalValidators.notOneOf<TDate | null>(
            dates as TDate[],
            toLabel,
            (a) =>
              a === null || a === undefined
                ? 'null'
                : toDate(a).getTime().toString(),
          ),
        );
      }

      return merger(validators as Validator<TDate | null>[]);
    },
  };
}
