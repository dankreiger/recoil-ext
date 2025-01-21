import { beforeEach, describe, expect, it, jest } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { RecoilRoot, atom, useRecoilState } from "recoil";
import type { EntityState } from "../..";
import { createUseEntityActions } from "./create-use-entity-actions.hooks";

interface TestEntity extends Record<string, unknown> {
	readonly id: number;
	readonly name: string;
	readonly active?: boolean;
}

describe("createUseEntityActions", () => {
	const initialState: EntityState<TestEntity> = {
		ids: [],
		entities: {},
	};

	const testAtom = atom<EntityState<TestEntity>>({
		key: "testEntityState",
		default: initialState,
	});

	const selectId = (entity: TestEntity) => entity.id;
	const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
		<RecoilRoot>{children}</RecoilRoot>
	);

	const useTestState = () => {
		const [state, setState] = useRecoilState(testAtom);
		return { state, setState };
	};

	beforeEach(() => {
		// Reset atom between tests
		jest.clearAllMocks();
	});

	describe("basic operations", () => {
		it("should provide all entity actions", () => {
			const { result } = renderHook(
				() => createUseEntityActions(testAtom, selectId)(),
				{ wrapper },
			);

			expect(result.current).toHaveProperty("addOne");
			expect(result.current).toHaveProperty("addMany");
			expect(result.current).toHaveProperty("upsertOne");
			expect(result.current).toHaveProperty("setAll");
			expect(result.current).toHaveProperty("updateOne");
			expect(result.current).toHaveProperty("updateMany");
			expect(result.current).toHaveProperty("removeOne");
			expect(result.current).toHaveProperty("removeMany");
			expect(result.current).toHaveProperty("removeAll");
		});
	});

	describe("addOne", () => {
		it("should add a single entity to empty state", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entity: TestEntity = { id: 1, name: "Test Entity" };

			act(() => {
				result.current.actions.addOne(entity);
			});

			expect(result.current.state.ids).toEqual([1]);
			expect(result.current.state.entities[1]).toEqual(entity);
		});

		it("should preserve existing entities when adding new one", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entity1: TestEntity = { id: 1, name: "First Entity" };
			const entity2: TestEntity = { id: 2, name: "Second Entity" };

			act(() => {
				result.current.actions.addOne(entity1);
				result.current.actions.addOne(entity2);
			});

			expect(result.current.state.ids).toEqual([1, 2]);
			expect(result.current.state.entities[1]).toEqual(entity1);
			expect(result.current.state.entities[2]).toEqual(entity2);
		});
	});

	describe("addMany", () => {
		it("should handle empty array", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			act(() => {
				result.current.actions.addMany([]);
			});

			expect(result.current.state.ids).toEqual([]);
			expect(result.current.state.entities).toEqual({});
		});

		it("should add multiple entities and maintain order", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entities: TestEntity[] = [
				{ id: 1, name: "First" },
				{ id: 2, name: "Second" },
				{ id: 3, name: "Third" },
			];

			act(() => {
				result.current.actions.addMany(entities);
			});
			expect(result.current.state.ids).toEqual([1, 2, 3]);
			for (const entity of entities) {
				expect(result.current.state.entities[entity.id]).toEqual(entity);
			}
		});
	});

	describe("sorting behavior", () => {
		it("should sort entities when sortComparer is provided", () => {
			const sortComparer = (a: TestEntity, b: TestEntity) =>
				a.name.localeCompare(b.name);

			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(
						testAtom,
						selectId,
						sortComparer,
					)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entities: TestEntity[] = [
				{ id: 1, name: "Charlie" },
				{ id: 2, name: "Alpha" },
				{ id: 3, name: "Bravo" },
			];

			act(() => {
				result.current.actions.addMany(entities);
			});

			expect(result.current.state.ids).toEqual([2, 3, 1]); // Alpha, Bravo, Charlie
		});
	});

	describe("updateOne", () => {
		it("should partially update entity", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entity: TestEntity = { id: 1, name: "Original", active: false };

			act(() => {
				result.current.actions.addOne(entity);
				result.current.actions.updateOne(1, { active: true });
			});

			expect(result.current.state.entities[1]).toEqual({
				id: 1,
				name: "Original",
				active: true,
			});
		});

		it("should ignore update for non-existent entity", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			act(() => {
				result.current.actions.updateOne(999, { name: "New Name" });
			});

			expect(result.current.state.ids).toEqual([]);
			expect(result.current.state.entities).toEqual({});
		});
	});

	describe("removeMany and removeAll", () => {
		it("should remove multiple entities", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entities: TestEntity[] = [
				{ id: 1, name: "One" },
				{ id: 2, name: "Two" },
				{ id: 3, name: "Three" },
			];

			act(() => {
				result.current.actions.addMany(entities);
			});

			act(() => {
				result.current.actions.removeMany([1, 3]);
			});

			expect(result.current.state.ids).toEqual([2]);
			expect(Object.keys(result.current.state.entities)).toEqual(["2"]);
		});

		it("should clear all entities with removeAll", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entities: TestEntity[] = [
				{ id: 1, name: "One" },
				{ id: 2, name: "Two" },
			];

			act(() => {
				result.current.actions.addMany(entities);
				result.current.actions.removeAll();
			});

			expect(result.current.state.ids).toEqual([]);
			expect(result.current.state.entities).toEqual({});
		});
	});

	describe("upsertOne", () => {
		it("should add new entity if it doesnt exist", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const entity: TestEntity = { id: 1, name: "New Entity" };

			act(() => {
				result.current.actions.upsertOne(entity);
			});

			expect(result.current.state.entities[1]).toEqual(entity);
		});

		it("should update existing entity", () => {
			const { result } = renderHook(
				() => {
					const actions = createUseEntityActions(testAtom, selectId)();
					const { state } = useTestState();
					return { actions, state };
				},
				{ wrapper },
			);

			const original: TestEntity = { id: 1, name: "Original", active: false };
			const updated: TestEntity = { id: 1, name: "Updated", active: true };

			act(() => {
				result.current.actions.addOne(original);
				result.current.actions.upsertOne(updated);
			});

			expect(result.current.state.entities[1]).toEqual(updated);
			expect(result.current.state.ids).toHaveLength(1);
			expect(result.current.state.ids).toEqual([1]);
		});
	});
});
