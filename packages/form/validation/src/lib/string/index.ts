import { createGeneralValidators } from '../general';
import { createMergeValidators } from '../merge-validators';
import { Validator } from '../validator.type';
import { createEmailValidator, defaultEmailMessageFactory } from './email';
import {
  createIsStringValidator,
  defaultIsStringMessageFactory,
} from './is-string';
import {
  createMaxLengthValidator,
  defaultMaxLengthMessageFactory,
} from './max-chars';
import {
  createMinLengthValidator,
  defaultMinLengthMessageFactory,
} from './min-chars';
import {
  createPatternValidator,
  defaultPatternMessageFactory,
} from './pattern';
import {
  createTrimmedValidator,
  defaultTrimmedMessageFactory,
} from './trimmed';
import { createURIValidator, defaultURIMessageFactory } from './uri';

export type StringMessageFactories = {
  email: Parameters<typeof createEmailValidator>[0];
  uri: Parameters<typeof createURIValidator>[0];
  pattern: Parameters<typeof createPatternValidator>[0];
  trimmed: Parameters<typeof createTrimmedValidator>[0];
  isString: Parameters<typeof createIsStringValidator>[0];
  minLength: Parameters<typeof createMinLengthValidator>[0];
  maxLength: Parameters<typeof createMaxLengthValidator>[0];
};

const DEFAULT_MESSAGES: StringMessageFactories = {
  email: defaultEmailMessageFactory,
  uri: defaultURIMessageFactory,
  pattern: defaultPatternMessageFactory,
  trimmed: defaultTrimmedMessageFactory,
  isString: defaultIsStringMessageFactory,
  minLength: defaultMinLengthMessageFactory,
  maxLength: defaultMaxLengthMessageFactory,
};

export type StringValidatorOptions = {
  pattern?: RegExp | 'email' | 'uri' | Omit<string, 'email' | 'uri'>;
  trimmed?: boolean;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  mustBe?: string | null;
  not?: string | null;
  oneOf?: (string | null)[];
  notOneOf?: (string | null)[];
  messageOptions?: {
    label?: string;
  };
};

export function createStringValidators(
  factories?: Partial<StringMessageFactories>,
  generalValidators = createGeneralValidators(),
  merger = createMergeValidators(),
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };

  const base = {
    email: createEmailValidator(t.email),
    uri: createURIValidator(t.uri),
    pattern: createPatternValidator(t.pattern),
    trimmed: createTrimmedValidator(t.trimmed),
    isString: createIsStringValidator(t.isString),
    minLength: createMinLengthValidator(t.minLength),
    maxLength: createMaxLengthValidator(t.maxLength),
  };

  return {
    ...base,
    all: (opt: StringValidatorOptions) => {
      const validators: Validator<string | null>[] = [];

      if (opt.required)
        validators.push(generalValidators.required(opt?.messageOptions?.label));

      validators.push(base.isString());

      if (opt.mustBe !== undefined)
        validators.push(generalValidators.mustBe(opt.mustBe));

      if (opt.not !== undefined)
        validators.push(generalValidators.not(opt.not));

      if (opt.trimmed) validators.push(base.trimmed());

      if (opt.minLength !== undefined)
        validators.push(base.minLength(opt.minLength));

      if (opt.maxLength) validators.push(base.maxLength(opt.maxLength));

      if (opt.pattern) {
        switch (opt.pattern) {
          case 'email':
            validators.push(base.email());
            break;
          case 'uri':
            validators.push(base.uri());
            break;
          default:
            validators.push(base.pattern(opt.pattern as RegExp | string));
            break;
        }
      }

      if (opt.oneOf) validators.push(generalValidators.oneOf(opt.oneOf));

      if (opt.notOneOf)
        validators.push(generalValidators.notOneOf(opt.notOneOf));

      return merger(validators);
    },
  };
}
