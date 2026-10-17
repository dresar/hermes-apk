# SPECIFICATION 01: ARCHITECTURE, PROTOCOLS, RESPONSE COMPLETENESS & SYSTEM MODES

## 1. System Overview & Core Rationale

### 1.1 The Problem
The official web dashboard (`hermes dashboard`) bundled with Hermes Agent is resource-heavy, relies on desktop-oriented rendering, and causes high battery and memory drain on mobile browsers.

### 1.2 The Solution
`HERMES.APK` is a native-feeling, ultra-lightweight mobile remote gateway client. It connects to a self-hosted `hermes serve` backend running on a remote PC, VPS, or local network via **Tailscale** or public **HTTPS**. The mobile app handles only UI rendering, user input, token streaming display, and remote management. The actual LLM inference and heavy tool execution remain entirely on the host machine.

```text
┌───────────────────────────────────────────────┐
│              ANDROID MOBILE PHONE             │
│                  (HERMES.APK)                 │
│  - React 19 + TypeScript (TSX) Mobile UI      │
│  - Capacitor 7 Native Bridge                  │
│  - Encrypted Gateway & Credential Vault       │
│  - Low-latency Streaming Virtualized Feed     │
│  - 5,086 Petdex Mascot Companion Canvas      │
└───────────────────────┬───────────────────────┘
                        │
                        │ Private Tailscale IP / HTTPS
                        │ JSON-RPC 2.0 over WebSocket (/api/ws)
                        ▼
┌───────────────────────────────────────────────┐
│               HOST PC / VPS / SERVER          │
│               `hermes serve --port 9119`      │
│  - Starlette / FastAPI WebSocket Sidecar      │
│  - Authentication & 1-time Ticket Generator   │
│  - Hermes Agent Execution Core                │
│  - 10 Operational Modes & Subagent Orchestrator│
│  - 5,086 Pet Atlas Cache (<HERMES_HOME>/pets) │
└───────────────────────────────────────────────┘
```

---

## 2. HTTP Authentication & Connection Handshake

The client communicates with the `hermes serve` HTTP server (default port `9119`) using standard REST calls before establishing the streaming WebSocket.

