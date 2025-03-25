import { createMergeValidators } from '../merge-validators';
import { Validator } from '../validator.type';
import {
  createMaxLengthValidator,
  defaultMaxLengthMessageFactory,
} from './max-length';
import {
  createMinLengthValidator,
  defaultMinLengthMessageFactory,
} from './min-length';

export type ArrayMessageFactories = {
  minLength: Parameters<typeof createMinLengthValidator>[0];
  maxLength: Parameters<typeof createMaxLengthValidator>[0];
};

const DEFAULT_MESSAGES: ArrayMessageFactories = {
  minLength: defaultMinLengthMessageFactory,
  maxLength: defaultMaxLengthMessageFactory,
};

export function createArrayValidators(
  factories?: Partial<ArrayMessageFactories>,
  merger = createMergeValidators(),
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };
  const base = {
    minLength: createMinLengthValidator(t.minLength),
    maxLength: createMaxLengthValidator(t.maxLength),
  };

  return {
    ...base,
    all: <T extends any[]>(opt: { minLength?: number; maxLength?: number }) => {
      const validators: Validator<T>[] = [];

      if (opt.minLength !== undefined)
        validators.push(base.minLength(opt.minLength));
      if (opt.maxLength !== undefined)
        validators.push(base.maxLength(opt.maxLength));

      return merger(validators);
    },
  };
}
