import type { RecoilState } from "recoil";
import type { EntityState } from "./entity-state.types";

/**
 * A powerful adapter for managing normalized entity state in Recoil.
 *
 * @template T - The entity type (must have an id field)
 * @template Id - The type of the entity's ID (string | number)
 *
 * @example
 * ```typescript
 * interface User { id: string; name: string; age: number }
 *
 * const userAdapter = createEntityAdapter<User, string>({
 *   selectId: (user) => user.id
 * });
 *
 * // In your component:
 * const users = userAdapter.useAllEntities();
 * const actions = userAdapter.createUseEntityActions();
 *
 * // Add a user
 * actions.addOne({ id: '1', name: 'Alice', age: 30 });
 * ```
 *
 * @performance This adapter uses normalized state management which provides:
 * - O(1) lookups for individual entities
 * - O(1) insertions and updates
 * - O(1) deletions
 * - Minimal re-renders through selective updates
 *
 * @bestPractices
 * - Always use the provided methods instead of modifying the state directly
 * - Consider using batch updates (addMany, updateMany) for multiple operations
 * - Leverage the readonly types to prevent accidental mutations
 */
export interface EntityAdapter<
	T,
	Id extends string | number = string | number,
> {
	/**
	 * The core Recoil atom that stores the entity state.
	 * This atom contains both the entities and their IDs in a normalized format.
	 *
	 * @performance O(1) access to the entire state
	 *
	 * @example
	 * ```typescript
	 * const entityState = useRecoilValue(adapter.entityAtom);
	 * console.log(entityState.ids); // ['1', '2', '3']
	 * console.log(entityState.entities); // { '1': { id: '1', ... }, ... }
	 * ```
	 */
	readonly entityAtom: RecoilState<EntityState<T, Id>>;

	/**
	 * Returns a fresh, empty entity state object.
	 * Use this to initialize your entity state when needed.
	 *
	 * @returns {EntityState<T, Id>} A new entity state with empty ids and entities
	 *
	 * @example
	 * ```typescript
	 * const initialState = adapter.getInitialState();
	 * // Result: { ids: [], entities: {} }
	 * ```
	 */
	readonly getInitialState: () => EntityState<T, Id>;

	/**
	 * A hook that returns all entities as an array.
	 * The returned array is readonly to prevent direct mutations.
	 *
	 * @performance
	 * - O(n) time complexity for initial transformation
	 * - Memoized to prevent unnecessary re-renders
	 * - Returns the same array reference if entities haven't changed
	 *
	 * @example
	 * ```typescript
	 * function UserList() {
	 *   const users = adapter.useAllEntities();
	 *   return (
	 *     <ul>
	 *       {users.map(user => (
	 *         <li key={user.id}>{user.name}</li>
	 *       ))}
	 *     </ul>
	 *   );
	 * }
	 * ```
	 */
	readonly useAllEntities: () => ReadonlyArray<T>;

	/**
	 * Creates a hook that returns a single entity by its ID.
	 * Returns undefined if the entity doesn't exist.
	 *
	 * @performance
	 * - O(1) lookup time
	 * - Component only re-renders when the specific entity changes
	 *
	 * @example
	 * ```typescript
	 * function UserProfile({ userId }: { userId: string }) {
	 *   const useUser = adapter.createUseOneEntity;
	 *   const user = useUser(userId);
	 *
	 *   if (!user) return <div>User not found</div>;
	 *   return <div>Name: {user.name}</div>;
	 * }
	 * ```
	 */
	readonly useOneEntity: (id: Id) => T | undefined;

	/**
	 * Creates an object containing all entity CRUD operations.
	 * All methods are readonly to ensure immutability.
	 *
	 * @returns An object containing all entity manipulation methods
	 *
	 * @performance All operations maintain normalized state for optimal performance
	 *
	 * @example
	 * ```typescript
	 * function UserManager() {
	 *   const actions = adapter.createUseEntityActions();
	 *
	 *   const addNewUser = () => {
	 *     actions.addOne({ id: '1', name: 'New User' });
	 *   };
	 *
	 *   return <button onClick={addNewUser}>Add User</button>;
	 * }
	 * ```
	 */
	readonly useEntityActions: () => {
		/**
		 * Adds a single entity to the state.
		 * If an entity with the same ID exists, it will be replaced.
		 *
		 * @performance O(1) operation
		 *
		 * @example
		 * ```typescript
		 * actions.addOne({ id: '1', name: 'Alice', age: 30 });
		 * ```
		 *
		 * @throws {TypeError} If entity is missing an id field
		 */
		readonly addOne: (entity: T) => void;

		/**
		 * Adds multiple entities to the state.
		 * Existing entities with the same IDs will be replaced.
		 *
		 * @performance
		 * - O(n) where n is the number of entities
		 * - Single atomic update for better performance
		 * - Batches all changes to minimize re-renders
		 *
		 * @example
		 * ```typescript
		 * actions.addMany([
		 *   { id: '1', name: 'Alice' },
		 *   { id: '2', name: 'Bob' }
		 * ]);
		 * ```
		 */
		readonly addMany: (entities: ReadonlyArray<T>) => void;

		/**
		 * Replaces all existing entities with the provided array of entities.
		 * This will remove any entities not included in the new array.
		 *
		 * @performance
		 * - O(n) where n is the number of new entities
		 * - Single atomic update
		 * - Completely replaces internal storage
		 *
		 * @example
		 * ```typescript
		 * actions.setAll([
		 *   { id: '1', name: 'Alice' },
		 *   { id: '2', name: 'Bob' }
		 * ]); // Removes all other entities
		 * ```
		 */
		readonly setAll: (entities: ReadonlyArray<T>) => void;

		/**
		 * Removes a single entity from the state by its ID.
		 * No-op if the entity doesn't exist.
		 *
		 * @performance O(1) operation
		 *
		 * @example
		 * ```typescript
		 * actions.removeOne('1'); // Removes user with id '1'
		 * ```
		 */
		readonly removeOne: (id: Id) => void;

		/**
		 * Removes multiple entities from the state by their IDs.
		 * No-op for IDs that don't exist.
		 *
		 * @performance
		 * - O(n) where n is the number of IDs
		 * - Single atomic update
		 * - Batches all removals
		 *
		 * @example
		 * ```typescript
		 * actions.removeMany(['1', '2']); // Removes users with ids '1' and '2'
		 * ```
		 */
		readonly removeMany: (ids: ReadonlyArray<Id>) => void;

		/**
		 * Removes all entities from the state.
		 * Resets the state to its initial empty state.
		 *
		 * @performance O(1) operation - simply resets to empty state
		 *
		 * @example
		 * ```typescript
		 * actions.removeAll(); // Clears all entities
		 * ```
		 */
		readonly removeAll: () => void;

		/**
		 * Updates a single entity by applying partial changes.
		 * No-op if the entity doesn't exist.
		 *
		 * @performance
		 * - O(1) operation
		 * - Preserves reference equality for unchanged fields
		 *
		 * @example
		 * ```typescript
		 * actions.updateOne('1', { name: 'Alice 2.0' }); // Only updates name
		 * ```
		 */
		readonly updateOne: (id: Id, changes: Partial<T>) => void;

		/**
		 * Updates multiple entities by applying partial changes.
		 * No-op for entities that don't exist.
		 *
		 * @performance
		 * - O(n) where n is the number of updates
		 * - Single atomic update
		 * - Batches all changes
		 * - Preserves reference equality for unchanged entities
		 *
		 * @example
		 * ```typescript
		 * actions.updateMany([
		 *   { id: '1', changes: { name: 'Alice 2.0' } },
		 *   { id: '2', changes: { name: 'Bob 2.0' } }
		 * ]);
		 * ```
		 */
		readonly updateMany: (
			updates: ReadonlyArray<{
				readonly id: Id;
				readonly changes: Partial<T>;
			}>,
		) => void;
	};
}
