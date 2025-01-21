import { type RecoilState, useRecoilValue } from "recoil";
import type { EntityState } from "../..";

export const createUseAllEntities =
	<T, Id extends string | number = string>(
		entityAtom: RecoilState<EntityState<T, Id>>,
	) =>
	(): ReadonlyArray<T> => {
		const entityState = useRecoilValue(entityAtom);
		return entityState.ids.map((id: Id) => entityState.entities[id]);
	};
