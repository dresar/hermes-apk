import React, { useEffect, useState } from 'react'
import { Clock, Terminal, Copy, Check, ShieldAlert } from 'lucide-react'
import type { ApprovalRequest } from '../api/types'

export interface ApprovalModalProps {
  request: ApprovalRequest | null
  onRespond: (choice: 'once' | 'session' | 'always' | 'deny') => void
}

const TOTAL_COUNTDOWN_SECONDS = 300

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ request, onRespond }) => {
  const [copied, setCopied] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_COUNTDOWN_SECONDS)

  useEffect(() => {
    if (!request) return

    const computeInitialSeconds = () => {
      if (request.expiresAt) {
        const diff = Math.max(0, Math.floor((request.expiresAt - Date.now()) / 1000))
        return Math.min(diff, TOTAL_COUNTDOWN_SECONDS)
      }
      return TOTAL_COUNTDOWN_SECONDS
    }

    setSecondsRemaining(computeInitialSeconds())

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onRespond('deny')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [request, onRespond])

  if (!request) return null

  const handleCopy = () => {
    navigator.clipboard?.writeText(request.command).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / TOTAL_COUNTDOWN_SECONDS) * 100))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[#23262d] bg-[#121316] shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-[#1a1c20]">
          <div
            className="h-full bg-[#ff6347] transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 id="approval-title" className="text-base font-semibold text-[#f3f4f6]">
                  Permission Approval Required
                </h3>
                <p className="text-xs text-[#9ca3af]">
                  The agent wants to execute a sensitive terminal operation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded bg-[#1a1c20] px-2 py-1 text-xs font-mono text-[#9ca3af] border border-[#23262d] shrink-0">
              <Clock className="h-3 w-3 text-[#ff6347]" />
              <span>{secondsRemaining}s</span>
            </div>
          </div>

          {request.description && (
            <p className="mb-3 text-xs text-[#9ca3af] leading-relaxed">
              {request.description}
            </p>
          )}

          <div className="relative my-3 rounded-lg border border-[#23262d] bg-[#090a0b] p-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#23262d] text-[11px] text-[#9ca3af]">
              <span className="flex items-center gap-1">
                <Terminal className="h-3.5 w-3.5 text-[#ff6347]" />
                Command to execute
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label="Copy approval command"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <pre className="text-[#f3f4f6] whitespace-pre-wrap break-all leading-relaxed max-h-36 overflow-y-auto">
              {request.command}
            </pre>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => onRespond('once')}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] px-3 text-xs font-medium text-[#f3f4f6] transition-colors hover:border-[#ff6347]/50 hover:bg-[#23262d] active:scale-95"
              aria-label="Allow command once"
            >
              Allow Once
            </button>
            <button
              type="button"
              onClick={() => onRespond('session')}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] px-3 text-xs font-medium text-[#f3f4f6] transition-colors hover:border-[#ff6347]/50 hover:bg-[#23262d] active:scale-95"
              aria-label="Allow command for session"
            >
              Allow for Session
            </button>
            <button
              type="button"
              onClick={() => onRespond('always')}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-[#ff6347]/40 bg-[#ff6347]/10 px-3 text-xs font-medium text-[#ff6347] transition-colors hover:bg-[#ff6347]/20 active:scale-95"
              aria-label="Allow command always"
            >
              Allow Always
            </button>
            <button
              type="button"
              onClick={() => onRespond('deny')}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20 active:scale-95"
              aria-label="Deny command execution"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApprovalModal
