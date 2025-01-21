export interface IndexedDBEffectOptions {
	/** Name of the IndexedDB database (e.g. "MyAppDB") */
	readonly dbName: string;
	/** Name of the object store (e.g. "MyStore") */
	readonly storeName: string;
	/** Key within that store to read/write (e.g. "my-atom-key") */
	readonly key: string;
}
