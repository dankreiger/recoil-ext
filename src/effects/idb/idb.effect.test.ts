import { beforeEach, describe, expect, it, jest, spyOn } from "bun:test";
import type { RecoilState, StoreID } from "recoil";
import { idbEffect } from "./idb.effect";
import type { IndexedDBEffectOptions } from "./internal";

// Declare global IDB interface
declare global {
	var idb: IDBFactory;
}

// More specific types for our IDB mocks
type MockIDBEventTarget<T> = {
	readonly result: T;
};

type MockIDBEvent<T> = {
	readonly target: MockIDBEventTarget<T>;
};

type MockIDBRequest<T> = {
	onupgradeneeded: ((event: MockIDBEvent<IDBDatabase>) => void) | null;
	onsuccess: ((event: MockIDBEvent<T>) => void) | null;
	onerror: ((event: MockIDBEvent<T>) => void) | null;
	readonly result: T;
	readonly error?: Error;
};

interface EffectParams {
	readonly setSelf: (value: unknown) => void;
	readonly onSet: (callback: (newValue: unknown) => void) => void;
	readonly trigger: "get" | "set";
}

// Create a mock RecoilState
const mockRecoilState: RecoilState<unknown> = {
	key: "testKey",
	__tag: ["RecoilState"] as const,
	__cTag: jest.fn(),
	toJSON: jest.fn(),
};

describe("idbEffect", () => {
	const initMockEffect = (options: IndexedDBEffectOptions) => {
		const effect = idbEffect(options);
		return effect({
			setSelf: jest.fn(),
			onSet: jest.fn(),
			trigger: "get",
			node: {
				key: "testKey",
				__tag: ["RecoilState"] as const,
				__cTag: jest.fn(),
				toJSON: jest.fn(),
			},
			storeID: 1 as unknown as StoreID,
			getLoadable: jest.fn(),
			resetSelf: jest.fn(),
			getPromise: jest.fn(),
			getInfo_UNSTABLE: jest.fn(),
		});
	};

	// Mock IDB setup with proper types
	const mockGet = jest.fn<(args: [string]) => MockIDBRequest<unknown>>();
	const mockPut =
		jest.fn<(args: [unknown, string]) => MockIDBRequest<undefined>>();

	const mockObjectStore = {
		get: mockGet,
		put: mockPut,
	} as unknown as IDBObjectStore;

	const mockTransaction = {
		objectStore: jest.fn().mockReturnValue(mockObjectStore),
	} as unknown as IDBTransaction;

	const mockDB = {
		transaction: jest.fn().mockReturnValue(mockTransaction),
		objectStoreNames: {
			contains: jest.fn().mockReturnValue(false),
		} as unknown as DOMStringList,
		createObjectStore: jest.fn().mockReturnValue(mockObjectStore),
	} as unknown as IDBDatabase;

	let idb: IDBFactory;

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup mock get/put behavior with stored value handling
		let storedValue: unknown = undefined;

		mockGet.mockImplementation(() => {
			const request: MockIDBRequest<unknown> = {
				onupgradeneeded: null,
				onsuccess: null,
				onerror: null,
				result: storedValue,
			};

			Promise.resolve().then(() => {
				if (request.onsuccess) {
					request.onsuccess({ target: { result: storedValue } });
				}
			});

			return request;
		});

		mockPut.mockImplementation((args) => {
			storedValue = args[0];
			const request: MockIDBRequest<undefined> = {
				onupgradeneeded: null,
				onsuccess: null,
				onerror: null,
				result: undefined,
			};

			Promise.resolve().then(() => {
				if (request.onsuccess) {
					request.onsuccess({ target: { result: undefined } });
				}
			});

			return request;
		});

		const mockIDBOpen = jest.fn();
		const mockIndexedDB = {
			open: mockIDBOpen,
		} as unknown as IDBFactory;

		global.indexedDB = mockIndexedDB;
		global.idb = mockIndexedDB;

		mockIDBOpen.mockImplementation(() => {
			const request: MockIDBRequest<IDBDatabase> = {
				onupgradeneeded: null,
				onsuccess: null,
				onerror: null,
				result: mockDB,
			};

			Promise.resolve().then(() => {
				if (request.onupgradeneeded) {
					request.onupgradeneeded({ target: { result: mockDB } });
				}
				if (request.onsuccess) {
					request.onsuccess({ target: { result: mockDB } });
				}
			});

			return request;
		});

		mockDB.objectStoreNames.contains = jest.fn().mockReturnValue(true);
	});

	it("should initialize and read from idb on mount", async () => {
		const options = {
			dbName: "testDB",
			storeName: "testStore",
			key: "testKey",
		};

		const mockSetSelf = jest.fn();
		const effect = idbEffect(options);

		// Call the effect with proper params
		effect({
			setSelf: mockSetSelf,
			onSet: jest.fn(),
			trigger: "get",
			node: mockRecoilState,
			storeID: 1 as unknown as StoreID,
			getLoadable: jest.fn(),
			resetSelf: jest.fn(),
			getPromise: jest.fn(),
			getInfo_UNSTABLE: jest.fn(),
		});

		// Wait for all promises to resolve
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(global.indexedDB.open).toHaveBeenCalledWith("testDB", 1);
		expect(mockDB.transaction).toHaveBeenCalledWith(["testStore"], "readonly");
		expect(mockGet).toHaveBeenCalledWith("testKey");
	});

	it("should write to idb when atom value changes", async () => {
		const options = {
			dbName: "testDB",
			storeName: "testStore",
			key: "testKey",
		};

		const effect = idbEffect(options);
		let onSetCallback:
			| ((newValue: unknown, oldValue: unknown, isReset: boolean) => void)
			| undefined;

		effect({
			setSelf: jest.fn(),
			onSet: (cb) => {
				onSetCallback = cb;
			},
			trigger: "get",
			node: mockRecoilState,
			storeID: 1 as unknown as StoreID,
			getLoadable: jest.fn(),
			resetSelf: jest.fn(),
			getPromise: jest.fn(),
			getInfo_UNSTABLE: jest.fn(),
		});

		// Wait for initial setup
		await new Promise(process.nextTick);

		// Trigger value change
		const newValue = { test: "new value" };
		if (onSetCallback) {
			onSetCallback(newValue, undefined, false);
		}

		// Wait for update to process
		await new Promise(process.nextTick);

		expect(mockDB.transaction).toHaveBeenCalledWith(["testStore"], "readwrite");
		expect(mockPut).toHaveBeenCalledWith(newValue, "testKey");
	});

	it("should handle errors when reading from idb", async () => {
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
		const options = {
			dbName: "testDB",
			storeName: "testStore",
			key: "testKey",
		};

		// Mock a failed get request with the correct error structure
		mockGet.mockImplementationOnce(() => {
			const error = new Error("Test error");
			const request = {
				onupgradeneeded: null,
				onsuccess: null,
				onerror: null,
				result: undefined,
				error,
			} as MockIDBRequest<unknown>;

			// Trigger error callback on next tick
			setTimeout(() => {
				if (request.onerror) {
					request.onerror({
						target: {
							result: undefined,
							error,
						},
					} as MockIDBEvent<unknown>);
				}
			}, 0);

			return request;
		});

		initMockEffect(options);

		// Wait for all promises to resolve
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(consoleSpy).toHaveBeenCalledWith(
			"Failed to read from IDB",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});
});
