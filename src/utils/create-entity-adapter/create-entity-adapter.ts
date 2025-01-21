import { atom } from "recoil";
import type { EntityAdapter, EntityId } from "./internal";
import {
	createUseAllEntities,
	createUseEntityActions,
	createUseOneEntity,
	normalize,
} from "./internal";

/**
 * Creates an "Entity Adapter" for managing normalized state in Recoil.
 * @template T The entity type
 * @template K The key of T that should be used as the ID
 */
export function createEntityAdapter<
	T extends object,
	K extends keyof T,
>(options: {
	key: string;
	idKey: K;
	initialState?: ReadonlyArray<T> | T;
	selectId?: (entity: T) => EntityId;
	sortComparer?: (a: T, b: T) => number;
}): EntityAdapter<T> {
	const {
		key,
		idKey,
		selectId = (entity: T) => entity[idKey] as EntityId,
		sortComparer,
		initialState: inpState,
	} = options;

	const inputAtom = atom({
		key: `${key}_EntityAdapter`,
		default: normalize(
			// @ts-expect-error - too tired for this
			Array.isArray(inpState) ? inpState : [inpState].filter(Boolean),
			selectId,
			sortComparer,
		),
	});

	const initialState = normalize(
		// @ts-expect-error - too tired for this
		Array.isArray(inpState) ? inpState : [inpState].filter(Boolean),
		selectId,
		sortComparer,
	);

	return {
		getInitialState: () => initialState,
		useAllEntities: () => createUseAllEntities(inputAtom),
		useOneEntity: createUseOneEntity(key, inputAtom),
		useEntityActions: createUseEntityActions(inputAtom, selectId, sortComparer),
	} as const;
}
