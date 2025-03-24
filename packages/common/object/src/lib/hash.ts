import { isPlainObject } from "./is-plain-object";
import { keys } from "./keys";
import type { UnknownObject } from "./unknown-object.type";


function hashKey(queryKey: unknown[]): string {
  return JSON.stringify(queryKey, (_, val) =>
    isPlainObject(val)
      ? keys(val)
          .toSorted()
          .reduce((result, key) => {
            result[key] = val[key];
            return result;
          }, {} as UnknownObject)
      : val
  );
}

export function hash(...args: unknown[]): string {
  return hashKey(args);
}
