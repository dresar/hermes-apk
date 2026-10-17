# SPECIFICATION 02: UI/UX, ANTI-SLOP STANDARDS & THE 5,086 PETDEX MASCOT SYSTEM

## 1. Design Direction & Anti-Slop Principles

This design specification enforces strict compliance with the **Anti-Slop** design system (`/antislop`, `/antislop-layoutmobile`, `/antislop-ui`, and `/ui-ux-text`). The resulting application feels **crafted by a senior product designer**, eliminating generic AI-generated tropes.

### 1.1 Forbidden AI Patterns (Hard Bans)
1. **No Generic Blue-Purple Gradients**: No cyan-to-purple or radial gradient glow blobs behind cards or headings (R-01).
2. **No Pill-Shape Overload**: Strictly avoid pill-shaped buttons, inputs, and cards. Use structured, subtle rectangular rounding (6px to 8px) with crisp edges (R-11).
3. **No Excessive Glassmorphism**: Glass blur (`backdrop-filter: blur()`) is capped at a maximum of **one** floating element (the top navigation bar). All cards, dialogs, and sheets are solid matte surfaces (R-10).
4. **No Em Dashes (`—`)**: Use standard commas, colons, or parentheses. Never use em dashes in user-facing copy (R-02).
5. **No Fake Badges or Buzzwords**: Eliminate badges like "AI Powered", "Seamless", "Revolutionary", or "Next-Gen" (R-09, R-16).
6. **No Dead or Decorative Controls**: Every icon, button, and link must trigger a real action or state change (R-26).
7. **No Uniform 12-Column Grid on Mobile**: Layouts collapse to a clean single column on mobile (R-03).
8. **No Horizontal Scroll Leak**: Page content must never overflow horizontally at 320px minimum viewport width (R-03).

---

## 2. Color System & Design Tokens

A developer-focused dark palette optimized for OLED displays and long sessions:

| Token Name | Hex Value | Usage / Semantic Role |
| :--- | :--- | :--- |
| `bg-canvas` | `#090a0b` | Main application background (Deep Obsidian) |
| `bg-surface` | `#121316` | Cards, drawer sheets, modal dialogs |
| `bg-surface-elevated`| `#1a1c20` | Hover states, active list selections |
| `border-subtle` | `#23262d` | Container borders, dividers, subtle outlines |
| `border-strong` | `#323640` | Focused input borders, active toggles |
| `accent-primary`| `#ff6347` | Hermes Coral / Tomato (1 deliberate accent color) |
| `accent-muted` | `#3b1d18` | Background tint for active badges / chips |
| `text-primary` | `#f3f4f6` | High-contrast body text, headings (WCAG AAA) |
| `text-muted` | `#9ca3af` | Secondary labels, timestamps, metadata |
| `status-ok` | `#10b981` | Gateway connected, process running |
| `status-danger`| `#ef4444` | Gateway disconnected, turn error, abort button |
| `status-warning`| `#f59e0b` | Dangerous tool approval prompt |

---

## 3. The 5,086 Petdex Mascot System

Hermes Agent incorporates a complete living companion system with **5,086 verified pets** sourced from the Petdex catalog (`https://petdex.dev/api/manifest`). The mobile app provides a dedicated companion canvas rendering the active mascot and syncing animations to real-time agent execution states.

```text
┌────────────────────────────────────────────────────────┐
│               PETDEX SPRITESHEET ATLAS                 │
│               Total Size: 1536 × 1872 px               │
│               8 Columns × 9 Rows                       │
├─────────┬───────────────────┬──────────────────────────┤
│ Row 0   │ idle              │ Resting / neutral state  │
│ Row 1   │ running-right     │ Autonomous walking right │
│ Row 2   │ running-left      │ Autonomous walking left  │
│ Row 3   │ waving / wave     │ Greeting / turn complete │
│ Row 4   │ jumping / jump    │ Celebration / success    │
│ Row 5   │ failed            │ Tool error / exception   │
│ Row 6   │ waiting           │ Awaiting user approval   │
│ Row 7   │ running / run     │ Tool execution active    │
│ Row 8   │ review            │ Reasoning / thinking     │
└─────────┴───────────────────┴──────────────────────────┘
```

