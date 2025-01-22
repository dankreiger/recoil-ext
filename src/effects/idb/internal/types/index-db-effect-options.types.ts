export interface IndexedDBEffectOptions<T> {
	/**
	 * If provided, runs after opening the DB (once, at "get" trigger).
	 * Any entries that match the predicate will be removed.
	 */
	readonly cleanupPredicate?: (value: T, key: IDBValidKey) => boolean;
	/** Name of the IndexedDB database (e.g. "MyAppDB") */
	readonly dbName: string;
	/** Name of the object store (e.g. "MyStore") */
	readonly storeName: string;
	/** Key within that store to read/write (e.g. "my-atom-key") */
	readonly key: string;
}
