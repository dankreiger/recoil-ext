import type { AtomEffect } from "recoil";
import type { IndexedDBEffectOptions } from "./internal";
/**
 * Creates an AtomEffect that syncs the atom to IndexedDB.
 */
export function idbEffect<T>({
	dbName,
	storeName,
	key,
}: IndexedDBEffectOptions): AtomEffect<T> {
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
		 * Only attempt to initialize if the effect was triggered by
		 * "initial mount" (not a subsequent update).
		 */
		if (trigger === "get") {
			// Asynchronously load initial value from IndexedDB:
			readFromDB()
				.then((storedValue) => {
					if (storedValue != null) {
						// If we have something in IDB, use that as the default
						setSelf(storedValue);
					}
				})
				.catch((error) => {
					// For production, handle or log error
					console.error("Failed to read from IDB", error);
				});
		}

		// Listen for changes to the atom; write them to IndexedDB
		onSet((newValue) => {
			// Because this can be async, you might want to debounce
			// or batch calls in real usage
			writeToDB(newValue).catch((error) => {
				console.error("Failed to write to IDB", error);
			});
		});
	};
}
