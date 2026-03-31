# @spectra-js/tracker

[Spectra](https://github.com/mvallejo3/spectra/tree/main) is an open source tool for tracking user interactions online. This package contains the _tracker script_ for your own Spectra implementation.

The Spectra tracker script allows you to log events and send them to your Spectra server endpoint. The script automatically queues events and sends them to the server in batches.

## Prerequisites:

- You must run your own Spectra python server- Clone [the repo](https://github.com/mvallejo3/spectra/tree/main) and follow step 2 in the _Quick Start_ section.
- Or, use your Spectra account id and API key if you have one.

# Get Started

## Install the tracker

```bash
# npm
npm i @spectra-js/tracker
# yarn
yarn add @spectra-js/tracker
# bun
bun add @spectra-js/tracker
```

## Usage with npm (ES modules)

Install from npm, then import named exports (same behavior as the **`Spectra`** global from `spectra.js`):

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

### Configuration

- **`accountId`** (required) – Identifies the tenant/table on the backend.
- **`endpoint`** (optional) – Ingest URL. If omitted, events go to `https://api.spectrajs.com/track`.
- **`debug`** (optional) – When `true`, logs event names and payloads to the console.

### Programmatic helpers

After init, `Spectra.utils` exposes payload builders for clicks, scroll, and form submits (see `src/SpectraJS/index.ts`).

## License

[MIT](../LICENSE)
