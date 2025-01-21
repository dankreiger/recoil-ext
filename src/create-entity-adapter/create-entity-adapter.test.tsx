import { describe, expect, it } from "bun:test";

import { act, renderHook } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { createEntityAdapter } from "./create-entity-adapter";
// If using React 18, see also '@testing-library/react' to use its renderHook

// Define a test entity type
interface User {
	id: string; // We'll match the "idKey"
	name: string;
	createdAt: number;
}

describe("createEntityAdapter", () => {
	describe("with default idKey", () => {
		it("should add, update, and remove entities", () => {
			// Create an adapter with a custom sort, for example
			const userAdapter = createEntityAdapter<User, "id">({
				key: "UserTestAtom",
				idKey: "id",
				// We'll sort by 'createdAt' descending
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			// Render a hook that uses:
			// - useAllEntities: read all user entities
			// - createUseEntityActions: get a set of actions (addOne, removeOne, etc.)
			const { result } = renderHook(
				() => {
					const allUsers = userAdapter.useAllEntities();
					const actions = userAdapter.createUseEntityActions();
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
		it("should work with 'slug' as the ID key", () => {
			// Create an adapter that uses 'slug' instead of 'id'
			const bookAdapter = createEntityAdapter<Book, "slug">({
				key: "BookTestAtom",
				idKey: "slug",
				// Example: sort by createdAt descending
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			// Render a hook that uses:
			// - useAllEntities: read all book entities
			// - createUseEntityActions: get actions (addOne, removeOne, etc.)
			const { result } = renderHook(
				() => {
					const allBooks = bookAdapter.useAllEntities();
					const actions = bookAdapter.createUseEntityActions();
					return { allBooks, actions };
				},
				{ wrapper: RecoilRoot },
			);

			// Initially, there should be no books
			expect(result.current.allBooks).toHaveLength(0);

			// Add one book
			act(() => {
				result.current.actions.addOne({
					slug: "book-1",
					title: "Recoil with Custom Slug",
					createdAt: 1000,
				});
			});
			expect(result.current.allBooks).toHaveLength(1);
			expect(result.current.allBooks[0].title).toBe("Recoil with Custom Slug");

			// Add another book with a newer timestamp (should appear first after sorting)
			act(() => {
				result.current.actions.addOne({
					slug: "book-2",
					title: "Newer Book",
					createdAt: 2000,
				});
			});
			expect(result.current.allBooks).toHaveLength(2);

			// Because we sort descending by createdAt, "Newer Book" should come first
			expect(result.current.allBooks[0].title).toBe("Newer Book");

			expect(result.current.allBooks[1].title).toBe("Recoil with Custom Slug");

			// Update book-1's title
			act(() => {
				result.current.actions.updateOne("book-1", {
					title: "Updated Recoil Book",
				});
			});
			expect(result.current.allBooks[1].title).toBe("Updated Recoil Book");

			// Remove book-2
			act(() => {
				result.current.actions.removeOne("book-2");
			});
			expect(result.current.allBooks).toHaveLength(1);
			expect(result.current.allBooks[0].slug).toBe("book-1");
		});
	});

	describe("bulk operations", () => {
		it("should handle adding multiple entities at once", () => {
			const userAdapter = createEntityAdapter<User, "id">({
				key: "BulkUserTestAtom",
				idKey: "id",
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			const { result } = renderHook(
				() => {
					const allUsers = userAdapter.useAllEntities();
					const actions = userAdapter.createUseEntityActions();
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
			const userAdapter = createEntityAdapter<User, "id">({
				key: "BulkUpdateTestAtom",
				idKey: "id",
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.createUseEntityActions(),
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
			const userAdapter = createEntityAdapter<User, "id">({
				key: "ErrorTestAtom",
				idKey: "id",
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.createUseEntityActions(),
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
			const userAdapter = createEntityAdapter<User, "id">({
				key: "SelectionTestAtom",
				idKey: "id",
				sortComparer: (a, b) => b.createdAt - a.createdAt,
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.createUseEntityActions(),
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
			const userAdapter = createEntityAdapter<User, "id">({
				key: "EdgeCaseTestAtom",
				idKey: "id",
			});

			const { result } = renderHook(
				() => ({
					allUsers: userAdapter.useAllEntities(),
					actions: userAdapter.createUseEntityActions(),
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
});
