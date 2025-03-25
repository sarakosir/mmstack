import { createGeneralValidators } from '../general';
import { createMergeValidators } from '../merge-validators';
import { Validator } from '../validator.type';
import {
  createIntegerValidator,
  defaultIntegerMessageFactory,
} from './integer';
import {
  createIsNumberValidator,
  defaultIsNumberMessageFactory,
} from './is-number';
import { createMaxValidator, defaultMaxMessageFactory } from './max';
import { createMinValidator, defaultMinMessageFactory } from './min';
import {
  createMultipleOfValidator,
  defaultMultipleOfMessageFactory,
} from './multiple-of';

export type NumberMessageFactories = {
  min: Parameters<typeof createMinValidator>[0];
  max: Parameters<typeof createMaxValidator>[0];
  isNumber: Parameters<typeof createIsNumberValidator>[0];
  multipleOf: Parameters<typeof createMultipleOfValidator>[0];
  integer: Parameters<typeof createIntegerValidator>[0];
};

const DEFAULT_MESSAGES: NumberMessageFactories = {
  min: defaultMinMessageFactory,
  max: defaultMaxMessageFactory,
  isNumber: defaultIsNumberMessageFactory,
  multipleOf: defaultMultipleOfMessageFactory,
  integer: defaultIntegerMessageFactory,
};

export type NumberValidatorOptions = {
  min?: number;
  max?: number;
  integer?: boolean;
  multipleOf?: number;
  required?: boolean;
  mustBe?: number | null;
  not?: number | null;
  oneOf?: (number | null)[];
  notOneOf?: (number | null)[];
};

export function createNumberValidators(
  factories?: Partial<NumberMessageFactories>,
  generalValidators = createGeneralValidators(),
  merger = createMergeValidators(),
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };

  const base = {
    min: createMinValidator(t.min),
    max: createMaxValidator(t.max),
    isNumber: createIsNumberValidator(t.isNumber),
    multipleOf: createMultipleOfValidator(t.multipleOf),
    integer: createIntegerValidator(t.integer),
  };

  return {
    ...base,
    all: (opt: NumberValidatorOptions) => {
      const validators: Validator<number | null>[] = [];

      if (opt.required) validators.push(generalValidators.required());

      validators.push(base.isNumber());

      if (opt.mustBe !== undefined)
        validators.push(generalValidators.mustBe(opt.mustBe));

      if (opt.not !== undefined)
        validators.push(generalValidators.not(opt.not));

      if (opt.integer) validators.push(base.integer());

      if (opt.min !== undefined) validators.push(base.min(opt.min));

      if (opt.max !== undefined) validators.push(base.max(opt.max));

      if (opt.multipleOf !== undefined)
        validators.push(base.multipleOf(opt.multipleOf));

      if (opt.oneOf) validators.push(generalValidators.oneOf(opt.oneOf));

      if (opt.notOneOf)
        validators.push(generalValidators.notOneOf(opt.notOneOf));

      return merger(validators);
    },
  };
}
