import { describe, expect, it } from "bun:test";
import { normalize } from "./normalize.utils";

describe("normalize", () => {
	interface TestEntity {
		readonly id: number;
		readonly name: string;
	}

	const testEntities: readonly TestEntity[] = [
		{ id: 1, name: "Entity 1" },
		{ id: 2, name: "Entity 2" },
		{ id: 3, name: "Entity 3" },
	];

	it("should normalize an array of entities into an EntityState", () => {
		const result = normalize(testEntities, (entity) => entity.id);

		expect(result).toEqual({
			ids: [1, 2, 3],
			entities: {
				1: { id: 1, name: "Entity 1" },
				2: { id: 2, name: "Entity 2" },
				3: { id: 3, name: "Entity 3" },
			},
		});
	});

	it("should work with string IDs", () => {
		interface StringIdEntity {
			readonly id: string;
			readonly value: number;
		}

		const stringIdEntities: readonly StringIdEntity[] = [
			{ id: "a", value: 1 },
			{ id: "b", value: 2 },
		];

		const result = normalize(stringIdEntities, (entity) => entity.id);

		expect(result).toEqual({
			ids: ["a", "b"],
			entities: {
				a: { id: "a", value: 1 },
				b: { id: "b", value: 2 },
			},
		});
	});

	it("should handle empty array input", () => {
		const result = normalize<TestEntity, number>([], (entity) => entity.id);

		expect(result).toEqual({
			ids: [],
			entities: {},
		});
	});

	it("should sort entities when sortComparer is provided", () => {
		const unsortedEntities: readonly TestEntity[] = [
			{ id: 3, name: "C" },
			{ id: 1, name: "A" },
			{ id: 2, name: "B" },
		];

		const result = normalize(
			unsortedEntities,
			(entity) => entity.id,
			(a, b) => a.name.localeCompare(b.name),
		);

		expect(result.ids).toEqual([1, 2, 3]);
		expect(Object.keys(result.entities)).toHaveLength(3);
		expect(result.entities[result.ids[0]].name).toBe("A");
		expect(result.entities[result.ids[1]].name).toBe("B");
		expect(result.entities[result.ids[2]].name).toBe("C");
	});

	it("should handle custom selectId functions", () => {
		interface ComplexEntity {
			readonly userId: number;
			readonly name: string;
		}

		const complexEntities: readonly ComplexEntity[] = [
			{ userId: 1, name: "User 1" },
			{ userId: 2, name: "User 2" },
		];

		const result = normalize(complexEntities, (entity) => entity.userId);

		expect(result).toEqual({
			ids: [1, 2],
			entities: {
				1: { userId: 1, name: "User 1" },
				2: { userId: 2, name: "User 2" },
			},
		});
	});
});
