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

| Artifact                  | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `dist/spectra.js`         | Minified IIFE for `<script>` tags; exposes global **`Spectra`** |
| `dist/spectra.js.map`     | Source map                                                      |
| `dist/**/*.js` / `*.d.ts` | ES modules and TypeScript declarations from `tsc`               |

For day-to-day sites, use **`dist/spectra.js`**.

## npm scripts

| Script      | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| `build`     | Version stamp → `tsc` → bundle `dist/spectra.js`                  |
| `watch`     | `tsc --watch` (no bundle; run `build` when you need `spectra.js`) |
| `prepcdn`   | Copy `dist/spectra.js` to `../cdn/public/spectra.js`              |
| `deploycdn` | `prepcdn`, then deploy from `../cdn`                              |

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
