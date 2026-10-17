import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { ArrowDown, Bot, Terminal, Shield, Cpu } from 'lucide-react'
import type { Turn, ToolCall, ActiveTurnStreamingState } from '../api/types'
import { MessageTurn } from './MessageTurn'

export interface TranscriptProps {
  turns: Turn[]
  streamingState?: ActiveTurnStreamingState
  toolCalls?: ToolCall[]
  modelName?: string
  onSelectPrompt?: (prompt: string) => void
  className?: string
}

const STARTER_PROMPTS = [
  {
    title: 'Cek Workspace',
    prompt: 'Periksa berkas dan workspace saat ini.',
    icon: Terminal,
  },
  {
    title: 'Status Gateway',
    prompt: 'Periksa koneksi gateway, status latensi, dan model aktif.',
    icon: Shield,
  },
  {
    title: 'Diagnostik Alat',
    prompt: 'Jalankan diagnostik alat dan periksa RPC method.',
    icon: Cpu,
  },
]

export const Transcript: React.FC<TranscriptProps> = ({
  turns,
  streamingState,
  toolCalls = [],
  modelName,
  onSelectPrompt,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null)
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(true)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const isStreaming = Boolean(streamingState?.isStreaming)
  const streamingTurnId = streamingState?.currentTurnId

  const mergedTurns = useMemo(() => {
    const list: Turn[] = []
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i]
      if (list.length > 0) {
        const prev = list[list.length - 1]
        if (
          prev.role === 'assistant' &&
          turn.role === 'assistant' &&
          (turn._length_continuation_nudge || turn.id === prev.id)
        ) {
          list[list.length - 1] = {
            ...prev,
            content: prev.content + turn.content,
            reasoning: prev.reasoning || turn.reasoning,
            toolCalls: [...(prev.toolCalls || []), ...(turn.toolCalls || [])],
          }
          continue
        }
      }
      list.push({ ...turn })
    }
    return list
  }, [turns])

  const allTurns = useMemo(() => {
    const list = [...mergedTurns]
    if (
      isStreaming &&
      streamingTurnId &&
      !list.some((t) => t.id === streamingTurnId)
    ) {
      list.push({
        id: streamingTurnId,
        role: 'assistant',
        content: streamingState?.messageBuffer || '',
        reasoning: streamingState?.reasoningBuffer || '',
        timestamp: Date.now(),
      })
    }
    return list
  }, [
    mergedTurns,
    isStreaming,
    streamingTurnId,
    streamingState?.messageBuffer,
    streamingState?.reasoningBuffer,
  ])

  const scrollToBottom = useCallback((smooth = true) => {
    if (!bottomAnchorRef.current) return
    bottomAnchorRef.current.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    })
    setIsAutoScrollLocked(true)
    setShowScrollBottom(false)
  }, [])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const threshold = 100
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
    setIsAutoScrollLocked(isAtBottom)
    setShowScrollBottom(!isAtBottom)
  }, [])

  useEffect(() => {
    if (isAutoScrollLocked) {
      scrollToBottom(false)
    }
  }, [
    allTurns,
    streamingState?.messageBuffer,
    streamingState?.reasoningBuffer,
    isAutoScrollLocked,
    scrollToBottom,
  ])

  return (
    <div
      className={`relative flex flex-1 flex-col h-full w-full overflow-hidden bg-[#090a0b] ${className}`}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        role="feed"
        aria-busy={isStreaming}
        aria-label="Riwayat percakapan"
        className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-4 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto w-full px-3 sm:px-4">
          {allTurns.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#23262d] bg-[#121316] text-[#ff6347] shadow-lg mb-3">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold tracking-tight text-[#f3f4f6]">
                Hermes
              </h2>
              <p className="mt-1 text-xs text-[#9ca3af]">
                Siap membantu Anda.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-sm">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectPrompt?.(item.prompt)}
                      className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#23262d] bg-[#121316] px-3.5 py-1.5 text-xs text-[#f3f4f6] hover:border-[#ff6347]/40 hover:bg-[#1a1c20] transition-colors cursor-pointer active:scale-95"
                      aria-label={`Pilih ${item.title}`}
                    >
                      <Icon className="h-3.5 w-3.5 text-[#ff6347]" />
                      <span>{item.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {allTurns.map((turn) => {
            const isThisTurnStreaming = isStreaming && turn.id === streamingTurnId
            return (
              <MessageTurn
                key={turn.id}
                turn={turn}
                isStreaming={isThisTurnStreaming}
                streamingReasoning={
                  isThisTurnStreaming ? streamingState?.reasoningBuffer : undefined
                }
                activeToolCalls={isThisTurnStreaming ? toolCalls : undefined}
                modelName={modelName}
              />
            )
          })}

          <div ref={bottomAnchorRef} className="h-2 w-full" aria-hidden="true" />
        </div>
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute right-4 bottom-4 z-20 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-[#23262d] bg-[#121316] text-[#f3f4f6] shadow-xl transition-all hover:bg-[#1a1c20] active:scale-95"
          aria-label="Gulir ke pesan terbaru"
        >
          <ArrowDown className="h-4 w-4 text-[#ff6347]" />
        </button>
      )}
    </div>
  )
}

export default Transcript
