# MASTER AI AGENT EXECUTION PROMPT: HERMES.APK (FULL SPECIFICATION)

> **USAGE INSTRUCTION FOR OPERATOR:**  
> Copy and paste the block below directly into **Claude Code CLI**, **OpenCode CLI**, **Codex**, or **Cursor Agent** on your other machine. This prompt instructs the AI agent to ingest the entire upgraded PRD suite and autonomously build, verify, and compile `HERMES.APK` with 100% protocol fidelity.

```text
================================================================================
AUTONOMOUS TASK INVOCATION: BUILD HERMES.APK (HERMES AGENT REMOTE GATEWAY CLIENT)
================================================================================

YOU ARE COMMANDED TO BUILD "HERMES.APK", THE OFFICIAL-GRADE NATIVE-FEELING
ANDROID CLIENT FOR HERMES AGENT (`hermes serve` ON PORT 9119).

THE OFFICIAL WEB DASHBOARD IS HEAVY AND RESOURCE-INTENSIVE ON MOBILE. YOUR GOAL IS
TO DELIVER A BLISTERING-FAST, ZERO-BLOAT, RESPONSIVE REACT 19 + TYPESCRIPT (TSX)
CLIENT COMPILED TO A NATIVE ANDROID APK VIA CAPACITOR 7.

ALL ENDPOINTS, WEBSOCKET FRAMES, STREAMING EVENTS, 10 OPERATIONAL MODES, AND THE
COMPLETE 5,086 PETDEX MASCOT SYSTEM MUST EXACTLY MATCH THE UPDATED PRD:
- PRD Hermes mobile/01_ARCHITECTURE_AND_HERMES_GATEWAY_SPEC.md
- PRD Hermes mobile/02_UI_UX_ANTISLOP_DESIGN_SPEC.md
- PRD Hermes mobile/03_CAPACITOR_ANDROID_BUILD_SPEC.md
- PRD Hermes mobile/04_ACCESSIBILITY_AND_VERIFICATION_CHECKLIST.md

--------------------------------------------------------------------------------
STRICT EXECUTION DIRECTIVES (ZERO EXCEPTIONS):
--------------------------------------------------------------------------------
1. STRICT ZERO COMMENTS (NOKOMEN STANDARD):
   - ABSOLUTELY ZERO COMMENTS IN ANY CODE FILE (NO //, NO /* */, NO JSX {/* */},
     NO JSDOC, NO TODOs, NO EXPLANATORY HEADERS IN CODE).
   - Code must be 100% self-documenting with clean, idiomatic variable,
     type, and function naming.

2. AUTHENTICATION & HANDSHAKE FIDELITY (VERIFIED CODEBASE APIS):
   - Cookie Login: POST /auth/password-login {"provider":"basic","username":u,"password":p}
   - WS Ticket: POST /api/auth/ws-ticket (sets single-use ticket)
   - Alternative Bearer Token: ws://<host>:<port>/api/ws?token=<bearer_token>
   - CRITICAL HANDSHAKE: When server emits {"method":"event","params":{"type":"gateway.ready"}},
     client MUST immediately reply:
     {"jsonrpc":"2.0","id":1,"method":"client.capabilities","params":{"server_requests":true}}
     (If omitted, gateway treats client as legacy and auto-fails all dangerous action approvals!)

3. RESPONSE COMPLETENESS ENGINE ("SUPAYA RESPON LENGKAP"):
   - Turn Submission: prompt.submit({"session_id":id, "text":prompt, "surface":"mobile"})
   - Dual Stream Buffers: Maintain separate state for `reasoning.delta` (rendered in
     collapsible <details> thinking card) and `message.delta` (rendered in main markdown body).
   - Length Continuation Collapse: When Hermes hits max output tokens, the backend issues
     automatic continuation nudges (_length_continuation_nudge: true). The mobile UI MUST
     contiguously append incoming message chunks to the active assistant turn without resetting
     scroll or creating duplicate message bubbles.
   - Lossless Reconnect Replay: On mobile socket disconnect/reconnect, client calls:
     session.events.since({"session_id":id, "last_seen":lastSeq})
     If truncated: true, fall back to session.resume({"session_id":id}).
   - Frame Batching: Process newline-separated JSON frames delivered during 33ms server coalescing.

4. 10 HERMES AGENT OPERATIONAL MODES IMPLEMENTATION:
   - Mode 1: Bot Mode (Custom SOUL.md profiles, bot selector, bot avatars).
   - Mode 2: Deliverable Mode (File download links served via /api/fs/download?path=...).
   - Mode 3: Voice & Dictation Mode (Push-to-talk mic button posting to /api/audio/transcribe).
   - Mode 4: Computer Use & Bot Screen (View remote display lease screenshots).
   - Mode 5: Mixture-of-Agents (MoA live reference agent cards & synthesizer).
   - Mode 6: Kanban & Worker Lanes (Task board lane widget and child subagent tails).
   - Mode 7: Checkpoints & Rollback Mode (rollback.list, rollback.diff, rollback.restore).
   - Mode 8: Goal & Loop Mode (session.control to pause/resume goal trees and recurring loops).
   - Mode 9: Heartbeat Mode (Background periodic check-in status).
   - Mode 10: Credential Vault (vault.unlock_prompt, vault.code for 2FA injection).

5. COMPLETE 5,086 PETDEX MASCOT SYSTEM:
   - Two-phase Gallery: pet.gallery({"localOnly":true}) on load; full catalog fetched via CDN.
   - CDN Endpoint: https://petdex.dev/api/manifest (5,086 pets with spritesheetUrl & zipUrl).
   - Thumbnail Optimization: pet.thumb({"slug":slug, "url":url}) returns 96px base64 preview.
   - Canvas Sprite Engine: 1536x1872 atlas (8 cols x 9 rows), 192x208 frame size, 6 frames,
     1100ms cycle. Reactive states: idle (row 0), running (row 7 for tools), review (row 8 for
     thinking), waiting (row 6 for approvals), jumping (row 4 for success), failed (row 5).
   - Affection Vibe Reaction: Detect praise lexicon ("good bot", "thank you", "<3") and emit
     floating hearts animation.

6. INTERACTIVE SERVER-TO-CLIENT REQUEST MODALS:
   - Approval Modal: Dangerous bash/tool execution prompt with 300s countdown timer bar,
     Allow Once, Allow for Session, Allow Always, and Deny actions.
   - Clarify Modal: Multi-choice question picker with single/multi-select chip buttons.

7. ANTI-SLOP & MOBILE-FIRST DESIGN (/antislop, /antislop-layoutmobile, /antislop-ui, /ui-ux-text):
   - Zero AI gradients, zero pill overload, maximum 1 subtle floating glass bar.
   - Dark obsidian theme (#090a0b, surface #121316, border #26292f, Hermes coral #ff6347).
   - Precision non-pill controls: height 34-38px, rounded 6-8px, minimum 44px tap zone.
   - Dynamic viewport: bind to window.visualViewport for 100dvh keyboard-safe layout.
   - WCAG AA contrast ratio compliance (4.5:1+) and ARIA live regions for streaming text.

8. BUILD & COMPILATION TARGET:
   - Vite 6 + React 19 + TypeScript + Tailwind CSS v4 + Lucide React + Capacitor 7.
   - Target package: appId "ai.hermes.gateway", appName "Hermes".
   - Single-command compilation to root: "HERMES.APK".

--------------------------------------------------------------------------------
EXECUTION SEQUENCE:
--------------------------------------------------------------------------------
Step 1: Ingest PRD Hermes mobile/01 through 04.
Step 2: Initialize clean project structure in capacitor-app/ (or web/).
Step 3: Implement HermesWebSocketClient adhering to the verified JSON-RPC 2.0 contract.
Step 4: Implement PetCanvasRenderer and 5,086 Petdex gallery sheet.
Step 5: Implement UI components (Header, Transcript, ReasoningDrawer, ToolCards, Composer, Modals).
Step 6: Configure Android Capacitor plugins (@capacitor/preferences, @capacitor/local-notifications).
Step 7: Enforce zero comments across all source files.
Step 8: Compile web assets, sync Capacitor, run Gradle, and output HERMES.APK.

PROCEED AUTONOMOUSLY WITHOUT HALTING UNTIL HERMES.APK IS COMPILED AND VERIFIED.
================================================================================
```
