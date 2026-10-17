# MASTER AI AGENT EXECUTION PROMPT: HERMES.APK

> **USAGE INSTRUCTION FOR OPERATOR:**  
> Copy and paste the block below directly into **Claude Code CLI**, **OpenCode CLI**, **Codex**, or **Cursor Agent** on your other machine. This prompt instructs the AI agent to ingest the entire PRD folder and autonomously build, verify, and compile `HERMES.APK`.

```text
================================================================================
AUTONOMOUS TASK INVOCATION: BUILD HERMES.APK (MOBILE REMOTE GATEWAY CLIENT)
================================================================================

YOU ARE COMMANDED TO BUILD "HERMES.APK", A HIGH-PERFORMANCE, LIGHTWEIGHT NATIVE
ANDROID GATEWAY CLIENT FOR HERMES AGENT (HEADLESS `hermes serve` SERVER).

THE OFFICIAL WEB DASHBOARD IS HEAVY AND RESOURCE-INTENSIVE. YOUR OBJECTIVE IS TO
REPLACE IT ON MOBILE WITH A CRISP, LIGHTWEIGHT, FLUID REACT 19 + TYPESCRIPT (TSX)
MOBILE CLIENT PACKAGED INTO AN ANDROID APK VIA CAPACITOR 7.

ALL PROTOCOLS, ENDPOINTS, JSON-RPC METHODS, STATE MANAGERS, AND UI BEHAVIORS
MUST MATCH THE COMPREHENSIVE PRD SPECIFICATIONS IN THIS REPOSITORY:
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
   - The code must be 100% self-documenting with clean, idiomatic variable,
     type, and function naming. Every file must be production-ready and clean.

2. ANTI-SLOP DESIGN & MOBILE-FIRST STANDARD:
   - Apply strict Anti-Slop (/antislop, /antislop-layoutmobile, /antislop-ui, /ui-ux-text).
   - FORBIDDEN: Generic AI blue-purple gradients, excessive glassmorphism on every card,
     pill-shaped buttons/inputs everywhere, glowing card borders, fake statistics,
     and generic empty buzzwords.
   - REQUIRED: Dark obsidian palette (#090a0b, surface #121316, border #26292f,
     warm Hermes coral accent #ff6347).
   - Buttons: compact precision (34-38px height, rounded 6-8px, NEVER pills),
     active tap micro-scale (scale 0.98), minimum 44px tap zone padding.
   - Dynamic mobile viewport (100dvh), safe-area insets, fluid typography (clamp),
     zero horizontal overflow at 320px logical width.

3. FULL GATEWAY FEATURE SET & ENDPOINT FIDELITY:
   - HTTP Authentication: POST /api/auth/login, GET /api/auth/ws-ticket, GET /api/health.
   - Real-time JSON-RPC 2.0 Streaming WebSocket (/api/ws?ticket=...):
     * Streaming chat with real-time text token append, reasoning/thinking folding.
     * Session management: session.list, session.create, session.switch, session.takeover.
     * Turn control: session.prompt, session.steer, session.stop, session.history.
     * Model management: model.list, model.switch with safety confirmation modal.
     * Background execution monitor: process.list, subagent.list, process.kill.
     * Approval / interactive confirmation prompts (bash / tool execution approvals).
     * File attachments and audio recording dictation.
     * Multi-gateway vault (Saved Connections screen for Tailscale IP vs Remote HTTPS).
     * Model Provider Key & Endpoint settings form (Custom Proxy, OpenAI, Anthropic).

4. ACCESSIBILITY & PERFORMANCE (/a11y-debugging):
   - Semantic HTML5, ARIA live regions for streaming tokens (aria-live="polite"),
     labeled inputs, clear visible focus rings, WCAG AA color contrast (4.5:1+).

5. PACKAGING TARGET:
   - Stack: Vite + React 19 + TypeScript (.tsx) + Tailwind CSS v4 + Lucide Icons + Capacitor 7.
   - Native Android target: app id "ai.hermes.gateway", app name "Hermes",
     output compiled to "build/HERMES.APK" (Release/Debug APK).

--------------------------------------------------------------------------------
EXECUTION STEPS:
--------------------------------------------------------------------------------
Step 1: Read all 4 PRD specification documents in "PRD Hermes mobile/".
Step 2: Initialize Vite + React + TSX + Tailwind + Capacitor project structure.
Step 3: Implement the type-safe Hermes JSON-RPC WebSocket & HTTP API client.
Step 4: Implement state stores (Active Gateway, Session, Streaming Transcript, Models, Approvals).
Step 5: Implement UI components conforming to the Anti-Slop and Precision Card/Button specifications.
Step 6: Configure Android Capacitor plugins (@capacitor/preferences, @capacitor/local-notifications).
Step 7: Verify zero-comment compliance across all generated files.
Step 8: Build the web bundle (`npm run build`), synchronize with Capacitor (`npx cap sync android`),
        and compile the Android APK (`./gradlew assembleRelease` or `assembleDebug`).

PROCEED AUTONOMOUSLY WITHOUT INTERRUPTION UNTIL HERMES.APK IS COMPILED AND VERIFIED.
================================================================================
```
