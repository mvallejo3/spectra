# Spectra

Spectra is an open source tool for tracking user interactions online. It works without relying on Google Analytics, giving you full control over the architecture and data.

## Why Spectra

- **Privacy & ownership** – No third-party analytics script required; you decide where the data lives.
- **Self-hosted** – Bring your own server, storage, and pipelines.
- **Lightweight** – A 2kb script logs events. One endpoint writes events to BigQuery.
- **Dashboard agnostic** – Use your favorite tool for data visualisation and analysis.
- **Built-in event queue** - A built-in queue reduces resource consumption on the client when logging events.

## Structure

- **script/** – TypeScript tracking script (capture events, add to queue, send to server)
- **server/** – Python HTTP server (receive events, write to BigQuery)

## Quick Start

### 1. Build the tracker script

```bash
cd script && npm install && npm run build
```

### 2. Run the server

Requires Python 3.11+.

```bash
cd server
python -m venv .venv && source .venv/bin/activate  # or: .venv\Scripts\activate on Windows
pip install -e .   # or: pip install -r requirements.txt

# Set environment variables for BigQuery (see .env.example)
export BIGQUERY_PROJECT_ID=your-project
export BIGQUERY_DATASET=analytics
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Run
make start
```

### 3. Start tracking

Add the script to your project and start tracking events.

```html
<head>
  <!-- Add to the bottom of the head tag -->
  <script src="../script/dist/spectra.js"></script>
  <script>
    Spectra.init({
      debug: true,
      accountId: "spectra_test", // This is your big query table name
      endpoint: "http://localhost:8000/track",
    });
    // Log your first event
    Spectra.logEvent("page_view");
  </script>
</head>
```
