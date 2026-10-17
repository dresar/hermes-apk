import { useEffect, useState, useCallback, useMemo } from 'react'
import { Layers, X } from 'lucide-react'
import { useHermesStore } from './store/useHermesStore'
import { hermesClient } from './api/hermes-client'
import type { Attachment, Turn } from './api/types'
import type { PetItem } from './components/PetPicker'
import { Header } from './components/Header'
import { Transcript } from './components/Transcript'
import { Composer } from './components/Composer'
import { ApprovalModal } from './components/ApprovalModal'
import { ClarifyModal } from './components/ClarifyModal'
import { ProviderSettings } from './components/ProviderSettings'
import { GatewayVault } from './components/GatewayVault'
import { PetPicker } from './components/PetPicker'
import { GoalTracker } from './components/GoalTracker'
import { RollbackSheet } from './components/RollbackSheet'
import { VibeHearts } from './components/VibeHearts'

const PRAISE_TRIGGERS = [
  'good bot',
  'thank you',
  'thanks',
  'nice job',
  'great job',
  'good job',
  '<3',
  '❤️',
  'love',
  'awesome bot',
  'well done',
  'terima kasih',
  'mantap',
]

export default function App() {
  const connectionStatus = useHermesStore((s) => s.connectionStatus)
  const latencyMs = useHermesStore((s) => s.latencyMs)
  const sessions = useHermesStore((s) => s.sessions)
  const activeSessionId = useHermesStore((s) => s.activeSessionId)
  const turns = useHermesStore((s) => s.turns)
  const activeTurnStreamingState = useHermesStore((s) => s.activeTurnStreamingState)
  const toolCalls = useHermesStore((s) => s.toolCalls)
  const activeApprovalRequest = useHermesStore((s) => s.activeApprovalRequest)
  const activeClarifyRequest = useHermesStore((s) => s.activeClarifyRequest)
  const activePet = useHermesStore((s) => s.activePet)
  const vibeHeartsActive = useHermesStore((s) => s.vibeHeartsActive)
  const vaultModalOpen = useHermesStore((s) => s.vaultModalOpen)
  const activeModel = useHermesStore((s) => s.activeModel)

  const [petPickerOpen, setPetPickerOpen] = useState(false)
  const [providerSettingsOpen, setProviderSettingsOpen] = useState(false)
  const [goalsSheetOpen, setGoalsSheetOpen] = useState(false)
  const [rollbackSheetOpen, setRollbackSheetOpen] = useState(false)

  useEffect(() => {
    const handleViewport = () => {
      if (!window.visualViewport) return
      const height = window.visualViewport.height
      document.documentElement.style.setProperty('--viewport-height', `${height}px`)
    }

    handleViewport()
    window.visualViewport?.addEventListener('resize', handleViewport)
    window.visualViewport?.addEventListener('scroll', handleViewport)
    window.addEventListener('resize', handleViewport)

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport)
      window.visualViewport?.removeEventListener('scroll', handleViewport)
      window.removeEventListener('resize', handleViewport)
    }
  }, [])

  useEffect(() => {
    const cfg = useHermesStore.getState().gatewayConfig
    hermesClient
      .connect(cfg.host || '127.0.0.1', cfg.port || 9119, {
        useSsl: cfg.useSsl,
        token: cfg.token,
        autoReconnect: true,
      })
      .catch(() => {})

    hermesClient
      .sessionList()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          useHermesStore.getState().setSessions(list)
          const currentActive = useHermesStore.getState().activeSessionId
          if (!currentActive) {
            const firstId = list[0].session_id
            useHermesStore.getState().setActiveSessionId(firstId)
            hermesClient.sessionResume(firstId).catch(() => {})
          }
        }
      })
      .catch(() => {})

    return () => {
      hermesClient.disconnect()
    }
  }, [])

  const handleSelectSession = useCallback((sessionId: string) => {
    useHermesStore.getState().setActiveSessionId(sessionId)
    hermesClient.sessionResume(sessionId).catch(() => {})
  }, [])

  const handleCreateSession = useCallback(async () => {
    try {
      const title = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      const newSession = await hermesClient.sessionCreate({ title })
      if (newSession && newSession.session_id) {
        useHermesStore.getState().resetSessionState()
        useHermesStore.getState().setActiveSessionId(newSession.session_id)
        const updatedList = await hermesClient.sessionList()
        useHermesStore.getState().setSessions(updatedList)
      }
    } catch {
      const fallbackId = `sess_${Date.now()}`
      const fallbackSession = {
        session_id: fallbackId,
        title: 'New Session',
        created_at: new Date().toISOString(),
      }
      useHermesStore.getState().resetSessionState()
      useHermesStore.getState().setSessions([fallbackSession, ...sessions])
      useHermesStore.getState().setActiveSessionId(fallbackId)
    }
  }, [sessions])

  const handleSendPrompt = useCallback(
    async (text: string, attachments?: Attachment[]) => {
      const lower = text.toLowerCase()
      const hasPraise = PRAISE_TRIGGERS.some((kw) => lower.includes(kw))
      if (hasPraise) {
        useHermesStore.getState().triggerVibeHearts()
      }

      let currentSid = useHermesStore.getState().activeSessionId
      if (!currentSid) {
        try {
          const newSession = await hermesClient.sessionCreate({
            title: text.slice(0, 24) || 'New Session',
          })
          currentSid = newSession.session_id
          useHermesStore.getState().setActiveSessionId(currentSid)
          const updatedList = await hermesClient.sessionList()
          useHermesStore.getState().setSessions(updatedList)
        } catch {
          currentSid = `sess_${Date.now()}`
          useHermesStore.getState().setActiveSessionId(currentSid)
        }
      }

      const userTurn: Turn = {
        id: `usr_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }
      useHermesStore.getState().addTurn(userTurn)

      try {
        await hermesClient.promptSubmit(currentSid, text, attachments)
      } catch {
        void 0
      }
    },
    []
  )

  const handleStop = useCallback(() => {
    const sid = useHermesStore.getState().activeSessionId
    if (sid) {
      hermesClient.sessionInterrupt(sid).catch(() => {})
    }
    useHermesStore.getState().finishStreaming()
  }, [])

  const handleApprovalRespond = useCallback(
    (choice: 'once' | 'session' | 'always' | 'deny') => {
      if (activeApprovalRequest) {
        hermesClient.respondApproval(activeApprovalRequest.request_id, choice)
      }
    },
    [activeApprovalRequest]
  )

  const handleClarifyRespond = useCallback(
    (answers: Record<string, string | string[]>) => {
      if (activeClarifyRequest) {
        hermesClient.respondClarify(activeClarifyRequest.request_id, answers)
      }
    },
    [activeClarifyRequest]
  )

  const handleSelectPet = useCallback((pet: PetItem) => {
    useHermesStore.getState().setActivePet({
      slug: pet.slug,
      name: pet.name,
      spritesheetUrl: pet.spritesheetUrl,
    })
  }, [])

  const handleRestoreCheckpoint = useCallback(async () => {
    const sid = useHermesStore.getState().activeSessionId
    if (sid) {
      await hermesClient.sessionUndo(sid, 'undo').catch(() => {})
    }
  }, [])

  const lastTurnText = useMemo(() => {
    if (turns.length === 0) return ''
    return turns[turns.length - 1].content
  }, [turns])

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#090a0b] text-[#f3f4f6]">
      <VibeHearts text={lastTurnText} trigger={vibeHeartsActive} />

      <Header
        connectionStatus={connectionStatus}
        latencyMs={latencyMs}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        activePet={activePet}
        onOpenPetPicker={() => setPetPickerOpen(true)}
        activeModel={activeModel}
        onOpenProviderSettings={() => setProviderSettingsOpen(true)}
        onOpenVault={() => useHermesStore.getState().setVaultModalOpen(true)}
        onOpenGoals={() => setGoalsSheetOpen(true)}
        onOpenRollbacks={() => setRollbackSheetOpen(true)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Transcript
          turns={turns}
          streamingState={activeTurnStreamingState}
          toolCalls={toolCalls}
          modelName={activeModel || undefined}
          onSelectPrompt={(prompt) => handleSendPrompt(prompt)}
        />
      </main>

      <Composer
        onSend={handleSendPrompt}
        onStop={handleStop}
        isStreaming={activeTurnStreamingState.isStreaming}
      />

      <ApprovalModal
        request={activeApprovalRequest}
        onRespond={handleApprovalRespond}
      />

      <ClarifyModal
        request={activeClarifyRequest}
        onRespond={handleClarifyRespond}
        onClose={() => useHermesStore.getState().setActiveClarifyRequest(null)}
      />

      <ProviderSettings
        isOpen={providerSettingsOpen}
        onClose={() => setProviderSettingsOpen(false)}
        activeModel={activeModel}
        onSelectModel={(m) => useHermesStore.getState().setActiveModel(m)}
      />

      <GatewayVault
        isOpen={vaultModalOpen}
        onClose={() => useHermesStore.getState().setVaultModalOpen(false)}
        onConnect={(cfg) => {
          hermesClient
            .connect(cfg.host, cfg.port, {
              useSsl: cfg.useHttps,
              token: cfg.bearerToken,
            })
            .catch(() => {})
        }}
      />

      <PetPicker
        isOpen={petPickerOpen}
        onClose={() => setPetPickerOpen(false)}
        activePetSlug={activePet.slug}
        onSelectPet={handleSelectPet}
      />

      <RollbackSheet
        isOpen={rollbackSheetOpen}
        onClose={() => setRollbackSheetOpen(false)}
        activeSessionId={activeSessionId || undefined}
        onRestore={handleRestoreCheckpoint}
      />

      {goalsSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-tracker-heading"
        >
          <div
            className="fixed inset-0"
            onClick={() => setGoalsSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-[#23262d] bg-[#121316] shadow-2xl">
            <div className="flex h-5 w-full items-center justify-center pt-2">
              <div className="h-1 w-12 rounded-full bg-[#23262d]" />
            </div>
            <div className="flex items-center justify-between border-b border-[#23262d] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#323640] bg-[#1a1c20] text-[#ff6347]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    id="goal-tracker-heading"
                    className="text-base font-medium tracking-tight text-[#f3f4f6]"
                  >
                    Goals & Autonomous Loops
                  </h2>
                  <p className="text-xs text-[#9ca3af]">
                    Track contracts, scheduled heartbeats, and daemon loops
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoalsSheetOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label="Close goals tracker"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <GoalTracker sessionId={activeSessionId || undefined} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
