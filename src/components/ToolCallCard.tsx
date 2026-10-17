import React, { useState } from 'react'
import {
  Terminal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  Copy,
  Check,
  FileCode,
} from 'lucide-react'
import type { ToolCall } from '../api/types'

export interface ToolCallCardProps {
  tool: ToolCall
  className?: string
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ tool, className = '' }) => {
  const [copied, setCopied] = useState(false)
  const isRunning = tool.status === 'executing' || tool.status === 'pending'
  const isFailed = tool.status === 'failed'
  const isCompleted = tool.status === 'completed'

  const formattedArgs = Object.keys(tool.args || {}).length > 0
    ? JSON.stringify(tool.args, null, 2)
    : null

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const content = tool.result || tool.inline_diff || formattedArgs || ''
    if (!content) return
    navigator.clipboard?.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div
      className={`my-2 rounded-lg border border-[#23262d] bg-[#121316] font-mono text-xs overflow-hidden ${className}`}
    >
      <div className="flex min-h-[44px] items-center justify-between px-3 py-2 bg-[#1a1c20] border-b border-[#23262d]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Terminal className="h-4 w-4 shrink-0 text-[#ff6347]" />
          <span className="font-semibold text-[#f3f4f6] truncate">{tool.name}</span>
          <span className="text-[10px] text-[#9ca3af] truncate">id:{tool.tool_id.slice(-6)}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tool.duration !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
              <Clock className="h-3 w-3" />
              {tool.duration < 1 ? `${Math.round(tool.duration * 1000)}ms` : `${tool.duration.toFixed(2)}s`}
            </span>
          )}

          {isRunning && (
            <span className="flex items-center gap-1 rounded bg-[#ff6347]/10 px-2 py-0.5 text-[11px] text-[#ff6347] border border-[#ff6347]/30">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </span>
          )}

          {isCompleted && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          )}

          {isFailed && (
            <span className="flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-3 w-3" />
              Failed
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
            aria-label="Copy tool output"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {formattedArgs && (
        <details className="group border-b border-[#23262d] bg-[#090a0b]/40">
          <summary
            className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 py-1.5 text-[11px] text-[#9ca3af] hover:text-[#f3f4f6] select-none list-none"
            aria-label="Toggle tool arguments"
          >
            <span className="flex items-center gap-1">
              <FileCode className="h-3 w-3 text-[#9ca3af]" />
              Arguments
            </span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre className="p-3 text-[11px] text-[#f3f4f6] overflow-x-auto whitespace-pre leading-relaxed bg-[#090a0b]/80 border-t border-[#23262d]">
            {formattedArgs}
          </pre>
        </details>
      )}

      {tool.inline_diff && (
        <details open className="group border-b border-[#23262d] bg-[#090a0b]/60">
          <summary
            className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 py-1.5 text-[11px] text-amber-400 hover:text-amber-300 select-none list-none"
            aria-label="Toggle diff view"
          >
            <span>Inline Diff</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre className="p-3 text-[11px] font-mono text-[#f3f4f6] overflow-x-auto whitespace-pre bg-[#090a0b]">
            {tool.inline_diff}
          </pre>
        </details>
      )}

      {tool.result !== undefined && (
        <details open className="group bg-[#090a0b]/80">
          <summary
            className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 py-1.5 text-[11px] text-[#9ca3af] hover:text-[#f3f4f6] select-none list-none"
            aria-label="Toggle stdout output"
          >
            <span>Stdout / Result</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre className="p-3 text-[11px] text-[#f3f4f6] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border-t border-[#23262d]">
            {tool.result || '(empty output)'}
          </pre>
        </details>
      )}
    </div>
  )
}

export default ToolCallCard
