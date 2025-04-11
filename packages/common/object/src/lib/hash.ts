import { isPlainObject } from './is-plain-object';
import { keys } from './keys';
import type { UnknownObject } from './unknown-object.type';

/**
 * Internal helper to generate a stable JSON string from an array.
 * Sorts keys of plain objects within the array alphabetically before serialization
 * to ensure hash stability regardless of key order.
 *
 * @param queryKey The array of values to serialize.
 * @returns A stable JSON string representation.
 * @internal
 */
function hashKey(queryKey: unknown[]): string {
  return JSON.stringify(queryKey, (_, val) =>
    isPlainObject(val)
      ? keys(val)
          .toSorted()
          .reduce((result, key) => {
            result[key] = val[key];
            return result;
          }, {} as UnknownObject)
      : val,
  );
}

/**
 * Generates a stable, unique string hash from one or more arguments.
 * Useful for creating cache keys or identifiers where object key order shouldn't matter.
 *
 * How it works:
 * - Plain objects within the arguments have their keys sorted alphabetically before hashing.
 * This ensures that `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce the same hash.
 * - Uses `JSON.stringify` internally with custom sorting for plain objects via `hashKey`.
 * - Non-plain objects (arrays, Dates, etc.) and primitives are serialized naturally.
 *
 * @param {...unknown} args Values to include in the hash.
 * @returns A stable string hash representing the input arguments.
 * @example
 * const userQuery = (id: number) => ['user', { id, timestamp: Date.now() }];
 *
 * const obj1 = { a: 1, b: 2 };
 * const obj2 = { b: 2, a: 1 }; // Same keys/values, different order
 *
 * hash('posts', 10);
 * // => '["posts",10]'
 *
 * hash('config', obj1);
 * // => '["config",{"a":1,"b":2}]'
 *
 * hash('config', obj2);
 * // => '["config",{"a":1,"b":2}]' (Same as above due to key sorting)
 *
 * hash(['todos', { status: 'done', owner: obj1 }]);
 * // => '[["todos",{"owner":{"a":1,"b":2},"status":"done"}]]'
 *
 * // Be mindful of values JSON.stringify cannot handle (functions, undefined, Symbols)
 * // hash('a', undefined, function() {}) => '["a",null,null]'
 */
export function hash(...args: unknown[]): string {
  return hashKey(args);
}
