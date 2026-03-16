# Upfluence Analytics — TypeScript/Node.js

A TypeScript port of my [Go implementation](https://github.com/Giygas/upfluence-analytics) of the Upfluence SSE analytics challenge, built to learn Node.js patterns coming from a Go background.

## Why this exists

The original challenge was solved in Go. This version re-implements the same problem in TypeScript/Node.js to explore how Go concepts translate — `bufio.Scanner` → `readline`, `context.WithCancel` → `AbortController`, `goroutines` → `async/await` and the event loop.

## Usage

```bash
pnpm install
pnpm start
```

```bash
curl "localhost:8080/analysis?duration=30s&dimension=likes"
```

```json
{
    "total_posts": 42,
    "minimum_timestamp": 1234567890,
    "maximum_timestamp": 1234568000,
    "avg_likes": 150
}
```

**Query parameters**

- `duration` — time window for analysis (`5s`, `15m`, `1h`, etc.)
- `dimension` — metric to analyze (`likes`, `comments`, `favorites`, `retweets`)

## Architecture

Three components with a single responsibility each:

**`PostBus`** — maintains one SSE connection upstream and emits events via `EventEmitter`. Uses `readline` from the Node.js stdlib to consume the stream line by line (equivalent to `bufio.Scanner` in Go), and `AbortController` to cancel the connection on shutdown.

**`Aggregator`** — accumulates stats for a given dimension during the request window. Stateless between requests, created fresh per request.

**`main.ts`** — Koa HTTP handler. Validates inputs, subscribes to `PostBus` for the requested duration, returns JSON. Uses a dedicated `shutdownBus` EventEmitter (instead of `process` directly) to notify in-flight requests when a shutdown signal arrives, avoiding `MaxListenersExceeded` warnings under concurrent load.

### Shared upstream connection

All concurrent requests subscribe to the same `PostBus` instance — one SSE connection is shared across N requests via pub/sub. Each request adds a listener for its duration, then removes it. This is different from the Go version where each request opened its own SSE connection.

### Graceful shutdown

On `SIGINT`/`SIGTERM`:

1. New requests get `503` immediately
2. In-flight requests are notified via `shutdownBus.emit("shutdown")` — they resolve early
3. `http-graceful-shutdown` waits for open connections to close
4. `PostBus.disconnect()` cancels the upstream SSE connection

Requests that completed their full duration before the shutdown signal return `200` with their data — only interrupted requests return `503`.

## Stack

- **Koa** — async-native HTTP framework
- **readline** (stdlib) — line-by-line SSE stream consumption
- **ms** — human-readable duration parsing
- **http-graceful-shutdown** — keep-alive connection handling on shutdown
- **tsx** — TypeScript execution
