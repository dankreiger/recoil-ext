import { atom } from "recoil";
import type { EntityAdapter, EntityState } from "./internal";
import { createEntityHooks } from "./internal";

/**
 * Creates an "Entity Adapter" for managing normalized state in Recoil.
 * @template T The entity type
 * @template K The key of T that should be used as the ID
 * @template Id The type of the ID (defaults to the type of T[K])
 */
export function createEntityAdapter<
	T extends { [K in keyof T]: T[K] },
	K extends keyof T,
	Id extends string | number = T[K] extends string | number ? T[K] : never,
>(options: {
	key: string;
	idKey: K;
	selectId?: (entity: T) => Id;
	sortComparer?: (a: T, b: T) => number;
}): EntityAdapter<T, Id> {
	const {
		key,
		idKey,
		selectId = (entity: T) => entity[idKey] as Id,
		sortComparer,
	} = options;

	/**
	 * The shape of our Recoil atom:
	 *  - `ids`: array of entity IDs
	 *  - `entities`: map of ID -> entity
	 */
	const entityAtom = atom<EntityState<T, Id>>({
		key,
		default: {
			ids: [] as ReadonlyArray<Id>,
			entities: {} as Readonly<Record<Id, T>>,
		},
	});

	const { useAllEntities, createUseOneEntity, createUseEntityActions } =
		createEntityHooks(key, entityAtom, selectId, sortComparer);

	return {
		entityAtom,
		useAllEntities,
		createUseOneEntity,
		createUseEntityActions,
	};
}
