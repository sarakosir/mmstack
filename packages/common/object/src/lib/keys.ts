/**
 * Gets a strongly-typed array of an object's own enumerable **string** property keys.
 * Provides a typed wrapper around `Object.keys()`, returning `(keyof T)[]`.
 *
 * **Note:** Despite the `keyof T` return type potentially including numbers or symbols,
 * this function relies on `Object.keys` and will **only ever return string keys**.
 * It also only returns keys that are enumerable. Returns `[]` for non-object/null inputs.
 *
 * @template {object} T The type of the object.
 * @param {T} value The object whose keys are to be returned.
 * @returns {(keyof T)[]} An array of the object's own enumerable string keys, typed via `keyof T`.
 * @example
 * const myObj = { a: 1, b: 'hello' };
 * const k = keys(myObj); // typeof k is ('a' | 'b')[]
 * keys(null); // => []
 */
export function keys<T extends object>(value: T): (keyof T)[] {
  if (typeof value !== 'object' || value === null) return [];
  return Object.keys(value) as (keyof T)[];
}
