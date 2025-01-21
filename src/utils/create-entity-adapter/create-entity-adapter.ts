import { atom } from "recoil";
import type { EntityAdapter, EntityState } from "./internal";
import { createEntityHooks, normalize } from "./internal";

/**
 * Creates an "Entity Adapter" for managing normalized state in Recoil.
 * @template T The entity type
 * @template K The key of T that should be used as the ID
 * @template Id The type of the ID (defaults to the type of T[K])
 */
export function createEntityAdapter<
	T extends object,
	K extends keyof T,
	Id extends string | number = string | number,
>(options: {
	key: string;
	idKey: K;
	initialState?: ReadonlyArray<T> | T;
	selectId?: (entity: T) => Id;
	sortComparer?: (a: T, b: T) => number;
}): EntityAdapter<T, Id> {
	const {
		key,
		idKey,
		selectId = (entity: T) => entity[idKey] as Id,
		sortComparer,
		initialState: inpState,
	} = options;

	const initialState = normalize(
		// @ts-expect-error - too tired for this
		Array.isArray(inpState) ? inpState : [inpState].filter(Boolean),
		selectId,
		sortComparer,
	);

	const entityAtom = atom<EntityState<T, Id>>({
		key,
		default: initialState,
	} as const);

	const { createUseAllEntities, createUseOneEntity, createUseEntityActions } =
		createEntityHooks(key, entityAtom, selectId, sortComparer);

	return {
		getInitialState: () => initialState,
		entityAtom,
		useAllEntities: () => createUseAllEntities(),
		useOneEntity: (id: Id) => createUseOneEntity(id),
		useEntityActions: () => createUseEntityActions(),
	};
}
