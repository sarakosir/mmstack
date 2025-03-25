import { Validator } from './validator.type';

export function defaultMergeMessage(errors: string[]): {
  error: string;
  tooltip: string;
} {
  const first = errors.at(0);

  if (!first)
    return {
      error: '',
      tooltip: '',
    };

  if (errors.length === 1) {
    return {
      error: first,
      tooltip: '',
    };
  }

  return {
    error: `${first}, & +${errors.length} issues`,
    tooltip: errors.join('\n'),
  };
}

function toTooltipFn(
  merge: (errors: string[]) => string | { tooltip: string; error: string },
) {
  return (errors: string[]) => {
    const result = merge(errors);
    if (typeof result === 'string') {
      return {
        error: result,
        tooltip: '',
      };
    }

    return result;
  };
}

export function mergeValidators<T>(
  ...validators: Validator<T>[]
): (value: T) => string[] {
  if (!validators.length) return () => [];

  return (value) => validators.map((val) => val(value)).filter(Boolean);
}

export function createMergeValidators(
  merge?: (errors: string[]) =>
    | string
    | {
        tooltip: string;
        error: string;
      },
) {
  const mergeFn = merge ? toTooltipFn(merge) : defaultMergeMessage;

  return <T>(validators: Validator<T>[]) => {
    const validate = mergeValidators(...validators);

    return (value: T) => mergeFn(validate(value));
  };
}
