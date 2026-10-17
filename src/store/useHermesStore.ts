import { create } from 'zustand'
import type {
  ActivePet,
  ActiveTurnStreamingState,
  ApprovalRequest,
  ClarifyRequest,
  ConnectionStatus,
  GatewayConfig,
  GoalContract,
  LoopItem,
  Model,
  PetGalleryItem,
  PetState,
  RollbackCheckpoint,
  Session,
  ToolCall,
  Turn,
} from '../api/types'

let vibeHeartsTimer: ReturnType<typeof setTimeout> | null = null

export interface HermesState {
  gatewayConfig: GatewayConfig
  connectionStatus: ConnectionStatus
  latencyMs: number
  sessions: Session[]
  activeSessionId: string | null
  models: Model[]
  activeModel: string | null
  turns: Turn[]
  activeTurnStreamingState: ActiveTurnStreamingState
  toolCalls: ToolCall[]
  activeApprovalRequest: ApprovalRequest | null
  activeClarifyRequest: ClarifyRequest | null
  activePet: ActivePet
  petGallery: PetGalleryItem[]
  vibeHeartsActive: boolean
  checkpoints: RollbackCheckpoint[]
  goals: GoalContract[]
  loops: LoopItem[]
  vaultModalOpen: boolean
}

export interface HermesActions {
  setGatewayConfig: (config: Partial<GatewayConfig>) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setLatencyMs: (latencyMs: number) => void
  setSessions: (sessions: Session[] | any) => void
  setActiveSessionId: (activeSessionId: string | null) => void
  setModels: (models: Model[]) => void
  setActiveModel: (activeModel: string | null) => void
  setTurns: (turns: Turn[]) => void
  addTurn: (turn: Turn) => void
  updateTurn: (id: string, updates: Partial<Turn>) => void
  startStreaming: (turnId: string) => void
  appendReasoningDelta: (delta: string) => void
  appendMessageDelta: (delta: string, isContinuation?: boolean) => void
  finishStreaming: (completeText?: string, reasoning?: string) => void
  resetStreamingState: () => void
  setToolCalls: (toolCalls: ToolCall[]) => void
  addOrUpdateToolCall: (toolCall: Partial<ToolCall> & { tool_id: string }) => void
  setActiveApprovalRequest: (req: ApprovalRequest | null) => void
  setActiveClarifyRequest: (req: ClarifyRequest | null) => void
  setActivePet: (pet: Partial<ActivePet>) => void
  setPetState: (state: PetState) => void
  setPetGallery: (petGallery: PetGalleryItem[]) => void
  setVibeHeartsActive: (active: boolean) => void
  triggerVibeHearts: () => void
  setCheckpoints: (checkpoints: RollbackCheckpoint[]) => void
  setGoals: (goals: GoalContract[]) => void
  setLoops: (loops: LoopItem[]) => void
  setVaultModalOpen: (open: boolean) => void
  resetSessionState: () => void
}

export type HermesStore = HermesState & HermesActions

const getInitialGatewayConfig = (): GatewayConfig => {
  const isBrowser = typeof window !== 'undefined' && Boolean(window.location)
  const sessionToken = isBrowser
    ? (window as unknown as { __HERMES_SESSION_TOKEN__?: string }).__HERMES_SESSION_TOKEN__
    : undefined

  if (isBrowser && window.location.hostname) {
    const hostname = window.location.hostname
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    const isCapacitor =
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:'

    if (!isLocalhost && !isCapacitor) {
      const isHttps = window.location.protocol === 'https:'
      const port = isHttps ? 443 : Number(window.location.port) || 80
      return {
        host: hostname,
        port,
        useSsl: isHttps,
        token: sessionToken || undefined,
      }
    }
  }

  return {
    host: 'hermes.agentai.my.id',
    port: 443,
    useSsl: true,
    token: sessionToken || undefined,
  }
}

const initialConfig: GatewayConfig = getInitialGatewayConfig()

const initialActivePet: ActivePet = {
  slug: 'default',
  name: 'Hermes',
  spritesheetUrl: '',
  scale: 0.33,
  state: 'idle',
}

const initialStreamingState: ActiveTurnStreamingState = {
  reasoningBuffer: '',
  messageBuffer: '',
  isStreaming: false,
  currentTurnId: null,
}

