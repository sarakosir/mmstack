/**
 * An object that can have any properties, where the value of each property is `unknown`.
 * Requires type checking or assertion before using property values, making it a safer
 * alternative to `Record<PropertyKey, any>`. Based on `Record<PropertyKey, unknown>`.
 *
 * @typedef {Record<PropertyKey, unknown>} UnknownObject
 * @example
 * const data: UnknownObject = { name: "Alice", age: 30, active: true, [Symbol('id')]: 123 }; // OK
 *
 * // Need to check types before use:
 * if (typeof data.name === 'string') {
 * console.log(data.name.toUpperCase()); // OK
 * }
 * // console.log(data.age.toFixed(0)); // => TypeScript Error: Object is of type 'unknown'.
 */
export type UnknownObject = Record<PropertyKey, unknown>;