### 3.1 Sprite Geometry & Frame Stepper Engine
- **Cell Size**: `192px × 208px`.
- **Frames per Animation**: 6 frames per row (columns 0 through 5).
- **Cycle Duration**: `1100ms` (~183ms per frame), stepped via `requestAnimationFrame`.
- **Display Scale**: Scaled down by default (`scale = 0.33` produces an effective size of `~63px × 68px`).
- **Interactive State Binding**:
  - Agent state `thinking` (emitting `reasoning.delta`) ➔ Row 8 (`review`).
  - Agent state `executing` (emitting `tool.start`) ➔ Row 7 (`running`).
  - Agent state `approval_required` (waiting on user) ➔ Row 6 (`waiting`).
  - Agent state `idle` (ready for input) ➔ Row 0 (`idle`) with periodic roaming.
  - Turn completed successfully ➔ Row 3 (`waving`) for 2 seconds.
  - Tool execution error ➔ Row 5 (`failed`) for 3 seconds.

### 3.2 Two-Phase Gallery & 96px Thumbnail Optimization
Loading all 5,086 WebP spritesheets on mobile would cause extreme memory exhaustion. The mobile client follows Hermes's two-phase loading protocol:
1. **Phase 1 (Instant Local Render)**: Calls `pet.gallery({ localOnly: true })` to populate installed pets immediately from device cache.
2. **Phase 2 (Lazy-Loaded Catalog)**: Fetches `https://petdex.dev/api/manifest` in the background. The Pet Gallery Grid renders lightweight **96px base64 thumbnails** requested via `pet.thumb({ slug, url })` (or cropped client-side from frame 0).
3. **Mascot Selection**: Tapping a pet calls `pet.select({ slug })`, downloading the full spritesheet to local storage and updating the active companion.

### 3.3 Affection Vibe Reactions (Floating Hearts)
When the user sends praise or affection in chat (e.g. *"good bot"*, *"thank you"*, *"nice job"*, *"<3"*), the client detects the event or receives server event `reaction: { kind: "hearts" }`. The pet displays an animated burst of floating pixel hearts over the canvas!

---

## 4. Mobile Layout & Screen Architecture

### 4.1 Dynamic Viewport & Safe-Area Bounds
Mobile keyboards frequently push input bars off-screen. The app binds its root container to `window.visualViewport`:
```css
.app-container {
  height: 100dvh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### 4.2 Top Floating Navigation Bar
- **Styling**: `backdrop-blur-md bg-[#090a0b]/80 border-b border-[#23262d] px-4 py-2.5 flex items-center justify-between`.
- **Left**: Active Gateway status dot (Green = connected, Red = disconnected) + server latency badge (`24ms`).
- **Center**: Active Session Title with tap-to-open session switcher drawer.
- **Right**: Active Pet Mascot Canvas (`44px` tap target to open Pet Gallery) + Model Chip (e.g. `hermes (high)`).

### 4.3 Streaming Transcript Feed
- **Container**: `flex-1 overflow-y-auto px-4 py-3 space-y-4`.
- **User Turn**: Compact card aligned right, `bg-[#1a1c20] text-[#f3f4f6] rounded-lg p-3 max-w-[85%] border border-[#23262d]`.
- **Assistant Turn**: Clean left-aligned container with Markdown rendering.
- **Collapsible Reasoning Card**:
  ```html
  <details class="bg-[#121316] border border-[#23262d] rounded-md p-3 text-xs text-[#9ca3af]">
    <summary class="cursor-pointer font-medium text-[#f3f4f6]">Thought Process (Streaming...)</summary>
    <div class="mt-2 font-mono whitespace-pre-wrap">{reasoningText}</div>
  </details>
  ```
- **Inline Tool Execution Card**:
  Monospace card displaying tool name (e.g. `run_command`), arguments, execution spinner, and expandable stdout block.

### 4.4 Interactive Server Request Modals
1. **Approval Modal (Dangerous Actions)**:
   - Triggered by `approval` server request.
   - Shows high-visibility warning banner, command text, and animated **300-second countdown bar**.
   - Actions: `Allow Once`, `Allow for Session`, `Allow Always`, `Deny`.
2. **Clarify Modal (Structured Questions)**:
   - Triggered by `clarify` server request.
   - Renders interactive selection chips for multi-choice agent questions with single-tap answer submission.

### 4.5 Bottom Input Composer
- **Input Area**: Auto-growing textarea (1 to 4 lines), `bg-[#121316] text-[#f3f4f6] rounded-md px-3 py-2 text-sm border border-[#23262d]`.
- **Controls**:
  - File / Photo Attachment button (`44px` touch target).
  - Voice Push-to-Talk recording button with live audio waveform.
  - Send / Stop button: Instantly swaps to red Stop square while turn is generating.
