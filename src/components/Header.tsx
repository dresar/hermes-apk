import React, { useState, useRef, useEffect } from 'react'
import {
  Server,
  Plus,
  ChevronDown,
  Layers,
  RotateCcw,
  Check,
  Cpu,
} from 'lucide-react'
import type { ActivePet, ConnectionStatus, Session } from '../api/types'
import type { PetAnimationState } from './PetSprite'
import { PetSprite } from './PetSprite'

export interface HeaderProps {
  connectionStatus: ConnectionStatus
  latencyMs: number
  sessions: Session[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onCreateSession: () => void
  activePet: ActivePet
  onOpenPetPicker: () => void
  activeModel?: string | null
  onOpenProviderSettings: () => void
  onOpenVault: () => void
  onOpenGoals: () => void
  onOpenRollbacks: () => void
  className?: string
}

const mapPetAnimationState = (state?: string): PetAnimationState => {
  if (state === 'wave') return 'waving'
  if (state === 'jump') return 'jumping'
  if (state === 'run') return 'running'
  return (state as PetAnimationState) || 'idle'
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  latencyMs,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  activePet,
  onOpenPetPicker,
  activeModel,
  onOpenProviderSettings,
  onOpenVault,
  onOpenGoals,
  onOpenRollbacks,
  className = '',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentSession = sessions.find((s) => s.session_id === activeSessionId)
  const displayTitle = currentSession?.title || 'Active Session'

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting'

  const statusColorClass = isConnected
    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
    : isConnecting
    ? 'bg-amber-500 animate-pulse'
    : 'bg-rose-500'

  const formattedModelName = activeModel
    ? activeModel.split('/').pop()?.split(':')[0]?.replace(/-latest$/, '') || activeModel
    : 'Default'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#23262d] bg-[#090a0b]/80 px-2 sm:px-4 backdrop-blur-md safe-area ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenVault}
          className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[#23262d] bg-[#121316] px-2.5 py-1 text-xs text-[#f3f4f6] transition-colors hover:border-[#323640] hover:bg-[#1a1c20] cursor-pointer"
          aria-label="Open gateway vault configuration"
        >
          <span className={`h-2 w-2 rounded-full ${statusColorClass}`} />
          <span className="hidden font-mono text-[11px] text-[#9ca3af] sm:inline">
            {isConnected ? `${latencyMs}ms` : connectionStatus}
          </span>
          <Server className="h-3.5 w-3.5 text-[#9ca3af]" />
        </button>
      </div>

      <div ref={dropdownRef} className="relative flex items-center gap-1 max-w-[200px] sm:max-w-xs">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex min-h-[44px] max-w-[150px] sm:max-w-[220px] items-center gap-1.5 rounded-lg border border-[#23262d] bg-[#121316] px-2.5 py-1 text-xs text-[#f3f4f6] transition-colors hover:border-[#323640] hover:bg-[#1a1c20] cursor-pointer"
          aria-label="Select session dropdown"
          aria-expanded={dropdownOpen}
        >
          <span className="truncate font-medium">{displayTitle}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
        </button>

        <button
          type="button"
          onClick={onCreateSession}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af] transition-colors hover:border-[#323640] hover:text-[#f3f4f6] hover:bg-[#1a1c20] cursor-pointer"
          aria-label="Create new conversation session"
        >
          <Plus className="h-4 w-4" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-64 rounded-xl border border-[#23262d] bg-[#121316] p-1.5 shadow-2xl">
            <div className="px-2 py-1.5 text-[11px] font-medium text-[#9ca3af] border-b border-[#23262d]">
              Sessions ({sessions.length})
            </div>
            <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
              {sessions.map((s) => {
                const isSelected = s.session_id === activeSessionId
                return (
                  <button
                    key={s.session_id}
                    type="button"
                    onClick={() => {
                      onSelectSession(s.session_id)
                      setDropdownOpen(false)
                    }}
                    className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border border-[#ff6347]/40 bg-[#ff6347]/10 text-[#ff6347]'
                        : 'text-[#9ca3af] hover:bg-[#1a1c20] hover:text-[#f3f4f6]'
                    }`}
                  >
                    <span className="truncate font-medium">{s.title || 'Untitled Session'}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#ff6347]" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onOpenProviderSettings}
          className="hidden md:flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#23262d] bg-[#121316] px-2.5 py-1 text-[11px] font-mono text-[#9ca3af] hover:border-[#323640] hover:text-[#f3f4f6] cursor-pointer"
          aria-label="Configure AI model"
        >
          <Cpu className="h-3.5 w-3.5 text-[#ff6347]" />
          <span className="max-w-[90px] truncate">{formattedModelName}</span>
        </button>

        <button
          type="button"
          onClick={onOpenGoals}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af] transition-colors hover:border-[#323640] hover:text-[#f3f4f6] cursor-pointer"
          aria-label="Open goal contracts and loops tracker"
        >
          <Layers className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onOpenRollbacks}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af] transition-colors hover:border-[#323640] hover:text-[#f3f4f6] cursor-pointer"
          aria-label="Open checkpoint rollbacks sheet"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <div className="flex items-center">
          <PetSprite
            slug={activePet.slug}
            name={activePet.name}
            spritesheetUrl={activePet.spritesheetUrl}
            state={mapPetAnimationState(activePet.state)}
            scale={0.2}
            onClick={onOpenPetPicker}
            className="rounded-lg border border-[#23262d] bg-[#121316]"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
