import { type RecoilState, selectorFamily, useRecoilValue } from "recoil";
import type { EntityId, EntityState } from "../..";

export const createUseOneEntity = <T extends { [K in keyof T]: T[K] }>(
	key: string,
	entityAtom: RecoilState<EntityState<T>>,
) => {
	const entitySelector = selectorFamily<T | undefined, EntityId>({
		key: `${key}_entitySelector`,
		get:
			(id: EntityId) =>
			({ get }) => {
				const state = get(entityAtom);
				return state.entities[id];
			},
	});

	return (id: EntityId): T | undefined => useRecoilValue(entitySelector(id));
};
