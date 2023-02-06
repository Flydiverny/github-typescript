const fs = require("node:fs/promises");
const swc = require("@swc/core");

const main = async () => {
  const output = await swc.transformFile("./input.ts", {
    filename: "input.ts",
    sourceMaps: true,
    jsc: {
      parser: {
        syntax: "typescript",
      },
      target: "es2021",
    },
  });
  await fs.rm("./dist", { recursive: true });
  await fs.mkdir("./dist");
  await fs.writeFile("./dist/generated.js", output.code);
};

main();
