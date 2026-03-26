# @spectra-js/tracker

Browser tracking library for [Spectra](../README.md): queues events and sends them to your Spectra server endpoint.

## Requirements

- Node.js 18+ (or Bun; this repo includes a `bun.lock`)

## Install and build

```bash
cd script
npm install # or bun install
npm run build # or bun run build
```

`npm run build` runs `prebuild` (writes `src/version.ts` from `package.json`), `tsc` (emits `dist/**` with declarations), then bundles a single browser file with esbuild.

## Outputs

| Artifact                                    | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `dist/spectra.js`                           | Minified IIFE for `<script>` tags; exposes global **`Spectra`**    |
| `dist/spectra.js.map`                       | Source map                                                         |
| `dist/index.js` + `dist/**/*.js` / `*.d.ts` | npm **`main`**: ESM entry plus modules and declarations from `tsc` |

For day-to-day sites, use **`dist/spectra.js`**.

## Sandbox

The **[`sandbox`](../sandbox/)** page exercises clicks, scroll, and form flows against a built `spectra.js`.

1. From this directory, run **`npm run build`** (so `dist/spectra.js` exists).
2. Start a static server from the **parent** of `script/` (the folder that contains both `script/` and `sandbox/`), e.g. `python3 -m http.server 3000`.
3. Open **`/sandbox/index.html`** on that host (e.g. `http://localhost:3000/sandbox/index.html`). The page loads `../script/dist/spectra.js` relative to the HTML URL.

Adjust **`endpoint`** in `sandbox/index.html` if your ingest server is not on the default URL.

## Usage with npm (ES modules)

Install from npm, then import named exports (same behavior as the **`Spectra`** global from `spectra.js`):

```bash
npm install @spectra-js/tracker
```

The package entry (**`main`**: `dist/index.js`) is ESM. Example with a bundler:

```ts
import { init, logEvent, debug, utils } from "@spectra-js/tracker";

init({
  accountId: "your_table_or_account_id",
  endpoint: "https://your-server.example/track",
  debug: false,
});

logEvent("page_view");
logEvent("custom_event", { foo: "bar" });

// Read the debug flag or set it after `init` (mutates the same option as `init({ debug })`)
debug(true);
```

`utils` matches `Spectra.utils` in the script tag API (`createClickPayload`, `createScrollPayload`, `createFormSubmitPayload`).

## npm scripts

| Script  | Description                                                       |
| ------- | ----------------------------------------------------------------- |
| `build` | Version stamp → `tsc` → bundle `dist/spectra.js`                  |
| `watch` | `tsc --watch` (no bundle; run `build` when you need `spectra.js`) |

## Usage in HTML

```html
<script src="path/to/dist/spectra.js"></script>
<script>
  Spectra.init({
    accountId: "your_table_or_account_id",
    endpoint: "https://your-server.example/track",
    debug: false,
  });
  Spectra.logEvent("page_view");
  Spectra.logEvent("custom_event", { foo: "bar" });
</script>
```

`spectra.js` registers the global **`Spectra`** (see `src/SpectraJS/types.ts`).

### Configuration

- **`accountId`** (required) – Identifies the tenant/table on the backend.
- **`endpoint`** (optional) – Ingest URL. If omitted, events go to `https://api.spectrajs.com/track`.
- **`debug`** (optional) – When `true`, logs event names and payloads to the console. You can also enable debug by adding `?_spectraDebug` to the page URL.

`init` is idempotent: a second call returns the same instance.

### Programmatic helpers

After init, `Spectra.utils` exposes payload builders for clicks, scroll, and form submits (see `src/SpectraJS/index.ts`).

## License

[MIT](../LICENSE)
