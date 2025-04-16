/**
 * Gets a strongly-typed array of an object's own enumerable **string-keyed** `[key, value]` pairs.
 * Provides a typed wrapper around `Object.entries()`, returning `[keyof T, T[keyof T]][]`.
 *
 * **Note:** Relies on `Object.entries()`, so it **only returns entries for enumerable string keys**.
 * Entries corresponding to number or symbol keys will be omitted. Returns `[]` for non-object/null inputs.
 * The types `keyof T` and `T[keyof T]` in the return signature represent the union of *all*
 * possibilities in `T`, not just the subset returned.
 *
 * @template {object} T The type of the object.
 * @param {T} value The object whose entries are to be returned.
 * @returns {[keyof T, T[keyof T]][]} An array of `[key, value]` tuples for enumerable string keys, typed using `keyof T` and `T[keyof T]`.
 * @example
 * const myObj = { a: 1, b: 'hello' };
 * const e = entries(myObj);  // typeof e is (['a' | 'b', string | number])[]  // e value is [['a', 1], ['b', 'hello']] (or reversed order)
 * entries(null); // => []
 */
export function entries<T extends object>(value: T): [keyof T, T[keyof T]][] {
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value) as [keyof T, T[keyof T]][];
}
