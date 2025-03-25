import { formatDate } from '@angular/common';

type LuxonDateTimeLike = {
  toJSDate(): Date;
  toUnixInteger(): number;
};

type MomentDateTimeLike = {
  toDate(): Date;
  unix(): number;
};

function isLuxonLike(date: object): date is LuxonDateTimeLike {
  if (!date) return false;

  return (
    'toJSDate' in date &&
    'toUnixInteger' in date &&
    typeof date.toJSDate === 'function' &&
    typeof date.toUnixInteger === 'function'
  );
}

function isMomentLike(date: object): date is MomentDateTimeLike {
  if (!date) return false;
  return (
    'toDate' in date &&
    'unix' in date &&
    typeof date.toDate === 'function' &&
    typeof date.unix === 'function'
  );
}

export function defaultToDate<TDate>(date: TDate | string): Date {
  if (date instanceof Date) return date;

  if (typeof date === 'string' || typeof date === 'number')
    return new Date(date);

  if (!date) return new Date();

  if (typeof date !== 'object')
    throw new Error('Date is not number, string, null, undefined or object');

  if (isMomentLike(date)) return date.toDate();

  if (isLuxonLike(date)) return date.toJSDate();

  return new Date();
}

export function defaultFormatDate(
  date: Date,
  locale: string,
  format = 'mediumDate',
) {
  return formatDate(date, format, locale);
}
