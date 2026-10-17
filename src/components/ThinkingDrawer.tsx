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
      className={`group my-2 rounded-xl border border-[#23262d] bg-[#121316] overflow-hidden ${className}`}
    >
      <summary
        className="flex min-h-[40px] cursor-pointer items-center justify-between px-3 py-1.5 text-xs font-mono select-none hover:bg-[#1a1c20] transition-colors list-none"
        aria-label="Alihkan proses berpikir"
      >
        <div className="flex items-center gap-2">
          <Brain
            className={`h-3.5 w-3.5 text-[#ff6347] ${
              isStreaming ? 'animate-pulse' : ''
            }`}
          />
          <span
            className={`font-medium text-xs ${
              isStreaming ? 'text-[#ff6347] animate-pulse' : 'text-[#f3f4f6]'
            }`}
          >
            Berpikir...
          </span>
          {isStreaming && (
            <Loader2 className="h-3 w-3 animate-spin text-[#ff6347]" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#9ca3af] transition-transform duration-200 ${
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
