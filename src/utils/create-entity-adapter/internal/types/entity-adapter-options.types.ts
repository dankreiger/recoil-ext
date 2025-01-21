// Update the types in internal.ts
export interface CreateEntityAdapterOptions<
	T,
	K extends keyof T,
	Id extends T[K],
> {
	/** Unique key for the Recoil atom */
	readonly key: string;
	/** The key of T to use as the ID */
	readonly idKey: K;
	/** Optional function to select the ID from an entity */
	readonly selectId?: (entity: T) => Id;
	/** Optional comparison function for sorting entities */
	readonly sortComparer?: (a: T, b: T) => number;
}
