import React, { useState, useEffect } from 'react'
import {
  GitCommit,
  RotateCcw,
  FileDiff,
  FileText,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'

export interface CheckpointDiffFile {
  path: string
  status: 'modified' | 'added' | 'deleted'
  additions: number
  deletions: number
  diffText: string
}

export interface CheckpointItem {
  id: string
  commitHash: string
  timestamp: string
  description: string
  sourceMutation: string
  affectedFiles: number
  additions: number
  deletions: number
  diffs?: CheckpointDiffFile[]
}

export interface RollbackSheetProps {
  isOpen: boolean
  onClose: () => void
  checkpoints?: CheckpointItem[]
  activeSessionId?: string
  onRestore?: (checkpointId: string) => Promise<void> | void
  className?: string
}

const DEFAULT_CHECKPOINTS: CheckpointItem[] = [
  {
    id: 'chk-8912',
    commitHash: '8b9c1d4',
    timestamp: '4 mins ago',
    description: 'Pre-mutation: file_write src/components/PetSprite.tsx',
    sourceMutation: 'file_write',
    affectedFiles: 1,
    additions: 198,
    deletions: 0,
    diffs: [
      {
        path: 'src/components/PetSprite.tsx',
        status: 'added',
        additions: 198,
        deletions: 0,
        diffText: `@@ -0,0 +1,18 @@
+import React, { useEffect, useRef, useState } from 'react'
+export const PetSprite = ({ slug, state, scale }) => {
+  const canvasRef = useRef(null)
+  useEffect(() => {
+    const ctx = canvas.getContext('2d')
+    ctx.imageSmoothingEnabled = false
+  }, [state])
+  return <canvas ref={canvasRef} role="img" />
+}`,
      },
    ],
  },
  {
    id: 'chk-8911',
    commitHash: '3a4f89e',
    timestamp: '18 mins ago',
    description: 'Pre-mutation: bash npx vite build',
    sourceMutation: 'bash',
    affectedFiles: 3,
    additions: 42,
    deletions: 16,
    diffs: [
      {
        path: 'src/App.tsx',
        status: 'modified',
        additions: 24,
        deletions: 10,
        diffText: `@@ -12,8 +12,12 @@
-        <div className="status">Ready</div>
+        <div className="status-badge flex items-center">
+          <span className="dot bg-emerald-500" />
+          <span>Connected to Hermes Gateway</span>
+        </div>`,
      },
      {
        path: 'src/index.css',
        status: 'modified',
        additions: 18,
        deletions: 6,
        diffText: `@@ -1,6 +1,9 @@
 :root {
   --bg-canvas: #090a0b;
   --bg-surface: #121316;
+  --accent-primary: #ff6347;
 }`,
      },
    ],
  },
  {
    id: 'chk-8910',
    commitHash: 'e10d29b',
    timestamp: '1 hour ago',
    description: 'Pre-mutation: git checkout -b work/agy03-petdex-modes',
    sourceMutation: 'git',
    affectedFiles: 2,
    additions: 12,
    deletions: 2,
    diffs: [
      {
        path: 'package.json',
        status: 'modified',
        additions: 12,
        deletions: 2,
        diffText: `@@ -5,2 +5,4 @@
+    "@capacitor/preferences": "^7.0.0",
+    "zustand": "^5.0.0"`,
      },
    ],
  },
]

export const RollbackSheet: React.FC<RollbackSheetProps> = ({
  isOpen,
  onClose,
  checkpoints = DEFAULT_CHECKPOINTS,
  onRestore,
  className = '',
}) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointItem | null>(null)
  const [activeDiffFileIndex, setActiveDiffFileIndex] = useState(0)
  const [confirmingCheckpoint, setConfirmingCheckpoint] = useState<CheckpointItem | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoredSuccessId, setRestoredSuccessId] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (confirmingCheckpoint) {
          setConfirmingCheckpoint(null)
        } else if (selectedCheckpoint) {
          setSelectedCheckpoint(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedCheckpoint, confirmingCheckpoint, onClose])

  const handleExecuteRestore = async (chk: CheckpointItem) => {
    setIsRestoring(true)
    try {
      if (onRestore) {
        await onRestore(chk.id)
      }
      setRestoredSuccessId(chk.id)
      setTimeout(() => {
        setRestoredSuccessId(null)
        setConfirmingCheckpoint(null)
        setSelectedCheckpoint(null)
        onClose()
      }, 900)
    } finally {
      setIsRestoring(false)
    }
  }

  if (!isOpen) return null

  const activeDiff = selectedCheckpoint?.diffs?.[activeDiffFileIndex]

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs transition-opacity ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rollback-sheet-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-2xl border-t border-[#23262d] bg-[#121316] shadow-2xl">
        <div className="flex h-5 w-full items-center justify-center pt-2">
          <div className="h-1 w-12 rounded-full bg-[#23262d]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#23262d] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {selectedCheckpoint ? (
              <button
                type="button"
                onClick={() => setSelectedCheckpoint(null)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label="Back to checkpoint list"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#323640] bg-[#1a1c20] text-[#ff6347]">
                <RotateCcw className="h-4 w-4" />
              </div>
            )}

            <div>
              <h2
                id="rollback-sheet-title"
                className="text-base font-medium tracking-tight text-[#f3f4f6]"
              >
                {selectedCheckpoint
                  ? `Diff: ${selectedCheckpoint.commitHash}`
                  : 'Checkpoints & Rollbacks'}
              </h2>
              <p className="text-xs text-[#9ca3af]">
                {selectedCheckpoint
                  ? selectedCheckpoint.description
                  : 'Mode 7: Pre-mutation Git snapshots'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] transition-colors hover:text-[#f3f4f6]"
            aria-label="Close rollback sheet"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!selectedCheckpoint ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[#9ca3af]">
                  {checkpoints.length} Snapshots Available
                </span>
                <span className="font-mono text-[10px] text-[#ff6347]">rollback.list</span>
              </div>

              {checkpoints.map((chk) => (
                <div
                  key={chk.id}
                  className="flex flex-col rounded-xl border border-[#23262d] bg-[#1a1c20] p-3 transition-colors hover:border-[#323640]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-[#090a0b] text-[#9ca3af]">
                        <GitCommit className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#f3f4f6]">
                        {chk.commitHash}
                      </span>
                      <span className="text-[11px] text-[#9ca3af]">
                        {chk.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-[#10b981]">+{chk.additions}</span>
                      <span className="text-[#ef4444]">-{chk.deletions}</span>
                    </div>
                  </div>

                  <p className="mt-1.5 text-xs text-[#f3f4f6]">
                    {chk.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-[#23262d] pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCheckpoint(chk)
                        setActiveDiffFileIndex(0)
                      }}
                      className="flex min-h-[44px] items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#f3f4f6]"
                      aria-label={`View diff for checkpoint ${chk.commitHash}`}
                    >
                      <FileDiff className="h-3.5 w-3.5 text-[#ff6347]" />
                      <span>View Unified Diff ({chk.affectedFiles} files)</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmingCheckpoint(chk)}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#ff6347]/40 bg-[#ff6347]/10 px-3 text-xs font-medium text-[#ff6347] transition-colors hover:bg-[#ff6347]/20"
                      aria-label={`Restore checkpoint ${chk.commitHash}`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCheckpoint.diffs && selectedCheckpoint.diffs.length > 1 && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {selectedCheckpoint.diffs.map((file, idx) => {
                    const isTabActive = idx === activeDiffFileIndex
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setActiveDiffFileIndex(idx)}
                        className={`flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-mono transition-colors ${
                          isTabActive
                            ? 'rounded-lg border border-[#ff6347]/50 bg-[#ff6347]/15 text-[#ff6347]'
                            : 'rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]'
                        }`}
                        aria-pressed={isTabActive}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{file.path.split('/').pop()}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {activeDiff && (
                <div className="rounded-xl border border-[#23262d] bg-[#090a0b] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#23262d] bg-[#1a1c20] px-3 py-2 font-mono text-[11px] text-[#9ca3af]">
                    <span>{activeDiff.path}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#10b981]">+{activeDiff.additions}</span>
                      <span className="text-[#ef4444]">-{activeDiff.deletions}</span>
                    </div>
                  </div>

                  <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
                    {activeDiff.diffText.split('\n').map((line, lIdx) => {
                      let lineClass = 'text-[#9ca3af]'
                      let bgClass = ''
                      if (line.startsWith('+')) {
                        lineClass = 'text-[#34d399]'
                        bgClass = 'bg-[#10b981]/10 -mx-3 px-3 block'
                      } else if (line.startsWith('-')) {
                        lineClass = 'text-[#f87171]'
                        bgClass = 'bg-[#ef4444]/10 -mx-3 px-3 block'
                      } else if (line.startsWith('@')) {
                        lineClass = 'text-[#818cf8]'
                      }
                      return (
                        <div key={lIdx} className={`${lineClass} ${bgClass}`}>
                          {line || ' '}
                        </div>
                      )
                    })}
                  </pre>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingCheckpoint(selectedCheckpoint)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#ff6347] bg-[#ff6347] text-xs font-semibold text-[#090a0b] transition-transform active:scale-95"
                  aria-label={`Restore to snapshot ${selectedCheckpoint.commitHash}`}
                >
                  <RotateCcw className="h-4 w-4" />
                  One-Tap Instant Restore
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmingCheckpoint && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-restore-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#23262d] bg-[#121316] p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-[#ff6347]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff6347]/40 bg-[#ff6347]/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3
                id="confirm-restore-title"
                className="text-base font-semibold text-[#f3f4f6]"
              >
                Confirm Git Rollback
              </h3>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#9ca3af]">
              Are you sure you want to rollback to checkpoint{' '}
              <strong className="font-mono text-[#f3f4f6]">
                {confirmingCheckpoint.commitHash}
              </strong>
              ? All working tree mutations after this checkpoint will be reset.
            </p>

            <div className="mt-2 rounded-lg border border-[#23262d] bg-[#1a1c20] p-2.5 font-mono text-[11px] text-[#f3f4f6]">
              {confirmingCheckpoint.description}
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmingCheckpoint(null)}
                disabled={isRestoring}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#23262d] bg-[#1a1c20] text-xs font-medium text-[#f3f4f6] transition-colors hover:border-[#323640]"
                aria-label="Cancel rollback"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleExecuteRestore(confirmingCheckpoint)}
                disabled={isRestoring}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ff6347] bg-[#ff6347] text-xs font-semibold text-[#090a0b] transition-transform active:scale-95 disabled:opacity-50"
                aria-label="Confirm and execute rollback"
              >
                {isRestoring ? (
                  <span>Restoring...</span>
                ) : restoredSuccessId === confirmingCheckpoint.id ? (
                  <>
                    <Check className="h-4 w-4" />
                    Restored!
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Restore Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RollbackSheet
