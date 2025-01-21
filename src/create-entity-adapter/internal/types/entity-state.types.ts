export interface EntityState<
	T extends { [K in keyof T]: T[K] },
	Id extends string | number = string,
> {
	readonly ids: ReadonlyArray<Id>;
	readonly entities: Readonly<Record<Id, T>>;
}

export interface EntityUpdate<T, Id extends string | number = string> {
	readonly id: Id;
	readonly changes: Readonly<Partial<T>>;
}
