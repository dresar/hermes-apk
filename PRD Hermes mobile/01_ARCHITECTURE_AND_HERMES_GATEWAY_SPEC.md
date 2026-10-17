# SPECIFICATION 01: ARCHITECTURE & HERMES GATEWAY PROTOCOL

## 1. System Overview & Core Rationale

### 1.1 The Problem
The official web dashboard (`hermes dashboard`) bundled with Hermes Agent is resource-heavy, relies on desktop-oriented rendering, and causes high battery/memory drain on mobile browsers.

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
└───────────────────────┬───────────────────────┘
                        │
                        │ Private Tailscale IP / HTTPS
                        │ JSON-RPC 2.0 over WebSocket
                        ▼
┌───────────────────────────────────────────────┐
│               HOST PC / VPS / SERVER          │
│               `hermes serve --port 9119`      │
│  - JSON-RPC WebSocket Gateway (/api/ws)       │
│  - Authentication & 1-time Ticket Generator   │
│  - Hermes Agent Execution Core                │
│  - Model Router & Local / Cloud LLM APIs      │
└───────────────────────────────────────────────┘
```

---

## 2. HTTP Authentication & Session Handshake

The client communicates with the `hermes serve` HTTP server (default port `9119`) using standard REST calls before establishing the streaming WebSocket.

### 2.1 Login & Cookie Acquisition
- **Endpoint**: `POST /api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "user": "string",
    "pass": "string"
  }
  ```
- **Response Success** (`200 OK`):
  Sets session cookie (`Set-Cookie: hermes_session=...; HttpOnly; Path=/; SameSite=Lax`).
  Returns `{ "status": "ok", "user": "..." }`.
- **Response Failure** (`401 Unauthorized` / `403 Forbidden`):
  Returns `{ "error": "Invalid credentials" }`.

### 2.2 WebSocket Ticket Retrieval
WebSocket connections do not carry custom HTTP headers directly in standard browser/webview APIs. Therefore, Hermes requires a single-use handshake ticket.
- **Endpoint**: `GET /api/auth/ws-ticket`
- **Headers**: `Cookie: hermes_session=...`
- **Response Success** (`200 OK`):
  ```json
  {
    "ticket": "wst_a1b2c3d4e5f6..."
  }
  ```
- **Ticket Expiry**: Single-use, valid for 30 seconds.

### 2.3 Health & Version Probe
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "version": "0.21.5+4582",
    "commit": "c07501ec411b5364e5b12b7258c25a6a4c758545",
    "active_sessions": 3
  }
  ```

---

## 3. Real-Time Streaming WebSocket Protocol

The primary channel is a bidirectional WebSocket connection at:  
`ws://<GATEWAY_HOST>:<PORT>/api/ws?ticket=<TICKET>` (or `wss://` for HTTPS).

All framing strictly conforms to **JSON-RPC 2.0**.

### 3.1 Client-to-Server RPC Methods

#### A. Session Management
1. `session.list`:
   - Request: `{"jsonrpc": "2.0", "method": "session.list", "params": {}, "id": 1}`
   - Result:
     ```json
     {
       "sessions": [
         {
           "id": "sess_88921",
           "title": "Refactoring Auth Module",
           "created_at": 1729158000,
           "updated_at": 1729161200,
           "active_model": "hermes-fast",
           "status": "idle"
         }
       ]
     }
     ```
2. `session.create`:
   - Request: `{"jsonrpc": "2.0", "method": "session.create", "params": {"title": "New Task", "model": "hermes"}, "id": 2}`
   - Result: `{"session_id": "sess_88922", "title": "New Task"}`
3. `session.takeover`:
   - Used when another device (e.g. Hermes Desktop) currently owns the session.
   - Request: `{"jsonrpc": "2.0", "method": "session.takeover", "params": {"session_id": "sess_88921", "force": true}, "id": 3}`
   - Result: `{"status": "acquired", "previous_owner": "desktop-client-uuid"}`
4. `session.history`:
   - Request: `{"jsonrpc": "2.0", "method": "session.history", "params": {"session_id": "sess_88921", "limit": 100}, "id": 4}`
   - Result: Array of message turns (user, assistant, tool_call, tool_result, thinking).

