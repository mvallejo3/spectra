const esbuild = require("esbuild");
const path = require("path");
const { version } = require("./package.json");

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
    platform: "browser",
    minify: true,
    sourcemap: true,
    loader: { ".ts": "ts" },
    banner: { js: banner },
  })
  .catch(() => process.exit(1));
