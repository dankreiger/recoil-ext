import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react";
import { RecoilRoot, useRecoilValue } from "recoil";
import { createEntityAtom } from "./create-entity-atom";

describe("createEntityAtom", () => {
	it("should create an atom with the correct shape", () => {
		const atom = createEntityAtom("test", { ids: [], entities: {} });
		const { result } = renderHook(() => useRecoilValue(atom), {
			wrapper: RecoilRoot,
		});
		expect(result.current).toEqual({ ids: [], entities: {} });
	});
});
