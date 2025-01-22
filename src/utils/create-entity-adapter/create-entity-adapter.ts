import { atom, useRecoilValue } from "recoil";
import { idbEffect } from "../../effects";
import type { EntityAdapter } from "./internal";
import {
	createUseAllEntities,
	createUseEntityActions,
	createUseOneEntity,
	normalize,
} from "./internal";

/**
 * Creates an "Entity Adapter" for managing normalized state in Recoil.
 * The adapter provides a standardized way to manage collections of entities with CRUD operations.
 * It normalizes the data for efficient lookups and maintains consistent sorting (if a `sortComparer` is provided).
 *
 * @template T - The entity type that must be an object.
 *
 * @param options - Configuration options for the entity adapter
 * @param options.key - A unique string identifier for the Recoil atom.
 * @param options.idKey - The property name on `T` that contains the unique identifier.
 * @param options.initialState - An optional initial set of entities (either a single entity or an array of entities).
 * @param options.sortComparer - An optional comparison function used whenever entities are retrieved
 * or modified, ensuring consistent ordering in the returned arrays.
 *
 * @returns An `EntityAdapter` object with the following properties:
 *
 * - **`useInitialState`**: Returns the normalized initial state (does not require a React component).
 * - **`useCurrentState`**: A hook that returns the latest normalized state from Recoil.
 * - **`useAllEntities`**: A hook to retrieve all entities in sorted order (if a `sortComparer` is present).
 * - **`useOneEntity`**: A hook to retrieve a single entity by ID.
 * - **`useEntityActions`**: A hook providing CRUD operations such as `addOne`, `addMany`, `updateOne`, etc.
 *
 * @example
 * ```tsx
 * interface User {
 *   readonly id: number;
 *   readonly name: string;
 *   readonly age: number;
 * }
 *
 * const userAdapter = createEntityAdapter<User>({
 *   key: 'users',
 *   idKey: 'id',
 *   initialState: [
 *     { id: 1, name: 'John', age: 30 },
 *     { id: 2, name: 'Jane', age: 25 }
 *   ],
 *   sortComparer: (a, b) => a.age - b.age,
 * });
 *
 * function UserList() {
 *   const users = userAdapter.useAllEntities();
 *   const user = userAdapter.useOneEntity(1);
 *   const { addOne, updateOne, removeOne } = userAdapter.useEntityActions();
 *
 *   const handleAddUser = () => {
 *     // Safely add a new user
 *     addOne({ id: 3, name: 'Alice', age: 28 });
 *   };
 *
 *   const handleUpdateUser = () => {
 *     // Update the user with id=1
 *     updateOne({ id: 1, changes: { age: 31 } });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleAddUser}>Add User</button>
 *       {users.map(user => (
 *         <div key={user.id}>
 *           {user.name} ({user.age})
 *           <button onClick={() => removeOne(user.id)}>Delete</button>
 *           <button onClick={handleUpdateUser}>Update Age</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function createEntityAdapter<T extends object>(options: {
	readonly key: string;
	readonly idKey: keyof T;
	readonly initialState?: ReadonlyArray<T> | T;
	readonly sortComparer?: (a: T, b: T) => number;
	readonly persistance?: {
		readonly cleanupPredicate?: (value: T, key: IDBValidKey) => boolean;
	};
}): EntityAdapter<T> {
	const {
		key,
		idKey,
		sortComparer,
		initialState: inputInitialState,
		persistance,
	} = options;

	// Ensure we handle both a single object or an array of objects
	const initialStateArray = [inputInitialState]
		.flat() // Flatten in case it's an array
		.filter(Boolean) as ReadonlyArray<T>; // Filter out any non-truthy values

	// Normalize data for efficient lookups
	const initialEntityState = normalize(initialStateArray, idKey, sortComparer);

	// Recoil atom to store normalized entity state
	const entityAtom = atom({
		key: `${key}_EntityAdapter`,
		default: initialEntityState,
		effects: persistance?.cleanupPredicate
			? [idbEffect({ dbName: key, storeName: key, key })]
			: [],
	});

	return {
		/**
		 * Returns the normalized initial state object.
		 * Useful if you need access to the "raw" normalized structure
		 * outside of a React component.
		 */
		useInitialState: () => initialEntityState,

		/**
		 * Hook to retrieve the current (latest) normalized state from Recoil.
		 * This must be called within a React component or custom hook.
		 */
		useCurrentState: () => useRecoilValue(entityAtom),

		/**
		 * Hook to retrieve all entities, returned in sorted order
		 * if a `sortComparer` is provided.
		 */
		useAllEntities: () => createUseAllEntities(entityAtom),

		/**
		 * Hook to retrieve a single entity by ID, or `undefined` if not found.
		 */
		useOneEntity: createUseOneEntity(key, entityAtom),

		/**
		 * Hook providing CRUD operations (e.g., `addOne`, `addMany`, `updateOne`, etc.)
		 * that update the normalized state.
		 */
		useEntityActions: createUseEntityActions(entityAtom, idKey, sortComparer),
	} as const satisfies EntityAdapter<T>;
}
