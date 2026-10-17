import React, { useState, useMemo } from 'react'
import {
  Copy,
  Check,
  Bot,
  Clock,
  Loader2,
} from 'lucide-react'
import type { Turn, ToolCall } from '../api/types'
import { ThinkingDrawer } from './ThinkingDrawer'
import { ToolCallCard } from './ToolCallCard'

export interface MessageTurnProps {
  turn: Turn
  isStreaming?: boolean
  streamingReasoning?: string
  activeToolCalls?: ToolCall[]
  modelName?: string
  className?: string
}

const MarkdownBlock: React.FC<{ content: string }> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const elements = useMemo(() => {
    const lines = content.split('\n')
    const nodes: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBuffer: string[] = []
    let codeLang = ''
    let blockIndex = 0

    const parseInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
      let lastIdx = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          parts.push(text.slice(lastIdx, match.index))
        }
        const m = match[0]
        if (m.startsWith('`') && m.endsWith('`')) {
          parts.push(
            <code
              key={match.index}
              className="rounded bg-[#1a1c20] px-1 py-0.5 font-mono text-[11px] text-[#ff6347] border border-[#23262d]"
            >
              {m.slice(1, -1)}
            </code>
          )
        } else if (m.startsWith('**') && m.endsWith('**')) {
          parts.push(
            <strong key={match.index} className="font-semibold text-[#f3f4f6]">
              {m.slice(2, -2)}
            </strong>
          )
        } else if (m.startsWith('*') && m.endsWith('*')) {
          parts.push(
            <em key={match.index} className="italic text-[#f3f4f6]">
              {m.slice(1, -1)}
            </em>
          )
        } else if (m.startsWith('[') && m.includes('](')) {
          const split = m.indexOf('](')
          const label = m.slice(1, split)
          const url = m.slice(split + 2, -1)
          parts.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff6347] underline underline-offset-2 hover:text-[#ff8570]"
            >
              {label}
            </a>
          )
        }
        lastIdx = regex.lastIndex
      }

      if (lastIdx < text.length) {
        parts.push(text.slice(lastIdx))
      }
      return parts.length > 0 ? parts : [text]
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLang = line.trim().slice(3).trim()
          codeBuffer = []
        } else {
          inCodeBlock = false
          const codeText = codeBuffer.join('\n')
          const currIdx = blockIndex++
          nodes.push(
            <div
              key={`code-${i}`}
              className="my-3 rounded-lg border border-[#23262d] bg-[#090a0b] overflow-hidden font-mono text-xs"
            >
              <div className="flex min-h-[36px] items-center justify-between px-3 py-1 bg-[#121316] border-b border-[#23262d] text-[#9ca3af]">
                <span className="text-[11px] font-medium uppercase tracking-wider">{codeLang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(codeText)
                    setCopiedIndex(currIdx)
                    setTimeout(() => setCopiedIndex(null), 2000)
                  }}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center hover:text-[#f3f4f6] transition-colors"
                  aria-label="Copy code snippet"
                >
                  {copiedIndex === currIdx ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <pre className="p-3 text-[#f3f4f6] overflow-x-auto whitespace-pre leading-relaxed">
                {codeText}
              </pre>
            </div>
          )
        }
        continue
      }

      if (inCodeBlock) {
        codeBuffer.push(line)
        continue
      }

      if (line.startsWith('### ')) {
        nodes.push(
          <h3 key={`h3-${i}`} className="mt-3 mb-1 text-sm font-semibold text-[#f3f4f6]">
            {parseInline(line.slice(4))}
          </h3>
        )
      } else if (line.startsWith('## ')) {
        nodes.push(
          <h2 key={`h2-${i}`} className="mt-4 mb-2 text-base font-semibold text-[#f3f4f6]">
            {parseInline(line.slice(3))}
          </h2>
        )
      } else if (line.startsWith('# ')) {
        nodes.push(
          <h1 key={`h1-${i}`} className="mt-4 mb-2 text-lg font-bold text-[#f3f4f6]">
            {parseInline(line.slice(2))}
          </h1>
        )
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        nodes.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-sm text-[#f3f4f6] leading-relaxed">
            {parseInline(line.slice(2))}
          </li>
        )
      } else if (/^\d+\.\s/.test(line)) {
        const spaceIdx = line.indexOf(' ')
        nodes.push(
          <li key={`ol-${i}`} className="ml-4 list-decimal text-sm text-[#f3f4f6] leading-relaxed">
            {parseInline(line.slice(spaceIdx + 1))}
          </li>
        )
      } else if (line.startsWith('> ')) {
        nodes.push(
          <blockquote
            key={`quote-${i}`}
            className="my-2 border-l-2 border-[#ff6347] pl-3 text-xs italic text-[#9ca3af]"
          >
            {parseInline(line.slice(2))}
          </blockquote>
        )
      } else if (line.trim() === '') {
        nodes.push(<div key={`br-${i}`} className="h-2" />)
      } else {
        nodes.push(
          <p key={`p-${i}`} className="text-sm text-[#f3f4f6] leading-relaxed">
            {parseInline(line)}
          </p>
        )
      }
    }

    if (inCodeBlock && codeBuffer.length > 0) {
      nodes.push(
        <div
          key="code-open"
          className="my-3 rounded-lg border border-[#23262d] bg-[#090a0b] overflow-hidden font-mono text-xs"
        >
          <pre className="p-3 text-[#f3f4f6] overflow-x-auto whitespace-pre leading-relaxed">
            {codeBuffer.join('\n')}
          </pre>
        </div>
      )
    }

    return nodes
  }, [content, copiedIndex])

  return <div className="space-y-1">{elements}</div>
}

