import { type RecoilState, useSetRecoilState } from "recoil";
import {
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

export const createUseEntityActions = <
	T extends { [K in keyof T]: T[K] },
	Id extends string | number,
>(
	entityAtom: RecoilState<EntityState<T, Id>>,
	selectId: (entity: T) => Id,
	sortComparer?: (a: T, b: T) => number,
) => {
	return () => {
		const setEntities = useSetRecoilState(entityAtom);

		return {
			addOne: (entity: T) => {
				setEntities((prev: EntityState<T, Id>) =>
					addOneUpdater(prev, entity, selectId, sortComparer),
				);
			},
			addMany: (entities: ReadonlyArray<T>) => {
				setEntities((prev: EntityState<T, Id>) =>
					addManyUpdater(prev, entities, selectId, sortComparer),
				);
			},
			upsertOne: (entity: T) => {
				setEntities((prev: EntityState<T, Id>) =>
					upsertOneUpdater(prev, entity, selectId, sortComparer),
				);
			},
			setAll: (entities: ReadonlyArray<T>) => {
				setEntities((prev: EntityState<T, Id>) =>
					setAllUpdater(prev, entities, selectId, sortComparer),
				);
			},
			updateOne: (id: Id, changes: Partial<T>) => {
				setEntities((prev: EntityState<T, Id>) =>
					updateOneUpdater(prev, { id, changes }, sortComparer),
				);
			},
			updateMany: (updates: ReadonlyArray<{ id: Id; changes: Partial<T> }>) => {
				setEntities((prev: EntityState<T, Id>) =>
					updateManyUpdater(prev, updates, sortComparer),
				);
			},
			removeOne: (id: Id) => {
				setEntities((prev: EntityState<T, Id>) => removeOneUpdater(prev, id));
			},
			removeMany: (ids: ReadonlyArray<Id>) => {
				setEntities((prev: EntityState<T, Id>) => removeManyUpdater(prev, ids));
			},
			removeAll: () => {
				setEntities((prev: EntityState<T, Id>) => removeAllUpdater(prev));
			},
		};
	};
};
