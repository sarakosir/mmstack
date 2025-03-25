import {
  createMustBeTrueValidator,
  defaultMustBeTreFactory,
} from './must-be-true';

export type BooleanMessageFactories = {
  mustBeTrue: Parameters<typeof createMustBeTrueValidator>[0];
};

const DEFAULT_MESSAGES: BooleanMessageFactories = {
  mustBeTrue: defaultMustBeTreFactory,
};

export function createBooleanValidators(
  factories?: Partial<BooleanMessageFactories>,
) {
  const t = { ...DEFAULT_MESSAGES, ...factories };

  return {
    mustBeTrue: createMustBeTrueValidator(t.mustBeTrue),
  };
}
