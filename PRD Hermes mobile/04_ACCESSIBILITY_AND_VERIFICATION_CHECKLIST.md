# SPECIFICATION 04: ACCESSIBILITY & VERIFICATION CHECKLIST

## 1. Accessibility Engineering Standards (`/a11y-debugging`)

The mobile gateway interface must be fully accessible to screen readers, keyboard-only operators, switch devices, and users with vision impairments.

### 1.1 Semantic Structure & Landmarks
- **Root Landmark**: `<main id="app-root" className="h-full flex flex-col">`.
- **Top Header**: `<header role="banner">` containing navigation controls and active pet companion.
- **Transcript Feed**: `<section role="feed" aria-label="Conversation messages">`.
- **Composer**: `<form role="region" aria-label="Message input composer">`.

### 1.2 ARIA Live Regions for Streaming Tokens
When Hermes Agent streams responses over WebSocket, screen readers must announce updates smoothly without flooding the speech synthesizer:
- **Assistant Message Container**:  
  `aria-live="polite"` and `aria-atomic="false"`.  
  New tokens append without resetting speech buffers.
- **Thinking Drawer**:  
  `<details>` element with `<summary>` labeled `aria-label="Agent reasoning process"`.
- **Tool Output Terminal**:  
  `<pre role="log" aria-label="Tool execution logs">` with `aria-live="off"`.

### 1.3 Pet Mascot Accessibility & Reduced Motion
- **Companion Canvas**:  
  `<canvas role="img" aria-label="Pet companion {petName}, currently {petState}">`
- **Reduced Motion Respect**:  
  When `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is active, sprite frame stepping stops, rendering a static resting frame (frame 0) instead of cycling through animations.

### 1.4 Icon Buttons & Tap Targets
Every icon-only button must have an explicit, descriptive `aria-label`:
- Attachment button: `aria-label="Attach file or screenshot"`
- Voice record button: `aria-label="Record voice prompt"`
- Send button: `aria-label="Send prompt"`
- Stop button: `aria-label="Stop agent turn"`
- Model chip: `aria-label="Select active model, currently {model_name}"`
- Gateway status indicator: `aria-label="Gateway status: connected to {gateway_name}"`
- Pet mascot button: `aria-label="Open pet gallery, currently {pet_name}"`

**Minimum Tap Target Size**: Every interactive control must have at least **44px × 44px** active touch bounding area, regardless of visual icon size.

### 1.5 Color Contrast Compliance (WCAG AA)
- Normal body text (`#f3f4f6`) on canvas (`#090a0b`): **18.2:1** (Passes AAA).
- Secondary muted text (`#9ca3af`) on surface (`#121316`): **7.8:1** (Passes AAA).
- Primary Coral Accent (`#ff6347`) on canvas (`#090a0b`): **6.2:1** (Passes AA).
- Active error/danger text (`#ef4444`) on surface (`#121316`): **4.9:1** (Passes AA).

---

## 2. Quality & Verification Test Matrix

Before marking the implementation as complete, execute this verification matrix:

| ID | Test Scenario | Expected Outcome | Status |
| :---: | :--- | :--- | :---: |
| **V-01** | `POST /auth/password-login` | Valid credentials return cookie; invalid return 401 | [ ] |
| **V-02** | `POST /api/auth/ws-ticket` | Returns single-use ticket string within 200ms | [ ] |
| **V-03** | `client.capabilities` Handshake | Immediate reply `server_requests: true` sent upon `gateway.ready` | [ ] |
| **V-04** | Streaming Text & Thinking | `reasoning.delta` folds in details card; `message.delta` streams clean Markdown | [ ] |
| **V-05** | Continuation Nudge Collapse | Length continuation fragments merge seamlessly without duplicate turns | [ ] |
| **V-06** | Lossless Sequence Replay | Calling `session.events.since` on reconnect recovers all dropped tokens | [ ] |
| **V-07** | Petdex Manifest & Thumbnails | `https://petdex.dev/api/manifest` loads 5,086 pets; thumbnails render without OOM | [ ] |
| **V-08** | Pet Animation State Sync | Mascot transitions: Row 8 during thinking, Row 7 during tools, Row 6 on approval | [ ] |
| **V-09** | Vibe Hearts Reaction | Typing praise ("good bot", "thank you") triggers floating hearts animation | [ ] |
| **V-10** | Approval Modal 300s Timer | Dangerous bash command displays countdown bar and responds with choice | [ ] |
| **V-11** | Zero-Comment Check | `grep -rn "//" src/` returns 0 results across all source code | [ ] |
| **V-12** | TypeScript Compile | `tsc --noEmit` exits with status code 0 | [ ] |
| **V-13** | APK Generation | Gradle assemble successfully compiles and copies output to `HERMES.APK` | [ ] |
