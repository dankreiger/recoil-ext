import { atom } from "recoil";
import type { EntityState } from "../../types";

/**
 * The shape of our Recoil atom:
 *  - `ids`: array of entity IDs
 *  - `entities`: map of ID -> entity
 */
export const createEntityAtom = <
	const S extends string,
	const T,
	const Id extends string | number,
>(
	key: S,
	initialState: EntityState<T, Id>,
) => {
	return atom<EntityState<T, Id>>({
		key,
		default: initialState,
	} as const);
};
