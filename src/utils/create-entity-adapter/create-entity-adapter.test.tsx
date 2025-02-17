import { describe, expect, it } from "bun:test";

import { act, renderHook } from "@testing-library/react";
import { RecoilRoot, atom } from "recoil";
import { createEntityAdapter } from "./create-entity-adapter";
import type { EntityState } from "./internal";

// Define a test entity type
interface User {
	readonly id: string;
	readonly name: string;
	readonly createdAt: number;
}

describe("createEntityAdapter", () => {
	describe("with default idKey", () => {
		it("should add, update, and remove entities", () => {
			// Create an adapter with a custom sort, for example
			const userAdapter = createEntityAdapter<User>({
				key: "UserTestAtom_DefaultIdKey",
				idKey: "id",
				// We'll sort by 'createdAt' descending
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			// Render a hook that uses:
			// - useAllEntities: read all user entities
			// - useEntityActions: get a set of actions (addOne, removeOne, etc.)
			const { result } = renderHook(
				() => {
					const allUsers = userAdapter.useAllEntities();
					const actions = userAdapter.useEntityActions();
					return { allUsers, actions };
				},
				{ wrapper: RecoilRoot },
			);

			// Initially, there should be no users
			expect(result.current.allUsers).toHaveLength(0);

			// Let's add one user
			act(() => {
				result.current.actions.addOne({
					id: "user1",
					name: "Alice",
					createdAt: 1000,
				});
			});
			expect(result.current.allUsers).toHaveLength(1);
			expect(result.current.allUsers[0].name).toBe("Alice");

			// Add another user with a newer timestamp (should appear before Alice after sorting)
			act(() => {
				result.current.actions.addOne({
					id: "user2",
					name: "Bob",
					createdAt: 2000,
				});
			});
			expect(result.current.allUsers).toHaveLength(2);

			// Because we sort descending by createdAt, Bob should come first
			expect(result.current.allUsers[0].name).toBe("Bob");
			expect(result.current.allUsers[1].name).toBe("Alice");

			// Update user1's name
			act(() => {
				result.current.actions.updateOne("user1", { name: "Alice Updated" });
			});
			expect(result.current.allUsers[1].name).toBe("Alice Updated");

			// Remove user2
			act(() => {
				result.current.actions.removeOne("user2");
			});
			expect(result.current.allUsers).toHaveLength(1);
			expect(result.current.allUsers[0].id).toBe("user1");
		});
	});

	describe("with a custom ID property", () => {
		interface Book {
			slug: string;
			title: string;
			createdAt: number;
		}

		const bookAtom = atom<EntityState<Book>>({
			key: "BookTestAtom_CustomIdKey",
		});

		it("should work with 'slug' as the ID key", () => {
			// Create an adapter that uses 'slug' instead of 'id'
			const bookAdapter = createEntityAdapter<Book>({
				key: "BookTestAtom_CustomIdKey",
				idKey: "slug",
				initialState: [
					{ slug: "book-1", title: "Recoil with Custom Slug", createdAt: 1000 },
					{ slug: "book-2", title: "Newer Book", createdAt: 2000 },
				],
				// Example: sort by createdAt descending
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			// Render a hook that uses:
			// - useAllEntities: read all book entities
			// - useEntityActions: get actions (addOne, removeOne, etc.)
			const { result } = renderHook(
				() => {
					const allBooks = bookAdapter.useAllEntities();
					const actions = bookAdapter.useEntityActions();
					return { allBooks, actions };
				},
				{ wrapper: RecoilRoot },
			);

			// Initially, there are 2 books
			expect(result.current.allBooks).toHaveLength(2);

			// Add one book
			act(() => {
				result.current.actions.addOne({
					slug: "book-3",
					title: "Recoil is a bit old",
					createdAt: 3000,
				});
			});
			expect(result.current.allBooks).toHaveLength(3);
			expect(result.current.allBooks[0].title).toBe("Recoil is a bit old");

			// Add another book with a newer timestamp (should appear first after sorting)
			act(() => {
				result.current.actions.addOne({
					slug: "book-5",
					title: "Wauwau",
					createdAt: 500,
				});
			});
			expect(result.current.allBooks).toHaveLength(4);

			// Because we sort descending by createdAt, "Newer Book" should come first
			expect(result.current.allBooks[0].title).toBe("Recoil is a bit old");

			expect(result.current.allBooks[1].title).toBe("Newer Book");

			// Update book-1's title
			act(() => {
				result.current.actions.updateOne("book-6", {
					slug: "book-6",
					title: "Recoil Book",
				});
			});
			expect(result.current.allBooks[1].title).toBe("Newer Book");

			// Remove book-2

			expect(result.current.allBooks).toEqual([
				{
					createdAt: 3000,
					slug: "book-3",
					title: "Recoil is a bit old",
				},
				{
					createdAt: 2000,
					slug: "book-2",
					title: "Newer Book",
				},
				{
					createdAt: 1000,
					slug: "book-1",
					title: "Recoil with Custom Slug",
				},
				{
					createdAt: 500,
					slug: "book-5",
					title: "Wauwau",
				},
			]);
			act(() => {
				result.current.actions.removeOne("book-2");
			});
			expect(result.current.allBooks).toHaveLength(3);
			expect(result.current.allBooks[0].slug).toBe("book-3");
		});
	});

	describe("bulk operations", () => {
		it("should handle adding multiple entities at once", () => {
			const userAdapter = createEntityAdapter<User>({
				key: "BulkUserTestAtom_BulkOps",
				idKey: "id",
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			const { result } = renderHook(
				() => {
					const allUsers = userAdapter.useAllEntities();
					const actions = userAdapter.useEntityActions();
					return { allUsers, actions };
				},
				{ wrapper: RecoilRoot },
			);

			act(() => {
				result.current.actions.addMany([
					{ id: "user1", name: "Alice", createdAt: 1000 },
					{ id: "user2", name: "Bob", createdAt: 2000 },
					{ id: "user3", name: "Charlie", createdAt: 3000 },
				]);
			});

			expect(result.current.allUsers).toHaveLength(3);
			expect(result.current.allUsers[0].name).toBe("Charlie");
		});

		it("should handle updating multiple entities", () => {
			const userAdapter = createEntityAdapter<User>({
				key: "BulkUpdateTestAtom_BulkOps",
				idKey: "id",
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.useEntityActions(),
				}),
				{ wrapper: RecoilRoot },
			);

			// Add initial users
			act(() => {
				result.current.actions.addMany([
					{ id: "user1", name: "Alice", createdAt: 1000 },
					{ id: "user2", name: "Bob", createdAt: 2000 },
				]);
			});

			// Update multiple users at once
			act(() => {
				result.current.actions.updateMany([
					{ id: "user1", changes: { name: "Alice Updated" } },
					{ id: "user2", changes: { name: "Bob Updated" } },
				]);
			});

			// The order should be maintained by createdAt (user2 has createdAt: 2000, user1 has createdAt: 1000)
			expect(result.current.allUsers[0].name).toBe("Bob Updated");
			expect(result.current.allUsers[1].name).toBe("Alice Updated");
		});
	});

	describe("error handling", () => {
		it("should handle attempting to update non-existent entities", () => {
			const userAdapter = createEntityAdapter<User>({
				key: "ErrorTestAtom_ErrorHandling",
				idKey: "id",
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.useEntityActions(),
				}),
				{ wrapper: RecoilRoot },
			);

			// Should not throw when updating non-existent entity
			act(() => {
				result.current.actions.updateOne("nonexistent", { name: "New Name" });
			});

			expect(result.current.allUsers).toHaveLength(0);
		});
	});

	describe("entity selection", () => {
		it("should select entities by predicate", () => {
			const userAdapter = createEntityAdapter<User>({
				key: "SelectionTestAtom_EntitySelection",
				idKey: "id",
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.useEntityActions(),
				}),
				{ wrapper: RecoilRoot },
			);

			act(() => {
				result.current.actions.addMany([
					{ id: "user1", name: "Alice", createdAt: 1000 },
					{ id: "user2", name: "Bob", createdAt: 2000 },
					{ id: "user3", name: "Charlie", createdAt: 3000 },
				]);
			});

			const recentUsers = result.current.allUsers.filter(
				(user) => user.createdAt > 1500,
			);
			expect(recentUsers).toHaveLength(2);
			expect(recentUsers[0].name).toBe("Charlie");
		});
	});

	describe("edge cases", () => {
		it("should handle empty updates", () => {
			const userAdapter = createEntityAdapter<User>({
				key: "EdgeCaseTestAtom_EdgeCases",
				idKey: "id",
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.useEntityActions(),
				}),
				{ wrapper: RecoilRoot },
			);

			act(() => {
				result.current.actions.addOne({
					id: "user1",
					name: "Alice",
					createdAt: 1000,
				});
			});

			// Update with empty object should not change the entity
			act(() => {
				result.current.actions.updateOne("user1", {});
			});

			expect(result.current.allUsers[0].name).toBe("Alice");
		});
	});

	describe("initial state", () => {
		it("should normalize an array of entities", () => {
			const users = [
				{ id: "user1", name: "Alice", createdAt: 1000 },
				{ id: "user2", name: "Bob", createdAt: 2000 },
			] as const;

			const userAdapter = createEntityAdapter<User>({
				key: "NormalizeTestAtom",
				idKey: "id",
				initialState: users,
			});

			const { result } = renderHook(() => userAdapter.useAllEntities(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual(users);
		});

		it("should handle empty arrays", () => {
			const userAdapter = createEntityAdapter<User>({
				key: "EmptyNormalizeTestAtom",
				idKey: "id",
				initialState: [],
			});

			expect(userAdapter.useInitialState()).toEqual({
				ids: [],
				entities: {},
			});

			const { result } = renderHook(() => userAdapter.useAllEntities(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual([]);
		});

		it("should sort entities if sortComparer is provided", () => {
			const users = [
				{ id: "user1", name: "Alice", createdAt: 1000 },
				{ id: "user2", name: "Bob", createdAt: 2000 },
			] as const;
			const userAdapter = createEntityAdapter<User>({
				key: "SortedNormalizeTestAtom",
				idKey: "id",

				initialState: users,
				sortComparer: (a, b) => b.createdAt - a.createdAt, // reverse (highest first)
			});

			expect(userAdapter.useInitialState()).toEqual({
				ids: ["user2", "user1"],
				entities: {
					user2: { id: "user2", name: "Bob", createdAt: 2000 },
					user1: { id: "user1", name: "Alice", createdAt: 1000 },
				},
			});

			const { result } = renderHook(() => userAdapter.useAllEntities(), {
				wrapper: RecoilRoot,
			});

			// higher createdAt first
			expect(result.current).toEqual([
				{ id: "user2", name: "Bob", createdAt: 2000 },
				{ id: "user1", name: "Alice", createdAt: 1000 },
			]);

			const userAdapter1 = createEntityAdapter<User>({
				key: "SortedNormalizeTestAtom1",
				idKey: "id",

				initialState: users,
				sortComparer: (a, b) => a.createdAt - b.createdAt, // reverse (lowest first)
			});

			// lower createdAt first
			expect(userAdapter1.useInitialState()).toEqual({
				ids: ["user1", "user2"],
				entities: {
					user1: { id: "user1", name: "Alice", createdAt: 1000 },
					user2: { id: "user2", name: "Bob", createdAt: 2000 },
				},
			});
		});

		it("should use custom selectId if provided", () => {
			const users = [{ id: "user1", name: "Alice", createdAt: 1000 }] as const;
			const userAdapter = createEntityAdapter<User>({
				key: "CustomIdNormalizeTestAtom",
				idKey: "id",
				initialState: users,
			});

			const { result } = renderHook(() => userAdapter.useAllEntities(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual(users);
		});

		it("should normalize with different idKey", () => {
			const users = [
				{ id: "user1", name: "Alice", createdAt: 1000 },
				{ id: "user2", name: "Bob", createdAt: 2000 },
			] as const;

			const userAdapter = createEntityAdapter<User>({
				key: "NormalizeTestAtom1",
				idKey: "name",
				initialState: users,
			});

			const { result } = renderHook(() => userAdapter.useAllEntities(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual(users);
		});
	});

	describe("current state", () => {
		it("should return the current state", () => {
			const users = [
				{ id: "user1", name: "Alice", createdAt: 1000 },
				{ id: "user2", name: "Bob", createdAt: 2000 },
			] as const;

			const userAdapter = createEntityAdapter<User>({
				key: "CurrentStateTestAtom",
				idKey: "id",
				initialState: users,
			});

			const { result } = renderHook(() => userAdapter.useCurrentState(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual({
				ids: ["user1", "user2"],
				entities: {
					user1: { id: "user1", name: "Alice", createdAt: 1000 },
					user2: { id: "user2", name: "Bob", createdAt: 2000 },
				},
			});
		});

		it("should return the current state with a sorting specified", () => {
			const users = [
				{ id: "user1", name: "Alice", createdAt: 1000 },
				{ id: "user2", name: "Bob", createdAt: 2000 },
			] as const;

			const userAdapter = createEntityAdapter<User>({
				key: "CurrentStateTestAtom",
				idKey: "id",
				initialState: users,
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			const { result } = renderHook(() => userAdapter.useCurrentState(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual({
				ids: ["user2", "user1"],
				entities: {
					user2: { id: "user2", name: "Bob", createdAt: 2000 },
					user1: { id: "user1", name: "Alice", createdAt: 1000 },
				},
			});
		});

		it("should return the current state with a custom selectId", () => {
			const users = [
				{ id: "user1", name: "Alice", createdAt: 1000 },
				{ id: "user2", name: "Bob", createdAt: 2000 },
			] as const;
			const userAdapter = createEntityAdapter<User>({
				key: "CurrentStateTestAtom1",
				idKey: "name",
				initialState: users,
			});

			const { result } = renderHook(() => userAdapter.useCurrentState(), {
				wrapper: RecoilRoot,
			});

			expect(result.current).toEqual({
				ids: ["Alice", "Bob"],
				entities: {
					Alice: { id: "user1", name: "Alice", createdAt: 1000 },
					Bob: { id: "user2", name: "Bob", createdAt: 2000 },
				},
			});
		});
	});
});
