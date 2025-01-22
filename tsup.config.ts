import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	format: ["esm", "iife", "cjs"],
	minify: true,
	clean: true,
	cjsInterop: true,
	shims: true,
	dts: true,
	external: ["react", "react-dom", "recoil"],
	tsconfig: "tsconfig.build.json",
});
