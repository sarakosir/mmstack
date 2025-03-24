export function keys<T extends object>(value: T): (keyof T)[] {
	if (typeof value !== 'object' || value === null) return [];
	return Object.keys(value) as (keyof T)[];
};