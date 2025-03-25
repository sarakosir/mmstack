import { Validator } from '../validator.type';

export function defaultRequiredMessageFactory(label: string = 'Field') {
  return `${label} is required`;
}

function requiredNumber(value: number) {
  return value !== null && value !== undefined;
}

export function createRequiredValidator(
  createMsg: (label: string) => string,
): <T>(label?: string) => Validator<T> {
  return (label = 'Field') => {
    const msg = createMsg(label);

    return (value) => {
      if (typeof value === 'number' && !requiredNumber(value)) return msg;
      if (!value) return msg;
      return '';
    };
  };
}