### 2.1 Password Login (Session Cookie Acquisition)
Verified in [`hermes_cli/dashboard_auth/routes.py` L447-L565](file:///C:/Users/NCN0C/AppData/Local/hermes/hermes-agent/hermes_cli/dashboard_auth/routes.py#L447-L565):
- **Endpoint**: `POST /auth/password-login`
- **Headers**: `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "provider": "basic",
    "username": "user",
    "password": "password"
  }
  ```
- **Response Success** (`200 OK`):
  Sets session cookie (`Set-Cookie: hermes_session_<prefix>=<value>; HttpOnly; Path=/; SameSite=Lax`).
  Returns `{ "ok": true, "next": "/" }`.

### 2.2 WebSocket Upgrade Ticket
Verified in [`hermes_cli/dashboard_auth/routes.py` L574-L618](file:///C:/Users/NCN0C/AppData/Local/hermes/hermes-agent/hermes_cli/dashboard_auth/routes.py#L574-L618):
- **Endpoint**: `POST /api/auth/ws-ticket`
- **Headers**: `Cookie: hermes_session_...`
- **Response Success** (`200 OK`):
  ```json
  {
    "ticket": "wst_a1b2c3d4e5f6...",
    "ttl_seconds": 30
  }
  ```

### 2.3 Alternative Remote Auth: Direct Bearer Token
Remote mobile clients connected over Tailscale can bypass cookie sessions by providing a persistent RFC 8252 bearer token directly in the query string:
`ws://<host>:<port>/api/ws?token=<bearer_token>`

### 2.4 Mandatory Gateway Capabilities Handshake (CRITICAL)
Immediately upon connecting, the server pushes:
```json
{"method": "event", "params": {"type": "gateway.ready", "payload": {"active_skin": "dark", "heartbeat_interval_ms": 30000}}}
```
The client **MUST** reply with:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "client.capabilities",
  "params": {
    "server_requests": true
  }
}
```
> **CRITICAL ARCHITECTURAL REQUIREMENT**: If the client fails to send `server_requests: true`, the gateway assumes a legacy client and auto-fails all dangerous action approvals, completely disabling interactive agent commands!

---

## 3. Response Completeness Engine ("Supaya Respon Lengkap")

In LLM agent architectures, users frequently encounter truncated, cut-off, or empty responses. Hermes Agent implements sophisticated internal recovery systems that the mobile client must interface with:

### 3.1 The 4 Root Causes of Response Truncation in Hermes
1. **Thinking Budget Exhaustion**: Model consumes all available `max_tokens` inside `<think>...</think>`, emitting zero visible answer text.
2. **Hard Max Output Limit**: Generation hits provider token limits (`finish_reason == "length"`) mid-codeblock or mid-sentence.
3. **Context Window Saturation**: Accumulated prompt history + large tool stdout fills the model context window (`window_filled`).
4. **Mobile TCP Sockets Drops**: Transient cell-tower handovers or sleep states drop WebSocket frames in transit.

### 3.2 Gateway Self-Healing Mechanisms
1. **Ephemeral Reasoning Disable**:
   When reasoning exhausts the turn budget without producing visible content, Hermes sets `agent._ephemeral_reasoning_off = True`. The automatic continuation turn is executed with reasoning suppressed, ensuring 100% of the token budget is dedicated to the visible answer.
2. **4-Attempt Automatic Continuation Nudge Loop**:
   When `finish_reason == "length"`, Hermes automatically injects a continuation nudge (`_length_continuation_nudge: true`) without requiring user intervention. Up to 4 consecutive continuation attempts are chained. Once completed, `collapse_continuation_trail()` merges the fragments, strips internal markers, and delivers a single unified response.
3. **Durable Turn Marker Crash Recovery**:
   Hermes writes a durable turn marker to `<HERMES_HOME>/sessions/<id>/turn_marker.json`. If the backend process restarts during generation, `session.resume` recovers the interrupted turn within a 15-minute window.
4. **Automatic Context Compression (`/compress`)**:
   When context saturates, Hermes automatically summarizes earlier conversation turns while strictly preserving system prompts, tool schemas, and active file contexts.
5. **Lossless Event Replay (`session.events.since`)**:
   Every gateway event carries a monotonic sequence integer (`seq`). On network reconnect, the client requests:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 10,
     "method": "session.events.since",
     "params": {
       "session_id": "sess_88921",
       "last_seen": 42
     }
   }
   ```
   The gateway replays all dropped frames from its 512-entry in-memory ring buffer. If `truncated: true` is returned (ring overflowed), the client falls back to a clean `session.resume` snapshot.

### 3.3 Strict Client-Side Requirements for Full Response Fidelity
1. **Dual Stream Buffering**: The mobile UI must maintain two separate stream state buffers:
   - `reasoning.delta` buffer rendered in a collapsible `<details>` thinking card.
   - `message.delta` buffer rendered in the main Markdown view.
2. **Contiguous Bubble Append**: When Hermes continues a turn, incoming chunks must append to the existing assistant bubble without resetting scroll positions or splitting into separate messages.
3. **Newline Frame Splitting**: The client WebSocket parser must split incoming messages by `\n` to properly unpack batched JSON frames flushed by the server's 33ms token coalescing timer.

---

## 4. Real-Time JSON-RPC 2.0 Streaming Protocol

### 4.1 Primary Client-to-Server Methods
- `prompt.submit`: Submit prompt (`session_id`, `text`, `surface: "mobile"`, `attachments: [{ name, mime, content_base64 }]`).
- `session.interrupt`: Immediately aborts active turn and tool execution.
- `session.steer`: Injects steering instructions into the active turn without aborting.
- `session.redirect`: Redirects generation toward a new direction.
- `session.undo`: Drops last user turn and subsequent assistant messages (`intent: "undo" | "retry"`).
- `session.compress`: Triggers context window compression (`focus_topic?: string`).
- `session.create`: Creates a new session (`model`, `profile`, `title`, `cwd`).
- `session.resume`: Attaches to stored session; returns live status and recent turns.
- `session.list`: Lists stored sessions (`limit`, `profile`).
- `session.history`: Fetches complete message history with durability IDs.
- `session.events.since`: Replays missed events after network reconnection (`session_id`, `last_seen`).
- `session.control`: Manages autonomous goal trees, loops, and heartbeats.
- `session.control.read`: Reads goal contracts, active loops, and milestone status.

### 4.2 Server-to-Client Streaming Events
- `message.start`: Assistant turn initiated.
- `message.delta`: Streamed text chunk (`{ text: "..." }`).
- `reasoning.delta`: Streamed thinking chunk (`{ text: "..." }`).
- `tool.generating`: Model currently constructing tool call arguments.
- `tool.start`: Tool execution began (`{ tool_id, name, args }`).
- `tool.complete`: Tool execution finished (`{ tool_id, name, result, inline_diff, duration_s }`).
- `message.interim`: Narration emitted between consecutive tool executions.
- `message.complete`: Turn finalized with usage stats (`{ text, usage, status, reasoning }`).
- `status.update`: Status changes (`thinking`, `executing`, `compacting`, `goal`).
- `reaction`: User affection reaction detected (`{ kind: "hearts" }`).
- `pet.changed`: Active mascot updated (`{ enabled, slug, scale }`).
- `subagent.*`: Child agent lifecycle and execution stream.

### 4.3 Server-to-Client Interactive Requests (`ServerRequestMap`)
- `approval`: Dangerous action authorization (`request_id`, `command`, `description`, `choices: ["once", "session", "always", "deny"]`). 300-second deadline.
- `clarify`: Structured question modal (`questions: [{ qid, question, choices, multi_select }]`).
- `sudo`: Requests elevated password for terminal commands.
- `secret`: Requests masked API keys or environment tokens.
- `vault.unlock_prompt`: Master password prompt for external password manager.

---

## 5. Comprehensive Analysis of Hermes Modes

The mobile gateway client provides first-class support for all 10 Hermes operational modes:

| Mode | Documentation | Core Functionality & Mobile UX Representation |
| :--- | :--- | :--- |
| **1. Bot Mode** | `bot-mode.md` | Named persistent bots with custom `SOUL.md`, isolated memories, and profile avatars. The mobile app provides a Bot Switcher drawer allowing instant context switching. |
| **2. Deliverable Mode** | `deliverable-mode.md`| Generated deliverables (PDFs, spreadsheets, data charts) served via `/api/fs/download?path=...`. Rendered as interactive download cards with instant preview. |
| **3. Voice & Wake Mode** | `voice-mode.md` | Full-duplex speech. Push-to-talk mic sends audio to `/api/audio/transcribe`. Streaming TTS playback via Web Audio API. |
| **4. Computer Use & Bot Screen**| `bot-screen.md` | Headless Chromium browser automation (`browser.manage`) and Xvnc virtual display leasing. Mobile displays live screenshot view with touch-to-click coordinate translation. |
| **5. Mixture-of-Agents (MoA)**| `moa.md` | Multiple reference models run in parallel; outputs synthesized by aggregator model. Displayed as expandable side-by-side agent cards. |
| **6. Kanban Worker Lanes**| `kanban.md` | Multi-agent task board. Mobile renders task lanes (Backlog, In Progress, Review, Done) with subagent progress indicators. |
| **7. Checkpoints & Rollbacks**| `rollback.md` | Pre-mutation Git snapshots. Mobile provides a Checkpoints Sheet with unified diff viewing and one-tap instant rollback. |
| **8. Goal & Loop Mode** | `goals.md`, `loops.md`| Autonomous multi-hour goal trees with milestone gates; recurring cron loops. Controlled via `session.control` pause/resume buttons. |
| **9. Heartbeat Mode** | `heartbeat.md` | Scheduled background check-ins and system health monitors. Mobile displays heartbeat pulse badge and logs. |
| **10. Credential Vault** | `credential-vault.md`| Encrypted secrets vault and 2FA OTP code entry modal (`vault.code`). Secrets are never displayed in plaintext. |
