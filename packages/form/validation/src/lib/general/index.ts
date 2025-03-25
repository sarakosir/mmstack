import { Validator } from '../validator.type';
import {
  createMustBeEmptyValidator,
  createMustBeValidator,
  defaultMustBeEmptyMessageFactory,
  defaultMustBeMessageFactory,
} from './must-be';
import { createNotValidator, defaultNotMessageFactory } from './not';
import {
  createNotOneOfValidator,
  defaultNotOneOfMessageFactory,
} from './not-one-of';
import { createOneOfValidator, defaultOneOfMessageFactory } from './one-of';
import {
  createRequiredValidator,
  defaultRequiredMessageFactory,
} from './required';

export type GeneralMessageFactories = {
  required: Parameters<typeof createRequiredValidator>[0];
  mustBe: Parameters<typeof createMustBeValidator>[0];
  mustBeNull: Parameters<typeof createMustBeEmptyValidator>[0];
  not: Parameters<typeof createNotValidator>[0];
  oneOf: Parameters<typeof createOneOfValidator>[0];
  notOneOf: Parameters<typeof createNotOneOfValidator>[0];
};

const DEFAULT_MESSAGES: GeneralMessageFactories = {
  required: defaultRequiredMessageFactory,
  mustBe: defaultMustBeMessageFactory,
  mustBeNull: defaultMustBeEmptyMessageFactory,
  not: defaultNotMessageFactory,
  oneOf: defaultOneOfMessageFactory,
  notOneOf: defaultNotOneOfMessageFactory,
};

export function createGeneralValidators(
  factories?: Partial<GeneralMessageFactories>,
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };

  const mustBeNull = createMustBeEmptyValidator(t.mustBeNull);

  return {
    required: createRequiredValidator(t.required),
    mustBe: createMustBeValidator(t.mustBe),
    mustBeNull: createMustBeEmptyValidator(t.mustBeNull),
    not: createNotValidator(t.not),
    oneOf: <T>(
      values: T[],
      toLabel?: (value: T) => string,
      identity?: (a: T) => string,
      delimiter?: string,
    ): Validator<T> => {
      if (!values.length) return mustBeNull<T>();

      return createOneOfValidator(t.oneOf)(
        values,
        toLabel,
        identity,
        delimiter,
      );
    },
    notOneOf: createNotOneOfValidator(t.notOneOf),
  };
}
