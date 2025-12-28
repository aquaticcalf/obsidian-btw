import builtinModules from "module"

const result = await Bun.build({
  entrypoints: ["app/main.ts"],
  outdir: ".",
  naming: "main.js",
  target: "node",
  format: "cjs",
  minify: true,
  sourcemap: "none",
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    "node-pty",
    ...builtinModules.builtinModules,
  ],
  loader: {
    ".css": "text",
  },
})

if (!result.success) {
  console.error("build failed : ")
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log("build complete")
