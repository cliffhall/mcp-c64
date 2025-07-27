const { build } = require("esbuild");

build({
  entryPoints: ["server/index.ts", "server/repl.ts"],
  bundle: true,
  platform: "node",
  target: "node16",
  outdir: "dist/"
}).catch(() => process.exit(1));
