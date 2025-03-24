export function values<T extends object>(value: T): T[keyof T][] {
	if (typeof value !== 'object' || value === null) return [];
	return Object.values(value) as T[keyof T][];
};