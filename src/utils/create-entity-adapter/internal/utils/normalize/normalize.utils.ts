import type { EntityId, EntityState } from "../../types";

export const normalize = <T>(
	entities: ReadonlyArray<T>,
	selectId: (entity: T) => EntityId,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T> => {
	const ids: EntityId[] = [];
	const entitiesMap = {} as Record<EntityId, T>;

	for (const entity of entities) {
		const id = selectId(entity);
		ids.push(id);
		entitiesMap[id] = entity;
	}

	if (sortComparer) {
		ids.sort((a, b) => sortComparer(entitiesMap[a], entitiesMap[b]));
	}

	return {
		ids,
		entities: entitiesMap,
	};
};
