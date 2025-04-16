/**
 * Gets a strongly-typed array of an object's own enumerable **string-keyed** property values.
 * Provides a typed wrapper around `Object.values()`, returning `T[keyof T][]`.
 *
 * **Note:** Relies on `Object.values()`, so it **only returns values associated with
 * enumerable string keys**. Values corresponding to number or symbol keys will be omitted.
 * Returns `[]` for non-object/null inputs. The return type `T[keyof T]` represents the
 * union of types of *all* properties known to TypeScript, not just the ones returned.
 *
 * @template {object} T The type of the object.
 * @param {T} value The object whose values are to be returned.
 * @returns {T[keyof T][]} An array of values from enumerable string keys, typed as the union of all possible property value types in `T`.
 * @example
 * const myObj = { a: 1, b: 'hello' };
 * const v = values(myObj); // typeof v is (string | number)[] // v value is [1, 'hello'] (or ['hello', 1])
 * values(null); // => []
 */
export function values<T extends object>(value: T): T[keyof T][] {
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value) as T[keyof T][];
}
