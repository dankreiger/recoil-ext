import type { EntityId } from "./entity-adapter.types";

export interface EntityState<T extends { [K in keyof T]: T[K] }> {
	readonly ids: ReadonlyArray<EntityId>;
	readonly entities: Readonly<Record<EntityId, T>>;
}

export interface EntityUpdate<T, Id extends EntityId = string> {
	readonly id: Id;
	readonly changes: Readonly<Partial<T>>;
}
