import type { EntityState } from "../../types";

export const normalize = <T, Id extends string | number>(
	entities: ReadonlyArray<T>,
	selectId: (entity: T) => Id,
	sortComparer?: (a: T, b: T) => number,
): EntityState<T, Id> => {
	const ids: Id[] = [];
	const entitiesMap = {} as Record<Id, T>;

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
