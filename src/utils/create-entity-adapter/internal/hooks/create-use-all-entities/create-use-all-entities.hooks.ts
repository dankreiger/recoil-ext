import { type RecoilState, useRecoilValue } from "recoil";
import type { EntityId, EntityState } from "../..";

export const createUseAllEntities = <T>(
	inputAtom: RecoilState<EntityState<T>>,
): ReadonlyArray<T> => {
	const entityState = useRecoilValue(inputAtom);
	return entityState.ids.map((id: EntityId) => entityState.entities[id]);
};
