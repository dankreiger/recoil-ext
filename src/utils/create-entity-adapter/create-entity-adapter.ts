import { atom, useRecoilValue } from "recoil";
import type { EntityAdapter } from "./internal";
import {
	createUseAllEntities,
	createUseEntityActions,
	createUseOneEntity,
	normalize,
} from "./internal";

/**
 * Creates an "Entity Adapter" for managing normalized state in Recoil.
 * @template T The entity type
 */
export function createEntityAdapter<T extends object>(options: {
	key: string;
	idKey: keyof T;
	initialState?: ReadonlyArray<T> | T;
	sortComparer?: (a: T, b: T) => number;
}): EntityAdapter<T> {
	const { key, idKey, sortComparer, initialState: inputInitialState } = options;

	const initialStateArray = [inputInitialState]
		.flat()
		.filter(Boolean) as ReadonlyArray<T>;

	const initialEntityState = normalize(initialStateArray, idKey, sortComparer);
	const inputAtom = atom({
		key: `${key}_EntityAdapter`,
		default: initialEntityState,
	});

	return {
		getInitialState: () => initialEntityState,
		getCurrentState: () => useRecoilValue(inputAtom),
		useAllEntities: () => createUseAllEntities(inputAtom),
		useOneEntity: createUseOneEntity(key, inputAtom),
		useEntityActions: createUseEntityActions(inputAtom, idKey, sortComparer),
	} as const;
}
