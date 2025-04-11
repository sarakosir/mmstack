/**
 * An object that must be empty (cannot have any properties).
 * Useful for type-checking arguments or variables that should strictly be `{}`.
 * Based on `Record<PropertyKey, never>`.
 *
 * @typedef {Record<PropertyKey, never>} EmptyObject
 * @example
 * const valid: EmptyObject = {}; // OK
 * // const invalid: EmptyObject = { key: 'value' }; // => TypeScript Error
 */
export type EmptyObject = Record<PropertyKey, never>;
