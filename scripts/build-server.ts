// Pre-bundle server/app.ts into a single ESM file before Vercel's function
// bundler runs. This sidesteps @vercel/node's strict ESM resolution (no
// directory imports, no `.ts` extension inference) since esbuild handles
// all of that during this prebuild step.
//
// Output is consumed by api/index.ts via a static .mjs import, so it ends
// up traced and shipped into the Vercel function.

import { build } from "esbuild";
import { readFileSync, mkdirSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["server/app.ts"],
  outfile: "dist/server.mjs",
  platform: "node",
  target: "node22",
  format: "esm",
  bundle: true,
  // Keep node_modules deps as runtime imports — Vercel ships them.
  packages: "external",
  logLevel: "info",
  // ESM doesn't have __dirname / __filename / require — provide shims for
  // any bundled code (or its deps) that still expects them.
  banner: {
    js: [
      `import { createRequire as __cr } from 'module';`,
      `import { fileURLToPath as __fu } from 'url';`,
      `import { dirname as __dn } from 'path';`,
      `const require = __cr(import.meta.url);`,
      `const __filename = __fu(import.meta.url);`,
      `const __dirname = __dn(__filename);`,
    ].join("\n"),
  },
});

console.log("[build-server] dist/server.mjs ready");
