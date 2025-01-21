import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react";
import { RecoilRoot, atom } from "recoil";
import type { EntityState } from "../..";
import { createUseAllEntities } from "./create-use-all-entities.hooks";

interface TestEntity {
	readonly id: number;
	readonly name: string;
}

describe("createUseAllEntities", () => {
	const initialState = {
		ids: [1, 2, 3],
		entities: {
			1: { id: 1, name: "Alpha" },
			2: { id: 2, name: "Beta" },
			3: { id: 3, name: "Gamma" },
		},
	} as const satisfies EntityState<TestEntity, number>;

	const testAtom = atom<EntityState<TestEntity, number>>({
		key: "testEntities",
		default: initialState,
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<RecoilRoot>{children}</RecoilRoot>
	);

	it("should return all entities in order of ids", () => {
		const hook = createUseAllEntities(testAtom);
		const { result } = renderHook(() => hook(), {
			wrapper,
		});

		expect(result.current).toEqual([
			{ id: 1, name: "Alpha" },
			{ id: 2, name: "Beta" },
			{ id: 3, name: "Gamma" },
		]);
	});

	it("should return empty array when there are no entities", () => {
		const emptyState = {
			ids: [],
			entities: {},
		} as const satisfies EntityState<TestEntity, number>;

		const emptyAtom = atom<EntityState<TestEntity, number>>({
			key: "emptyEntities",
			default: emptyState,
		});

		const hook = createUseAllEntities(emptyAtom);
		const { result } = renderHook(() => hook(), {
			wrapper,
		});

		expect(result.current).toEqual([]);
	});

	it("should handle single entity state", () => {
		const singleState = {
			ids: [1],
			entities: {
				1: { id: 1, name: "Solo" },
			},
		} as const satisfies EntityState<TestEntity, number>;

		const singleAtom = atom<EntityState<TestEntity, number>>({
			key: "singleEntity",
			default: singleState,
		});

		const hook = createUseAllEntities(singleAtom);
		const { result } = renderHook(() => hook(), {
			wrapper,
		});

		expect(result.current).toEqual([{ id: 1, name: "Solo" }]);
	});

	it("should handle non-sequential ids correctly", () => {
		const nonSequentialState = {
			ids: [10, 5, 99],
			entities: {
				10: { id: 10, name: "Ten" },
				5: { id: 5, name: "Five" },
				99: { id: 99, name: "NinetyNine" },
			},
		} as const satisfies EntityState<TestEntity, number>;

		const nonSequentialAtom = atom<EntityState<TestEntity, number>>({
			key: "nonSequentialEntities",
			default: nonSequentialState,
		});

		const hook = createUseAllEntities(nonSequentialAtom);
		const { result } = renderHook(() => hook(), {
			wrapper,
		});

		expect(result.current).toEqual([
			{ id: 10, name: "Ten" },
			{ id: 5, name: "Five" },
			{ id: 99, name: "NinetyNine" },
		]);
	});
});
