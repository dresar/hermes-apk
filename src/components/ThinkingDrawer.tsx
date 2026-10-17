import React, { useState } from 'react'
import { Brain, ChevronDown, Loader2 } from 'lucide-react'

export interface ThinkingDrawerProps {
  reasoning?: string
  isStreaming?: boolean
  defaultOpen?: boolean
  className?: string
}

export const ThinkingDrawer: React.FC<ThinkingDrawerProps> = ({
  reasoning = '',
  isStreaming = false,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || isStreaming)

  if (!reasoning && !isStreaming) {
    return null
  }

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      className={`group my-2 rounded-lg border border-[#23262d] bg-[#121316] overflow-hidden ${className}`}
    >
      <summary
        className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 py-2 text-xs font-mono text-[#9ca3af] select-none hover:bg-[#1a1c20] transition-colors list-none"
        aria-label="Toggle thinking process"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#ff6347]" />
          <span className="font-medium text-[#f3f4f6]">Reasoning</span>
          {isStreaming ? (
            <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-[#ff6347]/10 text-[#ff6347] border border-[#ff6347]/30">
              <Loader2 className="h-3 w-3 animate-spin" />
              Streaming
            </span>
          ) : (
            <span className="rounded px-1.5 py-0.5 text-[10px] bg-[#1a1c20] text-[#9ca3af] border border-[#23262d]">
              Thought
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ChevronDown
            className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </summary>

      <div className="border-t border-[#23262d] bg-[#090a0b]/60 px-3 py-2.5 font-mono text-xs leading-relaxed text-[#9ca3af] whitespace-pre-wrap overflow-x-auto max-h-72 overflow-y-auto">
        {reasoning}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#ff6347] animate-pulse align-middle" />
        )}
      </div>
    </details>
  )
}

export default ThinkingDrawer
