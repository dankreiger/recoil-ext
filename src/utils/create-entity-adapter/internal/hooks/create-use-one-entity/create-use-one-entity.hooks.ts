import { type RecoilState, selectorFamily, useRecoilValue } from "recoil";
import type { EntityState } from "../..";

export const createUseOneEntity = <
	T extends { [K in keyof T]: T[K] },
	Id extends string | number,
>(
	key: string,
	entityAtom: RecoilState<EntityState<T, Id>>,
) => {
	const entitySelector = selectorFamily<T | undefined, Id>({
		key: `${key}_entitySelector`,
		get:
			(id: Id) =>
			({ get }) => {
				const state = get(entityAtom);
				return state.entities[id];
			},
	});

	return (id: Id): T | undefined => useRecoilValue(entitySelector(id));
};