#### B. Turn Execution & Prompt Steering
1. `session.prompt`:
   - Request:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "session.prompt",
       "params": {
         "session_id": "sess_88921",
         "text": "Analyze and fix the authentication middleware",
         "attachments": [
           {
             "name": "auth.ts",
             "mime": "text/plain",
             "content_base64": "ZXhwb3J0IGNvbnN0..."
           }
         ]
       },
       "id": 5
     }
     ```
2. `session.steer`:
   - Steers or injects instructions into an ongoing generation turn without aborting:
   - Request: `{"jsonrpc": "2.0", "method": "session.steer", "params": {"session_id": "sess_88921", "instruction": "Focus on JWT expiration only"}, "id": 6}`
3. `session.stop`:
   - Immediately aborts the active generation / tool execution turn:
   - Request: `{"jsonrpc": "2.0", "method": "session.stop", "params": {"session_id": "sess_88921"}, "id": 7}`

#### C. Model Switching & Thinking Levels
1. `model.list`:
   - Request: `{"jsonrpc": "2.0", "method": "model.list", "params": {}, "id": 8}`
   - Result:
     ```json
     {
       "models": [
         {
           "id": "hermes",
           "name": "Hermes Default (DeepSeek / Claude)",
           "supports_thinking": true,
           "thinking_levels": ["none", "low", "medium", "high", "xhigh", "max"],
           "context_window": 128000
         },
         {
           "id": "hermes-fast",
           "name": "Hermes Fast (Qwen / Flash)",
           "supports_thinking": false,
           "context_window": 64000
         }
       ]
     }
     ```
2. `model.switch`:
   - Request:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "model.switch",
       "params": {
         "session_id": "sess_88921",
         "model": "hermes",
         "thinking_level": "high",
         "confirm_context_reset": true
       },
       "id": 9
     }
     ```

#### D. Background Process Monitoring
1. `process.list`:
   - Lists background tasks (e.g. `terminal(background=true)` jobs, dev servers, builds):
   - Request: `{"jsonrpc": "2.0", "method": "process.list", "params": {"session_id": "sess_88921"}, "id": 10}`
   - Result:
     ```json
     {
       "processes": [
         {
           "id": "proc_101",
           "command": "npm run build",
           "status": "running",
           "output_tail": "Transforming 42 modules...",
           "started_at": 1729161000
         }
       ]
     }
     ```
2. `process.kill`:
   - Request: `{"jsonrpc": "2.0", "method": "process.kill", "params": {"process_id": "proc_101"}, "id": 11}`

#### E. Tool Approval Responses
When Hermes attempts a high-risk action (bash command, deletion, file overwrite), the server suspends execution and issues an `approval_request` notification.
- Client Approval Response:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "approval.respond",
    "params": {
      "approval_id": "appr_7719",
      "approved": true,
      "remember_for_session": false
    },
    "id": 12
  }
  ```

---

### 3.2 Server-to-Client Push Notifications (Events)

These events have no `id` and arrive asynchronously:

1. `stream.token`: Real-time text token append
   ```json
   {
     "jsonrpc": "2.0",
     "method": "stream.token",
     "params": {
       "session_id": "sess_88921",
       "delta": " function",
       "type": "text"
     }
   }
   ```
2. `stream.thinking`: Extended reasoning block token
   ```json
   {
     "jsonrpc": "2.0",
     "method": "stream.thinking",
     "params": {
       "session_id": "sess_88921",
       "delta": "Checking token expiration logic...",
       "type": "thinking"
     }
   }
   ```
3. `stream.tool_call`: Tool execution started
   ```json
   {
     "jsonrpc": "2.0",
     "method": "stream.tool_call",
     "params": {
       "session_id": "sess_88921",
       "tool_name": "run_command",
       "arguments": { "command": "git status" },
       "call_id": "call_9901"
     }
   }
   ```
4. `stream.tool_result`: Tool execution finished
   ```json
   {
     "jsonrpc": "2.0",
     "method": "stream.tool_result",
     "params": {
       "session_id": "sess_88921",
       "call_id": "call_9901",
       "output": "On branch main\nnothing to commit",
       "is_error": false
     }
   }
   ```
5. `stream.end`: Turn completed
   ```json
   {
     "jsonrpc": "2.0",
     "method": "stream.end",
     "params": {
       "session_id": "sess_88921",
       "tokens_generated": 412,
       "duration_ms": 1820
     }
   }
   ```
6. `approval.requested`: Action approval required
   ```json
   {
     "jsonrpc": "2.0",
     "method": "approval.requested",
     "params": {
       "approval_id": "appr_7719",
       "session_id": "sess_88921",
       "action_type": "bash",
       "command": "git push origin main --force",
       "risk_level": "high"
     }
   }
   ```

---

## 4. Multi-Gateway Connection Vault & Provider Configuration

The mobile client must persist multiple gateway targets so users can effortlessly switch between environments without re-entering credentials.

### 4.1 Saved Gateway Schema (Capacitor Preferences)
```typescript
interface GatewayConnection {
  id: string;
  name: string;
  baseUrl: string;
  user: string;
  pass: string;
  isDefault: boolean;
  lastConnectedAt?: number;
}
```

### 4.2 Custom AI Provider Keys & Router Settings Form
Hermes Agent on the host can also be pointed to custom model providers (e.g. ByNara Router, Sumopod, Local OpenAI-compatible proxy at `http://127.0.0.1:20128/v1`). The mobile client provides a dedicated Settings panel allowing direct inspection and configuration:
- **Provider Type**: Custom / OpenAI / Anthropic / Ollama
- **Base URL**: e.g. `http://127.0.0.1:20128/v1`
- **API Key**: Masked password field with reveal toggle
- **Default Model Identifier**: e.g. `hermes`, `hermes-fast`
- **Reasoning Effort Default**: `none` | `low` | `medium` | `high` | `max`
