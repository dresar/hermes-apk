# SPECIFICATION 02: UI/UX & ANTI-SLOP DESIGN STANDARD

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

## 3. Typography & Sizing

Fluid typography responding to viewport scale without arbitrary breakpoints:

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --text-xs: clamp(0.70rem, 0.65rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.80rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.90rem, 0.85rem + 0.25vw, 1.00rem);
  --text-lg: clamp(1.05rem, 0.98rem + 0.35vw, 1.15rem);
  --text-xl: clamp(1.20rem, 1.10rem + 0.50vw, 1.35rem);
}
```

---

## 4. Mobile Component Specifications

### 4.1 Buttons & Interactive Controls
- **Height**: 34px to 38px (compact density).
- **Corner Radius**: `rounded-md` (6px) to `rounded-lg` (8px). Never pill (`rounded-full`).
- **Touch Padding**: Minimum 44px × 44px invisible tap target container via touch-action padding.
- **Active State**: Micro-scale transition `active:scale-[0.98]` with instantaneous 100ms spring release.
- **Focus Outline**: 2px solid `#ff6347` with 2px offset for keyboard accessibility (R-32).

### 4.2 Top Navigation Bar (Floating Glass Bar)
- **Position**: Sticky top with `z-index: 40`.
- **Styling**: `backdrop-blur-md bg-[#090a0b]/80 border-b border-[#23262d]`.
- **Elements**:
  - Left: Gateway Status Indicator (Green/Red dot + Server Name).
  - Center: Session Picker Dropdown with search filter.
  - Right: Active Model Chip (e.g. `hermes (high)`). Tapping opens Model Bottom Sheet.

### 4.3 Streaming Transcript Area
- **Container**: `flex-1 overflow-y-auto px-4 py-3 space-y-4`.
- **Turns**:
  - **User Turn**: Right-aligned, `bg-[#1a1c20] text-[#f3f4f6] rounded-lg p-3 max-w-[85%] border border-[#23262d]`.
  - **Assistant Turn**: Full-width or left-aligned, `bg-transparent text-[#f3f4f6] py-1`.
  - **Thinking / Reasoning Section**: Collapsible drawer with subtle left border (`border-l-2 border-[#323640] pl-3 py-1 text-xs text-[#9ca3af] italic`).
  - **Tool Execution Card**: Inline monospace block showing tool name, arguments, and expandable standard output.
- **Scroll Behavior**: Auto-pins to bottom during active token stream; unpins if user scrolls up to read history.

### 4.4 Live Background Activity Strip
- Rendered directly above the composer when background tasks or delegated subagents are active:
- **Styling**: `bg-[#121316] border-t border-[#23262d] px-4 py-2 flex items-center justify-between`.
- **Content**: Running icon, command string (e.g. `npm run test`), streaming output tail, Stop button.

### 4.5 Bottom Input Composer
- **Position**: Sticky bottom with safe-area padding (`pb-[env(safe-area-inset-bottom)]`).
- **Styling**: `bg-[#090a0b] border-t border-[#23262d] p-3`.
- **Input Field**: Auto-expanding textarea (1 to 5 lines), `bg-[#121316] text-[#f3f4f6] rounded-md px-3 py-2 text-sm border border-[#23262d] focus:border-[#ff6347] focus:outline-none`.
- **Action Buttons**:
  - File / Photo Attachment icon button (`44px` tap target).
  - Voice Recording / Dictation button.
  - Send / Stop toggle button: Changes to red square Stop button while generation is active.

### 4.6 Model Switcher Bottom Sheet
- **Modal Container**: Slides from bottom, `bg-[#121316] rounded-t-xl border-t border-[#23262d] max-h-[85dvh] p-5`.
- **Model List**: Radio cards displaying model identifier, context limit, and provider badge.
- **Thinking Level Segment**: Stepped selector (`None`, `Low`, `Med`, `High`, `Max`).
- **Safety Confirmation**: If switching resets active session context, display explicit prompt: *"Switching to [Model] will branch or clear current context. Continue?"* with Cancel and Confirm buttons.

### 4.7 Gateway Connection Vault & API Keys Screen
- **Gateways List**: Card list of saved gateways with ping latency badge (e.g. `24ms`), active checkmark, and delete action.
- **Add Gateway Form**:
  - Server URL input (`http://100.x.y.z:9119` or `https://...`).
  - Username input.
  - Password input (masked).
  - Test Connection button with immediate HTTP probe.
- **AI Provider Key Manager**:
  - Provider Selector: Custom Proxy, OpenAI, Anthropic, Ollama.
  - Custom Base URL input (e.g. `http://127.0.0.1:20128/v1`).
  - API Key input.
