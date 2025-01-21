import type { BuildConfig } from "bun";

const formats = [
	"cjs",
	"esm",
	"iife",
] as const satisfies readonly BuildConfig["format"][];

await Bun.$`find . -type d -name dist -exec rm -rf {} +`;

// Build the project in all formats
await Promise.allSettled(
	formats.map((format) =>
		Bun.build({
			target: "bun",
			entrypoints: ["./src/index.ts"],
			outdir: `./out/${format}`,
			format,
			minify: format === "iife",
			sourcemap: "linked",
		})
			.then((buildOutput) => {
				if (buildOutput.success) return;
				console.error("Build failed");
				for (const message of buildOutput.logs) {
					console.error(message);
				}
				process.exit(1);
			})
			.catch(console.error),
	),
);

// Run tsc to generate types
await Bun.$`bunx tsc --project ./tsconfig.build.json`;
