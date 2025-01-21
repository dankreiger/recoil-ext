import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react";
import { RecoilRoot, atom } from "recoil";
import type { EntityState } from "../..";
import { createUseOneEntity } from "./create-use-one-entity.hooks";

interface TestEntity extends Record<string, unknown> {
	readonly id: number;
	readonly name: string;
}

describe("createUseOneEntity", () => {
	const initialState = {
		ids: [1, 2, 3],
		entities: {
			1: { id: 1, name: "Alpha" },
			2: { id: 2, name: "Beta" },
			3: { id: 3, name: "Gamma" },
		},
	} as const satisfies EntityState<TestEntity>;

	const testAtom = atom<EntityState<TestEntity>>({
		key: "testEntities_test",
		default: initialState,
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<RecoilRoot>{children}</RecoilRoot>
	);

	it("should return entity by id", () => {
		const { result } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test", testAtom);
				return getEntity(2);
			},
			{ wrapper },
		);

		expect(result.current).toEqual({ id: 2, name: "Beta" });
	});

	it("should return undefined for non-existent id", () => {
		const { result } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test2", testAtom);
				return getEntity(999);
			},
			{ wrapper },
		);

		expect(result.current).toBeUndefined();
	});

	it("should handle empty state", () => {
		const emptyState = {
			ids: [],
			entities: {},
		} as const satisfies EntityState<TestEntity>;

		const emptyAtom = atom<EntityState<TestEntity>>({
			key: "emptyEntities_test",
			default: emptyState,
		});

		const { result } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test3", emptyAtom);
				return getEntity(1);
			},
			{ wrapper },
		);

		expect(result.current).toBeUndefined();
	});

	it("should return the same reference for the same id", () => {
		const { result: result1 } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test4", testAtom);
				return getEntity(1);
			},
			{ wrapper },
		);

		const { result: result2 } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test5", testAtom);
				return getEntity(1);
			},
			{ wrapper },
		);

		const entity1 = result1.current;
		const entity2 = result2.current;
		expect(entity1).toBeDefined();
		expect(entity2).toBeDefined();
		expect(entity1 as TestEntity).toEqual(entity2 as TestEntity);
	});

	it("should handle different key names", () => {
		const { result: result1 } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test6", testAtom);
				return getEntity(1);
			},
			{ wrapper },
		);

		const { result: result2 } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test7", testAtom);
				return getEntity(1);
			},
			{ wrapper },
		);

		const entity1 = result1.current;
		const entity2 = result2.current;
		expect(entity1).toBeDefined();
		expect(entity2).toBeDefined();
		expect(entity1 as TestEntity).toEqual(entity2 as TestEntity);
	});

	it("should work with string ids", () => {
		interface StringIdEntity extends Record<string, unknown> {
			readonly id: string;
			readonly value: number;
		}

		const stringIdState = {
			ids: ["a", "b", "c"],
			entities: {
				a: { id: "a", value: 1 },
				b: { id: "b", value: 2 },
				c: { id: "c", value: 3 },
			},
		} as const satisfies EntityState<StringIdEntity>;

		const stringIdAtom = atom<EntityState<StringIdEntity>>({
			key: "stringIdEntities_test",
			default: stringIdState,
		});

		const { result } = renderHook(
			() => {
				const getEntity = createUseOneEntity("test_test8", stringIdAtom);
				return getEntity("b");
			},
			{ wrapper },
		);

		const entity = result.current;
		expect(entity).toBeDefined();
		expect(entity as StringIdEntity).toEqual({ id: "b", value: 2 });
	});
});
