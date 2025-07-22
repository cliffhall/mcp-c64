const { build } = require("esbuild");

build({
  entryPoints: ["src/index.ts", "src/repl.ts"],
  bundle: true,
  platform: "node",
  target: "node16",
  outdir: "dist/"
}).catch(() => process.exit(1));
