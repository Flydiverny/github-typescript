const path = require("path");
require("esbuild").buildSync({
  entryPoints: [process.env.SCRIPT_FILE],
  bundle: true,
  platform: "node",
  packages: "external",
  // absWorkingDir: path.resolve(path.dirname(process.env.SCRIPT_FILE)),
  outdir: path.dirname(process.env.SCRIPT_FILE),
  format: "esm",
});
