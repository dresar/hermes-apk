import { Shield } from 'lucide-react'

export default function App() {
  return (
    <main className="safe-area flex h-full w-full flex-col items-center justify-center bg-[var(--bg-canvas)] px-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-elevated)] text-[var(--accent-primary)]">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-neutral-100">
          Hermes
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          Mobile Agent Runtime
        </p>
        <div className="mt-6 flex w-full items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] py-2 text-xs font-mono text-neutral-300">
          Ready
        </div>
      </div>
    </main>
  )
}
