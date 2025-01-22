import type { AtomEffect } from "recoil";

interface IndexedDBEffectOptions<T> {
	readonly dbName: string;
	readonly storeName: string;
	readonly key: IDBValidKey;
	/**
	 * If provided, runs after opening the DB (once, at "get" trigger).
	 * Any entries that match the predicate will be removed.
	 */
	readonly cleanupPredicate?: (value: T, key: IDBValidKey) => boolean;
}

/**
 * Creates an AtomEffect that syncs the atom to IndexedDB, and can optionally
 * remove existing records in the store if they match a given predicate.
 */
export function idbEffect<T>({
	dbName,
	storeName,
	key,
	cleanupPredicate,
}: IndexedDBEffectOptions<T>): AtomEffect<T> {
	return ({ setSelf, onSet, trigger }) => {
		let db: IDBDatabase | null = null;

		/**
		 * Open the database and object store, returning a Promise
		 * that resolves once it's ready.
		 */
		function openDB(): Promise<IDBDatabase> {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(dbName, 1);

				request.onupgradeneeded = (event) => {
					const target = event.target as IDBOpenDBRequest;
					const upgradeDB = target.result;
					// Create the object store if it doesn't exist
					if (!upgradeDB.objectStoreNames.contains(storeName)) {
						upgradeDB.createObjectStore(storeName);
					}
				};

				request.onsuccess = () => {
					const database = request.result;
					resolve(database);
				};

				request.onerror = () => {
					reject(request.error);
				};
			});
		}

		/**
		 * Read the stored value for `key` from the object store.
		 */
		async function readFromDB(): Promise<T | null> {
			if (!db) {
				db = await openDB();
			}
			return new Promise((resolve, reject) => {
				if (!db) {
					reject(
						new Error("IndexedDB not initialized, state will not be persisted"),
					);
					return;
				}
				const transaction = db.transaction([storeName], "readonly");
				const store = transaction.objectStore(storeName);
				const getRequest = store.get(key);

				getRequest.onsuccess = () => {
					resolve(getRequest.result ?? null);
				};
				getRequest.onerror = () => {
					reject(getRequest.error);
				};
			});
		}

		/**
		 * Write the given value to the DB under `key`.
		 */
		async function writeToDB(value: T): Promise<void> {
			if (!db) {
				db = await openDB();
			}
			return new Promise((resolve, reject) => {
				if (!db) {
					reject(
						new Error("IndexedDB not initialized, state will not be persisted"),
					);
					return;
				}
				const transaction = db.transaction([storeName], "readwrite");
				const store = transaction.objectStore(storeName);
				const putRequest = store.put(value, key);

				putRequest.onsuccess = () => resolve();
				putRequest.onerror = () => reject(putRequest.error);
			});
		}

		/**
		 * Cleanup pass. If a `cleanupPredicate` is provided, iterate
		 * through the entire store; for each record matching the predicate,
		 * remove it.
		 */
		async function cleanupStore() {
			if (!db) {
				db = await openDB();
			}
			if (!db || !cleanupPredicate) return;
			return new Promise<void>((resolve, reject) => {
				if (!db) return reject(new Error("IndexedDB not initialized"));
				const transaction = db.transaction([storeName], "readwrite");
				const store = transaction.objectStore(storeName);
				// Open a cursor to iterate all entries
				const request = store.openCursor();
				request.onsuccess = () => {
					const cursor = request.result;
					if (cursor) {
						const value = cursor.value as T;
						if (cleanupPredicate(value, cursor.key)) {
							// Delete this record
							const deleteReq = cursor.delete();
							deleteReq.onsuccess = () => {
								cursor.continue();
							};
							deleteReq.onerror = () => {
								// If delete fails for any reason, we can either keep going or reject
								console.error("Failed to delete IDB entry", deleteReq.error);
								cursor.continue();
							};
						} else {
							cursor.continue();
						}
					} else {
						// No more entries
						resolve();
					}
				};
				request.onerror = () => {
					reject(request.error);
				};
			});
		}

		/**
		 * Only attempt to initialize if the effect was triggered by
		 * "initial mount" (not a subsequent update).
		 */
		if (trigger === "get") {
			// Asynchronously run the cleanup (if provided), then load initial value
			cleanupStore()
				.then(() => readFromDB())
				.then((storedValue) => {
					if (storedValue != null) {
						// If we have something in IDB, use that as the default
						setSelf(storedValue);
					}
				})
				.catch((error) => {
					// For production, handle or log error
					console.error("Failed during IDB init/cleanup/read", error);
				});
		}

		// Listen for changes to the atom; write them to IndexedDB
		onSet((newValue) => {
			writeToDB(newValue).catch((error) => {
				console.error("Failed to write to IDB", error);
			});
		});
	};
}
