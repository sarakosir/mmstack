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
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };
  return {
    minLength: createMinLengthValidator(t.minLength),
    maxLength: createMaxLengthValidator(t.maxLength),
  };
}
