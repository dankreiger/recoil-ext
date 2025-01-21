import { beforeEach, describe, expect, it } from "bun:test";
import type { EntityState } from "../types";
import {
	addManyUpdater,
	addOneUpdater,
	removeOneUpdater,
	setAllUpdater,
	updateOneUpdater,
} from "./entity-updaters";

interface TestEntity extends Record<string, unknown> {
	readonly id: number;
	readonly name: string;
	readonly value?: number;
}

describe("Entity Updaters", () => {
	const selectId = (entity: TestEntity) => entity.id;
	let initialState: EntityState<TestEntity>;

	beforeEach(() => {
		initialState = {
			ids: [1, 2],
			entities: {
				1: { id: 1, name: "Entity 1" },
				2: { id: 2, name: "Entity 2" },
			},
		};
	});

	describe("addOneUpdater", () => {
		it("should add a new entity to the state", () => {
			const newEntity: TestEntity = { id: 3, name: "Entity 3" };
			const result = addOneUpdater(initialState, newEntity, selectId);

			expect(result.ids).toEqual([1, 2, 3]);
			expect(result.entities[3]).toEqual(newEntity);
		});

		it("should not modify state if entity already exists", () => {
			const existingEntity: TestEntity = { id: 1, name: "Modified Entity 1" };
			const result = addOneUpdater(initialState, existingEntity, selectId);

			expect(result).toBe(initialState);
		});
	});

	describe("addManyUpdater", () => {
		it("should add multiple new entities", () => {
			const newEntities: TestEntity[] = [
				{ id: 3, name: "Entity 3" },
				{ id: 4, name: "Entity 4" },
			];
			const result = addManyUpdater(initialState, newEntities, selectId);

			expect(result.ids).toEqual([1, 2, 3, 4]);
			expect(result.entities[3]).toEqual(newEntities[0]);
			expect(result.entities[4]).toEqual(newEntities[1]);
		});

		it("should return same state if no entities provided", () => {
			const result = addManyUpdater(initialState, [], selectId);
			expect(result).toBe(initialState);
		});
	});

	describe("updateOneUpdater", () => {
		it("should update an existing entity", () => {
			const update = { id: 1, changes: { name: "Updated Entity 1" } };
			const result = updateOneUpdater(initialState, update);

			expect(result.entities[1].name).toBe("Updated Entity 1");
			expect(result.ids).toEqual(initialState.ids);
		});

		it("should not modify state if entity does not exist", () => {
			const update = { id: 999, changes: { name: "Non-existent" } };
			const result = updateOneUpdater(initialState, update);

			expect(result).toBe(initialState);
		});
	});

	describe("removeOneUpdater", () => {
		it("should remove an existing entity", () => {
			const result = removeOneUpdater(initialState, 1);

			expect(result.ids).toEqual([2]);
			expect(result.entities[1]).toBeUndefined();
		});

		it("should not modify state if entity does not exist", () => {
			const result = removeOneUpdater(initialState, 999);
			expect(result).toBe(initialState);
		});
	});

	describe("setAllUpdater", () => {
		it("should replace all entities", () => {
			const newEntities: TestEntity[] = [
				{ id: 3, name: "Entity 3" },
				{ id: 4, name: "Entity 4" },
			];
			const result = setAllUpdater(initialState, newEntities, selectId);

			expect(result.ids).toEqual([3, 4]);
			expect(result.entities[3]).toEqual(newEntities[0]);
			expect(result.entities[4]).toEqual(newEntities[1]);
		});
	});

	describe("sorting behavior", () => {
		it("should sort entities when sortComparer is provided", () => {
			const sortComparer = (a: TestEntity, b: TestEntity) =>
				a.name.localeCompare(b.name);
			const newEntity: TestEntity = { id: 3, name: "Aardvark" };

			const result = addOneUpdater(
				initialState,
				newEntity,
				selectId,
				sortComparer,
			);

			expect(result.ids[0]).toBe(3); // Aardvark should be first
		});
	});
});
