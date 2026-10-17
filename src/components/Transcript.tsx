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
    title: 'Explore Workspace',
    prompt: 'Scan the current workspace directory and show an architectural overview.',
    icon: Terminal,
  },
  {
    title: 'Audit System Health',
    prompt: 'Check active gateway connectivity, latency benchmarks, and memory footprint.',
    icon: Shield,
  },
  {
    title: 'Run Diagnostics',
    prompt: 'Verify tools status, RPC methods available, and inspect recent checkpoints.',
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
    const threshold = 120
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
    setIsAutoScrollLocked(isAtBottom)
    setShowScrollBottom(!isAtBottom)
  }, [])

  useEffect(() => {
    if (isAutoScrollLocked) {
      scrollToBottom(false)
    }
  }, [mergedTurns, streamingState?.messageBuffer, isAutoScrollLocked, scrollToBottom])

  const isStreaming = Boolean(streamingState?.isStreaming)
  const streamingTurnId = streamingState?.currentTurnId

  return (
    <div className={`relative flex flex-1 flex-col h-full w-full overflow-hidden bg-[#090a0b] ${className}`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        role="feed"
        aria-busy={isStreaming}
        aria-label="Conversation message transcript"
        className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-4 scroll-smooth"
      >
        {mergedTurns.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#23262d] bg-[#121316] text-[#ff6347] shadow-xl mb-4">
              <Bot className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-[#f3f4f6]">
              Hermes Agent Ready
            </h2>
            <p className="mt-1 max-w-sm text-xs text-[#9ca3af] leading-relaxed">
              Mobile Agent Runtime connected to local and cloud LLM backends. Choose a starter action or type below.
            </p>

            <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-3">
              {STARTER_PROMPTS.map((item, idx) => {
                const Icon = item.icon
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPrompt?.(item.prompt)}
                    className="flex min-h-[52px] flex-col items-start rounded-lg border border-[#23262d] bg-[#121316] p-3 text-left transition-colors hover:border-[#ff6347]/40 hover:bg-[#1a1c20] active:scale-[0.98]"
                    aria-label={`Prompt: ${item.title}`}
                  >
                    <Icon className="h-4 w-4 text-[#ff6347] mb-1.5" />
                    <span className="text-xs font-medium text-[#f3f4f6]">{item.title}</span>
                    <span className="mt-0.5 line-clamp-2 text-[10px] text-[#9ca3af]">
                      {item.prompt}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {mergedTurns.map((turn) => {
          const isThisTurnStreaming = isStreaming && turn.id === streamingTurnId
          return (
            <MessageTurn
              key={turn.id}
              turn={turn}
              isStreaming={isThisTurnStreaming}
              streamingReasoning={isThisTurnStreaming ? streamingState?.reasoningBuffer : undefined}
              activeToolCalls={isThisTurnStreaming ? toolCalls : undefined}
              modelName={modelName}
            />
          )
        })}

        <div ref={bottomAnchorRef} className="h-2 w-full" aria-hidden="true" />
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute right-4 bottom-4 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#23262d] bg-[#121316] text-[#f3f4f6] shadow-xl transition-all hover:bg-[#1a1c20] active:scale-95"
          aria-label="Scroll to newest messages"
        >
          <ArrowDown className="h-4 w-4 text-[#ff6347]" />
        </button>
      )}
    </div>
  )
}

export default Transcript
