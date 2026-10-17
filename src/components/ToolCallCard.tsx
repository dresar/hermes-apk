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

  const formattedArgs =
    Object.keys(tool.args || {}).length > 0
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
      className={`my-1.5 rounded-xl border border-[#23262d] bg-[#121316] font-mono text-xs overflow-hidden ${className}`}
    >
      <div className="flex min-h-[38px] items-center justify-between px-3 py-1.5 bg-[#1a1c20]/80">
        <div className="flex items-center gap-2 overflow-hidden">
          <Terminal className="h-3.5 w-3.5 shrink-0 text-[#ff6347]" />
          <span className="font-medium text-[#f3f4f6] truncate text-[11px]">
            {tool.name}
          </span>
          <span className="text-[10px] text-[#9ca3af] truncate">
            #{tool.tool_id.slice(-4)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {tool.duration !== undefined && (
            <span className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
              <Clock className="h-2.5 w-2.5" />
              {tool.duration < 1
                ? `${Math.round(tool.duration * 1000)}ms`
                : `${tool.duration.toFixed(2)}s`}
            </span>
          )}

          {isRunning && (
            <span className="flex items-center gap-1 rounded-full bg-[#ff6347]/10 px-2 py-0.5 text-[10px] text-[#ff6347] border border-[#ff6347]/30">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Berjalan
            </span>
          )}

          {isCompleted && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Selesai
            </span>
          )}

          {isFailed && (
            <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-2.5 w-2.5" />
              Gagal
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex h-7 w-7 items-center justify-center rounded text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#23262d] transition-colors"
            aria-label="Salin keluaran alat"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {formattedArgs && (
        <details className="group border-t border-[#23262d] bg-[#090a0b]/40">
          <summary
            className="flex min-h-[32px] cursor-pointer items-center justify-between px-3 py-1 text-[10px] text-[#9ca3af] hover:text-[#f3f4f6] select-none list-none"
            aria-label="Tampilkan argumen alat"
          >
            <span className="flex items-center gap-1">
              <FileCode className="h-3 w-3 text-[#9ca3af]" />
              Argumen
            </span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre className="p-2.5 text-[10px] text-[#f3f4f6] overflow-x-auto whitespace-pre leading-relaxed bg-[#090a0b]/80 border-t border-[#23262d]">
            {formattedArgs}
          </pre>
        </details>
      )}

      {tool.inline_diff && (
        <details open className="group border-t border-[#23262d] bg-[#090a0b]/60">
          <summary
            className="flex min-h-[32px] cursor-pointer items-center justify-between px-3 py-1 text-[10px] text-amber-400 hover:text-amber-300 select-none list-none"
            aria-label="Tampilkan diff inline"
          >
            <span>Diff Perubahan</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre className="p-2.5 text-[10px] font-mono text-[#f3f4f6] overflow-x-auto whitespace-pre bg-[#090a0b]">
            {tool.inline_diff}
          </pre>
        </details>
      )}

      {tool.result !== undefined && (
        <details open className="group border-t border-[#23262d] bg-[#090a0b]/80">
          <summary
            className="flex min-h-[32px] cursor-pointer items-center justify-between px-3 py-1 text-[10px] text-[#9ca3af] hover:text-[#f3f4f6] select-none list-none"
            aria-label="Tampilkan hasil alat"
          >
            <span>Hasil Eksekusi</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre className="p-2.5 text-[10px] text-[#f3f4f6] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border-t border-[#23262d]">
            {tool.result || '(keluaran kosong)'}
          </pre>
        </details>
      )}
    </div>
  )
}

export default ToolCallCard
