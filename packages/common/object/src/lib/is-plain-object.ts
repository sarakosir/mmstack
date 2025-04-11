import type { UnknownObject } from './unknown-object.type';

/**
 * Checks if `value` is a plain JavaScript object (e.g., `{}` or `new Object()`).
 * Distinguishes from arrays, null, and class instances. Acts as a type predicate,
 * narrowing `value` to `UnknownObject` if `true`.
 *
 * @param value The value to check.
 * @returns {value is UnknownObject} `true` if `value` is a plain object, otherwise `false`.
 * @example
 * isPlainObject({}) // => true
 * isPlainObject([]) // => false
 * isPlainObject(null) // => false
 * isPlainObject(new Date()) // => false
 */
export function isPlainObject(value: unknown): value is UnknownObject {
  return (
    typeof value === 'object' && value !== null && value.constructor === Object
  );
}
