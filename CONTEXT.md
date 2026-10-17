# HERMES WEB ARCHITECTURE & ORCHESTRATION CONTEXT

## 1. System Overview
Hermes Web is the browser-accessible edition of the Hermes React 19 + TypeScript + Tailwind CSS application, powered by the local Hermes JSON-RPC / WebSocket gateway and exposed globally through Cloudflare Tunnels.

## 2. Network & Routing Topology
- **Cloudflare Zone**: `agentai.my.id`
- **Cloudflare Tunnel ID**: `40522112-be2a-4342-acba-eafef7659eb4`
- **Public Web URLs**:
  - `https://chat.agentai.my.id` -> Cloudflare Tunnel -> `http://localhost:8082`
  - `https://app.agentai.my.id` -> Cloudflare Tunnel -> `http://localhost:8082`
- **Public Gateway URL**:
  - `https://hermes.agentai.my.id` -> Cloudflare Tunnel -> `http://localhost:9119`
- **Local Services**:
  - Hermes Backend Gateway: `127.0.0.1:9119` (headless JSON-RPC / WebSocket `/api/ws`)
  - Web Server & Reverse Proxy: `127.0.0.1:8082` (`server.mjs`)

## 3. Strict Development Rules
- **ZERO COMMENTS**: No single-line (`//`), multi-line (`/* */`), JSX (`{/* */}`), or JSDoc comments allowed in any code file.
- **AGY01 Mode**: AGY01 orchestrates and conducts testing. Worker agents author all code.
- **Git Worktree Isolation**: All worker tasks are executed in separate worktrees without file collisions.

## 4. Worker Allocations
### AGY02 (Backend Core Owner) - Worktree: `/opt/data/home/remotehermes-worktrees/agy02-backend`
- Responsible for `server.mjs` (Node.js ESM web server & reverse proxy) and `package.json` script updates.
- Specifications for `server.mjs`:
  1. Built using pure `node:http`, `node:fs`, `node:path`, `node:url`.
  2. Default port: `8082` (or `process.env.PORT`).
  3. Static file serving from `./dist` with appropriate MIME types (`.html`, `.js`, `.css`, `.json`, `.svg`, `.png`, `.jpg`, `.webp`, `.ico`, `.webmanifest`).
  4. SPA Fallback: Any route without file extension serves `dist/index.html`.
  5. Session Token Injection: Before serving `index.html`, fetch session token from `http://127.0.0.1:9119/` (extract `__HERMES_SESSION_TOKEN__`), and inject `<script>window.__HERMES_SESSION_TOKEN__="...";window.__HERMES_AUTH_REQUIRED__=false;</script>` into `<head>`.
  6. HTTP Proxy: Proxy all `/api/*` requests to `http://127.0.0.1:9119/api/*` rewriting `Host: 127.0.0.1:9119`.
  7. WebSocket Upgrade Proxy: Intercept `'upgrade'` on `/api/ws` (and any websocket path), connect to `http://127.0.0.1:9119/api/ws` rewriting `Host: 127.0.0.1:9119` and `Origin: http://127.0.0.1:9119`, and piping bidirectional TCP frames upon `101 Switching Protocols`.
  8. Zero comments in code.

### AGY04 (Frontend & UI/UX Owner) - Worktree: `/opt/data/home/remotehermes-worktrees/agy04-frontend`
- Responsible for `src/store/useHermesStore.ts`, `src/api/hermes-client.ts`, `src/components/Transcript.tsx`, `src/components/Header.tsx`, `src/App.tsx`.
- Specifications:
  1. In `src/store/useHermesStore.ts` & `src/api/hermes-client.ts`:
     - Dynamically detect `window.__HERMES_SESSION_TOKEN__` and assign it to initial gatewayConfig token.
     - When running in browser (non-localhost hostname, non-capacitor), default `gatewayConfig.host` to `window.location.hostname`, port `443` (for https) or current port, `useSsl: window.location.protocol === 'https:'`.
     - In Capacitor or local file preview, maintain fallback to `hermes.agentai.my.id`.
  2. Desktop Web Responsiveness:
     - In `src/components/Transcript.tsx`: wrap conversation feed in `max-w-3xl mx-auto w-full px-3 sm:px-4` so messages sit in a polished, centered column on large desktop monitors.
     - In `src/components/Header.tsx`: wrap inner elements in `max-w-3xl mx-auto w-full flex items-center justify-between px-3 sm:px-4`.
  3. Strict zero comments.
  4. Build verified with `npm run build`.
