import type { RecoilState } from "recoil";
import type { EntityState } from "./entity-state.types";

export interface EntityAdapter<T, Id extends string | number> {
	readonly entityAtom: RecoilState<EntityState<T, Id>>;
	readonly getInitialState: () => EntityState<T, Id>;
	readonly useAllEntities: () => ReadonlyArray<T>;
	readonly createUseOneEntity: (id: Id) => T | undefined;
	readonly createUseEntityActions: () => {
		readonly addOne: (entity: T) => void;
		readonly addMany: (entities: ReadonlyArray<T>) => void;
		readonly setAll: (entities: ReadonlyArray<T>) => void;
		readonly removeOne: (id: Id) => void;
		readonly removeMany: (ids: ReadonlyArray<Id>) => void;
		readonly removeAll: () => void;
		readonly updateOne: (id: Id, changes: Partial<T>) => void;
		readonly updateMany: (
			updates: ReadonlyArray<{
				readonly id: Id;
				readonly changes: Partial<T>;
			}>,
		) => void;
	};
}