export const MessageTurn: React.FC<MessageTurnProps> = ({
  turn,
  isStreaming = false,
  streamingReasoning = '',
  activeToolCalls = [],
  modelName,
  className = '',
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false)
  const isUser = turn.role === 'user'

  const formattedTime = useMemo(() => {
    const d = new Date(turn.timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [turn.timestamp])

  const handleCopyMessage = () => {
    navigator.clipboard?.writeText(turn.content).then(() => {
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    }).catch(() => {})
  }

  const effectiveReasoning = isStreaming && streamingReasoning
    ? streamingReasoning
    : turn.reasoning

  const toolCallsToRender = turn.toolCalls && turn.toolCalls.length > 0
    ? turn.toolCalls
    : activeToolCalls

  if (isUser) {
    return (
      <div
        className={`flex w-full flex-col items-end my-3 px-3 sm:px-4 ${className}`}
        role="article"
        aria-label="User message"
      >
        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#9ca3af]">
          <span>You</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formattedTime}
          </span>
        </div>

        <div className="group relative max-w-[85%] rounded-lg border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-sm text-[#f3f4f6] shadow-sm leading-relaxed whitespace-pre-wrap break-words">
          {turn.content}

          <button
            type="button"
            onClick={handleCopyMessage}
            className="absolute top-1 right-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-[#9ca3af] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#f3f4f6]"
            aria-label="Copy user message"
          >
            {copiedMessage ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex w-full flex-col items-start my-3 px-3 sm:px-4 ${className}`}
      role="article"
      aria-live="polite"
      aria-label="Assistant message"
    >
      <div className="flex items-center justify-between w-full max-w-3xl mb-1 text-[11px] text-[#9ca3af]">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded border border-[#23262d] bg-[#121316] text-[#ff6347]">
            <Bot className="h-3 w-3" />
          </div>
          <span className="font-medium text-[#f3f4f6]">{modelName || 'Hermes'}</span>
          <span className="flex items-center gap-0.5 text-[#9ca3af]">
            <Clock className="h-2.5 w-2.5" />
            {formattedTime}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyMessage}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
          aria-label="Copy response"
        >
          {copiedMessage ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="w-full max-w-3xl space-y-2">
        {effectiveReasoning && (
          <ThinkingDrawer
            reasoning={effectiveReasoning}
            isStreaming={isStreaming && !turn.content}
            defaultOpen={isStreaming}
          />
        )}

        {toolCallsToRender && toolCallsToRender.length > 0 && (
          <div className="space-y-1.5 my-2">
            {toolCallsToRender.map((tc) => (
              <ToolCallCard key={tc.tool_id} tool={tc} />
            ))}
          </div>
        )}

        {isStreaming && !turn.content && (!toolCallsToRender || toolCallsToRender.length === 0) && (
          <div className="flex items-center gap-2 py-1.5 text-xs text-[#ff6347]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="font-medium animate-pulse">
              {effectiveReasoning ? 'Sedang berpikir...' : 'Mengetik...'}
            </span>
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6347] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6347] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6347] animate-bounce" />
            </span>
          </div>
        )}

        {turn.content && (
          <div className="text-sm leading-relaxed text-[#f3f4f6] break-words">
            <MarkdownBlock content={turn.content} />
          </div>
        )}

        {isStreaming && turn.content && (
          <span
            className="inline-block w-1.5 h-4 ml-0.5 bg-[#ff6347] animate-pulse align-middle"
            aria-label="Streaming response in progress"
          />
        )}
      </div>
    </div>
  )
}

export default MessageTurn
