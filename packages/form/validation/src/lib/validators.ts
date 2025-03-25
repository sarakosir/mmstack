import {
  inject,
  InjectionToken,
  Injector,
  LOCALE_ID,
  Provider,
} from '@angular/core';
import { createArrayValidators } from './array';
import { createBooleanValidators } from './boolean';
import { createDateValidators } from './date';
import { defaultFormatDate, defaultToDate } from './date/util';
import { createGeneralValidators } from './general';
import { createMergeValidators } from './merge-validators';
import { createNumberValidators } from './number';
import { createStringValidators } from './string';

type MessageFactories = {
  general: Parameters<typeof createGeneralValidators>[0];
  string: Parameters<typeof createStringValidators>[0];
  number: Parameters<typeof createNumberValidators>[0];
  date: Parameters<typeof createDateValidators>[0];
  array: Parameters<typeof createArrayValidators>[0];
  boolean: Parameters<typeof createBooleanValidators>[0];
  merge: Parameters<typeof createMergeValidators>[0];
};

export type Validators = {
  general: ReturnType<typeof createGeneralValidators>;
  string: ReturnType<typeof createStringValidators>;
  number: ReturnType<typeof createNumberValidators>;
  date: ReturnType<typeof createDateValidators>;
  array: ReturnType<typeof createArrayValidators>;
  boolean: ReturnType<typeof createBooleanValidators>;
};

const token = new InjectionToken<Validators>('INTERNAL_MMSTACK_VALIDATORS');

let defaultValidators: Validators | null = null;

function createDefaultValidators() {
  if (!defaultValidators) {
    defaultValidators = createValidators(
      {},
      defaultToDate,
      defaultFormatDate,
      'en-US',
    );
  }

  return defaultValidators;
}

function createValidators(
  msg: Partial<MessageFactories>,
  toDate: <TDate = Date>(date: TDate | string) => Date,
  formatDate: (date: Date, locale: string) => string,
  locale: string,
): Validators {
  const general = createGeneralValidators(msg.general);

  const merger = createMergeValidators(msg.merge);

  return {
    general,
    string: createStringValidators(msg.string, general, merger),
    number: createNumberValidators(msg.number, general, merger),
    date: createDateValidators(
      msg.date,
      toDate,
      formatDate,
      locale,
      general,
      merger,
    ),
    array: createArrayValidators(msg.array, merger),
    boolean: createBooleanValidators(msg.boolean),
  };
}

export function provideValidators(
  factory: (locale: string) => Partial<MessageFactories>,
  toDate: <TDate = Date>(date: TDate | string) => Date = defaultToDate,
  formatDate: (date: Date, locale: string) => string = defaultFormatDate,
): Provider {
  return {
    provide: token,
    useFactory: (locale: string) =>
      createValidators(factory(locale), toDate, formatDate, locale),
    deps: [LOCALE_ID],
  };
}

export function injectValidators(injector?: Injector) {
  const validators = injector
    ? injector.get(token, null, {
        optional: true,
      })
    : inject(token, { optional: true });

  return validators ?? createDefaultValidators();
}
