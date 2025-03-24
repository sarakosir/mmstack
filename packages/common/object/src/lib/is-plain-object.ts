import type { UnknownObject } from "./unknown-object.type";

export function isPlainObject(value: unknown): value is UnknownObject {
	return (
		typeof value === 'object' && value !== null && value.constructor === Object
	);
}