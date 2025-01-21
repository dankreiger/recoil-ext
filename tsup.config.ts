import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	format: ["esm", "iife", "cjs"],
	minify: true,
	sourcemap: true,
	dts: true,
	external: ["react", "react-dom", "recoil"],
});
