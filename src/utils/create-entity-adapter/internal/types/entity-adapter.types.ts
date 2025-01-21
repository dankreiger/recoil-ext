import type { RecoilState } from "recoil";
import type { EntityState } from "./entity-state.types";

export interface EntityAdapter<T, Id extends string | number> {
	/**
	 * The core Recoil atom that stores the entity state.
	 * This atom contains both the entities and their IDs in a normalized format.
	 */
	readonly entityAtom: RecoilState<EntityState<T, Id>>;

	/**
	 * Returns a fresh, empty entity state object.
	 * Use this to initialize your entity state when needed.
	 */
	readonly getInitialState: () => EntityState<T, Id>;

	/**
	 * A hook that returns all entities as an array.
	 * The returned array is readonly to prevent direct mutations.
	 */
	readonly useAllEntities: () => ReadonlyArray<T>;

	/**
	 * Creates a hook that returns a single entity by its ID.
	 * Returns undefined if the entity doesn't exist.
	 */
	readonly createUseOneEntity: (id: Id) => T | undefined;

	/**
	 * Creates an object containing all entity CRUD operations.
	 * All methods are readonly to ensure immutability.
	 */
	readonly createUseEntityActions: () => {
		/**
		 * Adds a single entity to the state.
		 * If an entity with the same ID exists, it will be replaced.
		 */
		readonly addOne: (entity: T) => void;

		/**
		 * Adds multiple entities to the state.
		 * Existing entities with the same IDs will be replaced.
		 */
		readonly addMany: (entities: ReadonlyArray<T>) => void;

		/**
		 * Replaces all existing entities with the provided array of entities.
		 * This will remove any entities not included in the new array.
		 */
		readonly setAll: (entities: ReadonlyArray<T>) => void;

		/**
		 * Removes a single entity from the state by its ID.
		 * No-op if the entity doesn't exist.
		 */
		readonly removeOne: (id: Id) => void;

		/**
		 * Removes multiple entities from the state by their IDs.
		 * No-op for IDs that don't exist.
		 */
		readonly removeMany: (ids: ReadonlyArray<Id>) => void;

		/**
		 * Removes all entities from the state.
		 * Resets the state to its initial empty state.
		 */
		readonly removeAll: () => void;

		/**
		 * Updates a single entity by applying partial changes.
		 * No-op if the entity doesn't exist.
		 */
		readonly updateOne: (id: Id, changes: Partial<T>) => void;

		/**
		 * Updates multiple entities by applying partial changes.
		 * No-op for entities that don't exist.
		 */
		readonly updateMany: (
			updates: ReadonlyArray<{
				readonly id: Id;
				readonly changes: Partial<T>;
			}>,
		) => void;
	};
}
