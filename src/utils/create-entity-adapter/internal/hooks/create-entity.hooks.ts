import type { RecoilState } from "recoil";
import type { EntityState } from "..";
import { createUseAllEntities } from "./create-use-all-entities";
import { createUseEntityActions } from "./create-use-entity-actions";
import { createUseOneEntity } from "./create-use-one-entity/create-use-one-entity.hooks";

export function createEntityHooks<
	const T extends { [K in keyof T]: T[K] },
	const Id extends string | number,
>(
	key: string,
	entityAtom: RecoilState<EntityState<T, Id>>,
	selectId: (entity: T) => Id,
	sortComparer?: (a: T, b: T) => number,
) {
	return {
		useAllEntities: () => createUseAllEntities(entityAtom),
		createUseOneEntity: () => createUseOneEntity(key, entityAtom),
		createUseEntityActions: () =>
			createUseEntityActions(entityAtom, selectId, sortComparer),
	};
}
