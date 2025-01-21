import { type RecoilState, useSetRecoilState } from "recoil";
import {
	type EntityId,
	type EntityState,
	addManyUpdater,
	addOneUpdater,
	removeAllUpdater,
	removeManyUpdater,
	removeOneUpdater,
	setAllUpdater,
	updateManyUpdater,
	updateOneUpdater,
	upsertOneUpdater,
} from "../..";

export const createUseEntityActions = <T extends object>(
	entityAtom: RecoilState<EntityState<T>>,
	idKey: keyof T,
	sortComparer?: (a: T, b: T) => number,
) => {
	return () => {
		const setEntities = useSetRecoilState(entityAtom);

		return {
			addOne: (entity: T) => {
				setEntities((prev: EntityState<T>) =>
					addOneUpdater(prev, entity, idKey, sortComparer),
				);
			},
			addMany: (entities: ReadonlyArray<T>) => {
				setEntities((prev: EntityState<T>) =>
					addManyUpdater(prev, entities, idKey, sortComparer),
				);
			},
			upsertOne: (entity: T) => {
				setEntities((prev: EntityState<T>) =>
					upsertOneUpdater(prev, entity, idKey, sortComparer),
				);
			},
			setAll: (entities: ReadonlyArray<T>) => {
				setEntities((prev: EntityState<T>) =>
					setAllUpdater(prev, entities, idKey, sortComparer),
				);
			},
			updateOne: (id: EntityId, changes: Partial<T>) => {
				setEntities((prev: EntityState<T>) =>
					updateOneUpdater(prev, { id, changes }, sortComparer),
				);
			},
			updateMany: (
				updates: ReadonlyArray<{ id: EntityId; changes: Partial<T> }>,
			) => {
				setEntities((prev: EntityState<T>) =>
					updateManyUpdater(prev, updates, sortComparer),
				);
			},
			removeOne: (id: EntityId) => {
				setEntities((prev: EntityState<T>) => removeOneUpdater(prev, id));
			},
			removeMany: (ids: ReadonlyArray<EntityId>) => {
				setEntities((prev: EntityState<T>) => removeManyUpdater(prev, ids));
			},
			removeAll: () => {
				setEntities((prev: EntityState<T>) => removeAllUpdater(prev));
			},
		};
	};
};