export const useHermesStore = create<HermesStore>((set) => ({
  gatewayConfig: initialConfig,
  connectionStatus: 'disconnected',
  latencyMs: 0,
  sessions: [],
  activeSessionId: null,
  models: [],
  activeModel: 'agnes-2.5-flash',
  turns: [],
  activeTurnStreamingState: initialStreamingState,
  toolCalls: [],
  activeApprovalRequest: null,
  activeClarifyRequest: null,
  activePet: initialActivePet,
  petGallery: [],
  vibeHeartsActive: false,
  checkpoints: [],
  goals: [],
  loops: [],
  vaultModalOpen: false,

  setGatewayConfig: (config) =>
    set((state) => ({
      gatewayConfig: { ...state.gatewayConfig, ...config },
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setLatencyMs: (latencyMs) => set({ latencyMs }),

  setSessions: (sessions) =>
    set({
      sessions: Array.isArray(sessions)
        ? sessions
        : Array.isArray((sessions as any)?.sessions)
        ? (sessions as any).sessions.map((s: any) => ({
            session_id: s.session_id || s.id || '',
            title: s.title || '',
            created_at: s.started_at
              ? new Date(s.started_at * 1000).toISOString()
              : (s.created_at || ''),
          }))
        : [],
    }),

  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

  setModels: (models) => set({ models }),

  setActiveModel: (activeModel) => set({ activeModel }),

  setTurns: (turns) => set({ turns }),

  addTurn: (turn) =>
    set((state) => ({
      turns: [...state.turns, turn],
    })),

  updateTurn: (id, updates) =>
    set((state) => ({
      turns: state.turns.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  startStreaming: (turnId) =>
    set((state) => {
      const existingIndex = state.turns.findIndex((t) => t.id === turnId)
      let turns: Turn[]
      if (existingIndex >= 0) {
        turns = [...state.turns]
        turns[existingIndex] = {
          ...turns[existingIndex],
          role: 'assistant',
        }
      } else {
        const newTurn: Turn = {
          id: turnId,
          role: 'assistant',
          content: '',
          reasoning: '',
          timestamp: Date.now(),
        }
        turns = [...state.turns, newTurn]
      }
      return {
        turns,
        activeTurnStreamingState: {
          reasoningBuffer: '',
          messageBuffer: '',
          isStreaming: true,
          currentTurnId: turnId,
        },
      }
    }),

  appendReasoningDelta: (delta) =>
    set((state) => {
      const newBuffer = state.activeTurnStreamingState.reasoningBuffer + delta
      const turnId = state.activeTurnStreamingState.currentTurnId || `turn_${Date.now()}`

      const existingIndex = state.turns.findIndex((t) => t.id === turnId)
      let turns: Turn[]
      if (existingIndex >= 0) {
        turns = [...state.turns]
        const existing = turns[existingIndex]
        turns[existingIndex] = {
          ...existing,
          reasoning: newBuffer,
        }
      } else {
        const newTurn: Turn = {
          id: turnId,
          role: 'assistant',
          content: state.activeTurnStreamingState.messageBuffer,
          reasoning: newBuffer,
          timestamp: Date.now(),
        }
        turns = [...state.turns, newTurn]
      }

      return {
        turns,
        activeTurnStreamingState: {
          ...state.activeTurnStreamingState,
          reasoningBuffer: newBuffer,
          currentTurnId: turnId,
        },
      }
    }),

  appendMessageDelta: (delta, isContinuation) =>
    set((state) => {
      const newBuffer = state.activeTurnStreamingState.messageBuffer + delta
      const turnId = state.activeTurnStreamingState.currentTurnId || `turn_${Date.now()}`

      const existingIndex = state.turns.findIndex((t) => t.id === turnId)
      let turns: Turn[]
      if (existingIndex >= 0) {
        turns = [...state.turns]
        const existing = turns[existingIndex]
        turns[existingIndex] = {
          ...existing,
          content: newBuffer,
          _length_continuation_nudge: isContinuation
            ? true
            : existing._length_continuation_nudge,
        }
      } else {
        const newTurn: Turn = {
          id: turnId,
          role: 'assistant',
          content: newBuffer,
          reasoning: state.activeTurnStreamingState.reasoningBuffer,
          timestamp: Date.now(),
          _length_continuation_nudge: Boolean(isContinuation),
        }
        turns = [...state.turns, newTurn]
      }

      return {
        turns,
        activeTurnStreamingState: {
          ...state.activeTurnStreamingState,
          messageBuffer: newBuffer,
          currentTurnId: turnId,
        },
      }
    }),

  finishStreaming: (completeText, reasoning) =>
    set((state) => {
      const turnId = state.activeTurnStreamingState.currentTurnId
      let turns = state.turns

      const resolvedContent =
        completeText !== undefined
          ? completeText
          : state.activeTurnStreamingState.messageBuffer
      const resolvedReasoning =
        reasoning !== undefined
          ? reasoning
          : state.activeTurnStreamingState.reasoningBuffer

      if (turnId) {
        const existingIndex = state.turns.findIndex((t) => t.id === turnId)
        if (existingIndex >= 0) {
          turns = [...state.turns]
          const existing = turns[existingIndex]
          turns[existingIndex] = {
            ...existing,
            content:
              completeText !== undefined
                ? completeText
                : (existing.content || resolvedContent),
            reasoning:
              reasoning !== undefined
                ? reasoning
                : (existing.reasoning || resolvedReasoning),
          }
        } else {
          const newTurn: Turn = {
            id: turnId,
            role: 'assistant',
            content: resolvedContent,
            reasoning: resolvedReasoning,
            timestamp: Date.now(),
          }
          turns = [...state.turns, newTurn]
        }
      } else if (state.turns.length > 0) {
        const lastIndex = state.turns.length - 1
        const lastTurn = state.turns[lastIndex]
        if (lastTurn.role === 'assistant') {
          turns = [...state.turns]
          turns[lastIndex] = {
            ...lastTurn,
            content:
              completeText !== undefined
                ? completeText
                : (lastTurn.content || resolvedContent),
            reasoning:
              reasoning !== undefined
                ? reasoning
                : (lastTurn.reasoning || resolvedReasoning),
          }
        }
      }

      return {
        turns,
        activeTurnStreamingState: {
          reasoningBuffer: '',
          messageBuffer: '',
          isStreaming: false,
          currentTurnId: null,
        },
      }
    }),

  resetStreamingState: () =>
    set({
      activeTurnStreamingState: initialStreamingState,
    }),

  setToolCalls: (toolCalls) => set({ toolCalls }),

  addOrUpdateToolCall: (toolCall) =>
    set((state) => {
      const existingIndex = state.toolCalls.findIndex(
        (tc) => tc.tool_id === toolCall.tool_id
      )
      if (existingIndex >= 0) {
        const updated = [...state.toolCalls]
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...toolCall,
        }
        return { toolCalls: updated }
      }
      const fullTool: ToolCall = {
        tool_id: toolCall.tool_id,
        name: toolCall.name ?? 'unknown_tool',
        args: toolCall.args ?? {},
        status: toolCall.status ?? 'pending',
        result: toolCall.result,
        inline_diff: toolCall.inline_diff,
        duration: toolCall.duration,
      }
      return { toolCalls: [...state.toolCalls, fullTool] }
    }),

  setActiveApprovalRequest: (activeApprovalRequest) =>
    set({ activeApprovalRequest }),

  setActiveClarifyRequest: (activeClarifyRequest) =>
    set({ activeClarifyRequest }),

  setActivePet: (pet) =>
    set((state) => ({
      activePet: { ...state.activePet, ...pet },
    })),

  setPetState: (stateVal) =>
    set((state) => ({
      activePet: { ...state.activePet, state: stateVal },
    })),

  setPetGallery: (petGallery) => set({ petGallery }),

  setVibeHeartsActive: (vibeHeartsActive) => set({ vibeHeartsActive }),

  triggerVibeHearts: () => {
    if (vibeHeartsTimer) {
      clearTimeout(vibeHeartsTimer)
    }
    set({ vibeHeartsActive: true })
    vibeHeartsTimer = setTimeout(() => {
      set({ vibeHeartsActive: false })
    }, 2500)
  },

  setCheckpoints: (checkpoints) => set({ checkpoints }),

  setGoals: (goals) => set({ goals }),

  setLoops: (loops) => set({ loops }),

  setVaultModalOpen: (vaultModalOpen) => set({ vaultModalOpen }),

  resetSessionState: () =>
    set({
      turns: [],
      toolCalls: [],
      activeTurnStreamingState: initialStreamingState,
      activeApprovalRequest: null,
      activeClarifyRequest: null,
      checkpoints: [],
      goals: [],
      loops: [],
    }),
}))
