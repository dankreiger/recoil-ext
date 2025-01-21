import type { EntityId, EntityState, EntityUpdate } from "../types";

export function addOneUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(
	state: EntityState<T>,
	entity: T,
	idKey: keyof T,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> {
	const id = entity[idKey];
	if (id in state.entities) {
		return state;
	}
	const newIds = [...state.ids, id];
	const newEntities = { ...state.entities, [id]: entity };
	return reSort({ ids: newIds, entities: newEntities }, sortComparer);
}

export function addManyUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(
	state: EntityState<T>,
	entities: ReadonlyArray<T>,
	idKey: keyof T,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> {
	if (!entities.length) return state;
	let changed = false;
	const newEntities = { ...state.entities } as Record<Id, T>;
	const idsSet = new Set(state.ids);

	for (const e of entities) {
		const eId = e[idKey];
		if (!(eId in newEntities)) {
			changed = true;
			newEntities[eId] = e;
			idsSet.add(eId);
		}
	}

	if (!changed) return state;

	const newState: EntityState<T> = {
		ids: [...idsSet],
		entities: newEntities,
	};
	return reSort(newState, sortComparer);
}

export function upsertOneUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(
	state: EntityState<T>,
	entity: T,
	idKey: keyof T,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> {
	const id = entity[idKey];
	const exists = id in state.entities;
	if (!exists) {
		const newIds = [...state.ids, id];
		const newEntities = { ...state.entities, [id]: entity };
		return reSort({ ids: newIds, entities: newEntities }, sortComparer);
	}
	const newEntities = { ...state.entities, [id]: entity };
	const newState: EntityState<T> = {
		ids: state.ids,
		entities: newEntities,
	};
	return reSort(newState, sortComparer);
}

export function setAllUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(
	_: EntityState<T>,
	entities: ReadonlyArray<T>,
	idKey: keyof T,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> {
	const newEntities = {} as Record<Id, T>;
	const ids: Id[] = [];
	for (const e of entities) {
		const eId = e[idKey];
		newEntities[eId] = e;
		ids.push(eId);
	}
	let newState: EntityState<T> = {
		ids,
		entities: newEntities,
	};
	newState = reSort(newState, sortComparer);
	return newState;
}

export function updateOneUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(
	state: EntityState<T>,
	update: EntityUpdate<T, Id>,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> {
	const { id, changes } = update;
	if (!(id in state.entities)) {
		return state;
	}
	const oldEntity = state.entities[id];
	const newEntity = { ...oldEntity, ...changes };
	const newEntities = { ...state.entities, [id]: newEntity };
	const newState: EntityState<T> = {
		ids: state.ids,
		entities: newEntities,
	};
	return reSort(newState, sortComparer);
}

export function updateManyUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(
	state: EntityState<T>,
	updates: ReadonlyArray<EntityUpdate<T, Id>>,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> {
	if (!updates.length) return state;
	let changed = false;
	const newEntities = { ...state.entities } as Record<Id, T>;

	// First, apply all updates
	for (const upd of updates) {
		const { id, changes } = upd;
		if (!(id in newEntities)) continue;
		const oldEntity = newEntities[id];
		const newEntity = { ...oldEntity, ...changes };
		if (newEntity !== oldEntity) {
			newEntities[id] = newEntity;
			changed = true;
		}
	}

	if (!changed) return state;

	// Then, sort the ids based on the updated entities
	return reSort(
		{
			ids: state.ids,
			entities: newEntities,
		},
		sortComparer,
	);
}

export function removeOneUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(state: EntityState<T>, id: Id): EntityState<T> {
	if (!(id in state.entities)) {
		return state;
	}
	const newEntities = { ...state.entities } as Record<Id, T>;
	delete newEntities[id];
	const newIds = state.ids.filter((existingId) => existingId !== id);
	return {
		ids: newIds,
		entities: newEntities,
	};
}

export function removeManyUpdater<T extends { [K in keyof T]: T[K] }>(
	state: EntityState<T>,
	ids: ReadonlyArray<EntityId>,
): EntityState<T> {
	if (!ids.length) return state;
	const idsToRemove = new Set(ids);
	const newIds = state.ids.filter((id) => !idsToRemove.has(id));
	if (newIds.length === state.ids.length) return state;

	const newEntities = { ...state.entities } as Record<EntityId, T>;
	for (const id of ids) {
		delete newEntities[id];
	}

	return {
		ids: newIds,
		entities: newEntities,
	};
}

export function removeAllUpdater<
	T extends { [K in keyof T]: T[K] },
	Id extends EntityId,
>(state: EntityState<T>): EntityState<T> {
	if (!state.ids.length) return state;
	return {
		ids: [],
		entities: {} as Record<Id, T>,
	};
}

export function reSort<T extends { [K in keyof T]: T[K] }, Id extends EntityId>(
	state: EntityState<T>,
	comparer?: (a: T, b: T) => number,
): EntityState<T> {
	const newIds = [...state.ids];
	const defaultComparer = (a: T, b: T) => {
		if ("createdAt" in a && "createdAt" in b) {
			return (b.createdAt as number) - (a.createdAt as number);
		}
		return 0;
	};

	newIds.sort((a, b) =>
		(comparer || defaultComparer)(state.entities[a], state.entities[b]),
	);

	return {
		ids: newIds,
		entities: state.entities,
	};
}
