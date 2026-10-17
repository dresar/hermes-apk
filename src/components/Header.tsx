import React, { useState, useRef, useEffect } from 'react'
import {
  Menu,
  X,
  Server,
  Plus,
  ChevronDown,
  Layers,
  RotateCcw,
  Check,
  Cpu,
  ArrowUpCircle,
  MessageSquare,
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
  onOpenUpdateModal?: () => void
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
  onOpenUpdateModal,
  className = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false)
  const [showSessionList, setShowSessionList] = useState(false)
  const sessionDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sessionDropdownRef.current &&
        !sessionDropdownRef.current.contains(e.target as Node)
      ) {
        setSessionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentSession = sessions.find((s) => s.session_id === activeSessionId)
  const displayTitle = currentSession?.title || 'Active Session'

  const isConnected = connectionStatus === 'connected'
  const isConnecting =
    connectionStatus === 'connecting' || connectionStatus === 'reconnecting'

  const statusColorClass = isConnected
    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
    : isConnecting
    ? 'bg-amber-500 animate-pulse'
    : 'bg-rose-500'

  const formattedModelName = activeModel
    ? activeModel.split('/').pop()?.split(':')[0]?.replace(/-latest$/, '') || activeModel
    : 'Default'

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 flex h-14 w-full items-center border-b border-[#23262d] bg-[#090a0b]/80 backdrop-blur-md safe-area ${className}`}
      >
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusColorClass}`} />
            <span className="font-semibold text-sm tracking-tight text-[#f3f4f6]">
              Hermes
            </span>
            {isConnected && (
              <span className="rounded-md border border-[#23262d] bg-[#121316] px-1.5 py-0.5 font-mono text-[10px] text-[#9ca3af]">
                {latencyMs}ms
              </span>
            )}
          </div>

          <div ref={sessionDropdownRef} className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
              className="flex min-h-[36px] max-w-[130px] sm:max-w-[180px] items-center gap-1.5 rounded-full border border-[#23262d] bg-[#121316] px-3 py-1 text-xs text-[#f3f4f6] transition-colors hover:border-[#323640] hover:bg-[#1a1c20] cursor-pointer"
              aria-label="Pilih sesi percakapan"
              aria-expanded={sessionDropdownOpen}
            >
              <span className="truncate font-medium">{displayTitle}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[#9ca3af]" />
            </button>

            {sessionDropdownOpen && (
              <div className="absolute top-11 left-1/2 -translate-x-1/2 z-50 w-64 rounded-xl border border-[#23262d] bg-[#121316] p-1.5 shadow-2xl">
                <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-medium text-[#9ca3af] border-b border-[#23262d]">
                  <span>Sesi ({sessions.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionDropdownOpen(false)
                      onCreateSession()
                    }}
                    className="text-[#ff6347] hover:underline"
                  >
                    + Sesi Baru
                  </button>
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
                          setSessionDropdownOpen(false)
                        }}
                        className={`flex min-h-[40px] w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'border border-[#ff6347]/40 bg-[#ff6347]/10 text-[#ff6347]'
                            : 'text-[#9ca3af] hover:bg-[#1a1c20] hover:text-[#f3f4f6]'
                        }`}
                      >
                        <span className="truncate font-medium">
                          {s.title || 'Sesi Tanpa Judul'}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#ff6347]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <PetSprite
                slug={activePet.slug}
                name={activePet.name}
                spritesheetUrl={activePet.spritesheetUrl}
                state={mapPetAnimationState(activePet.state)}
                scale={0.2}
                onClick={onOpenPetPicker}
                className="rounded-lg border border-[#23262d] bg-[#121316] cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af] hover:border-[#323640] hover:text-[#f3f4f6] cursor-pointer transition-colors"
              aria-label="Buka menu Hermes"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-hermes-heading"
        >
          <div
            className="fixed inset-0"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-[#23262d] bg-[#121316] shadow-2xl safe-area">
            <div className="flex h-5 w-full items-center justify-center pt-2">
              <div className="h-1 w-12 rounded-full bg-[#23262d]" />
            </div>
            <div className="flex items-center justify-between border-b border-[#23262d] px-4 py-3">
              <h2
                id="menu-hermes-heading"
                className="text-base font-semibold tracking-tight text-[#f3f4f6]"
              >
                Menu Hermes
              </h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onCreateSession()
                }}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-xs text-[#f3f4f6] transition-colors hover:border-[#ff6347]/40 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff6347]/30 bg-[#ff6347]/10 text-[#ff6347]">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="font-medium">+ Sesi Baru</span>
                </div>
              </button>

              <div className="rounded-xl border border-[#23262d] bg-[#1a1c20] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSessionList(!showSessionList)}
                  className="flex min-h-[44px] w-full items-center justify-between px-3.5 py-2.5 text-xs text-[#f3f4f6] hover:bg-[#23262d]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af]">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Daftar Sesi</div>
                      <div className="text-[10px] text-[#9ca3af]">{displayTitle}</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 ${
                      showSessionList ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showSessionList && (
                  <div className="border-t border-[#23262d] bg-[#121316] p-2 space-y-1 max-h-48 overflow-y-auto">
                    {sessions.map((s) => {
                      const isSelected = s.session_id === activeSessionId
                      return (
                        <button
                          key={s.session_id}
                          type="button"
                          onClick={() => {
                            onSelectSession(s.session_id)
                            setMenuOpen(false)
                          }}
                          className={`flex min-h-[38px] w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? 'border border-[#ff6347]/40 bg-[#ff6347]/10 text-[#ff6347]'
                              : 'text-[#9ca3af] hover:bg-[#1a1c20] hover:text-[#f3f4f6]'
                          }`}
                        >
                          <span className="truncate font-medium">
                            {s.title || 'Sesi Tanpa Judul'}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#ff6347]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenProviderSettings()
                }}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-xs text-[#f3f4f6] transition-colors hover:border-[#ff6347]/40 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#ff6347]">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Model AI</div>
                    <div className="text-[10px] text-[#9ca3af] font-mono">
                      {formattedModelName}
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenGoals()
                }}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-xs text-[#f3f4f6] transition-colors hover:border-[#ff6347]/40 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Target & Loop</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenRollbacks()
                }}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-xs text-[#f3f4f6] transition-colors hover:border-[#ff6347]/40 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af]">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Checkpoint Git</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenVault()
                }}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-xs text-[#f3f4f6] transition-colors hover:border-[#ff6347]/40 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#121316] text-[#9ca3af]">
                    <Server className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Gateway Vault</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenUpdateModal?.()
                }}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] px-3.5 py-2.5 text-xs text-[#f3f4f6] transition-colors hover:border-[#ff6347]/40 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff6347]/30 bg-[#ff6347]/10 text-[#ff6347]">
                    <ArrowUpCircle className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Periksa Update APK</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
