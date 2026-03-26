import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(path.join(__dirname, "package.json"), "utf8")
);

const banner = `
/*! 
Spectra 
v${version} 
https://spectrajs.com
*/
`;

esbuild
  .build({
    entryPoints: [path.join(__dirname, "src", "index.ts")],
    bundle: true,
    outfile: path.join(__dirname, "dist", "spectra.js"),
    format: "iife",
    globalName: "Spectra",
    platform: "node",
    minify: true,
    sourcemap: true,
    loader: { ".ts": "ts" },
    banner: { js: banner },
  })
  .catch(() => process.exit(1));
