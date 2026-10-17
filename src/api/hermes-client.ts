import {
  createRequest,
  isJsonRpcErrorResponse,
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  isJsonRpcSuccessResponse,
  splitBatchedFrames,
} from './jsonrpc'
import type {
  Attachment,
  ClarifyQuestion,
  ConnectionStatus,
  EventsSinceResult,
  GatewayConfig,
  GatewayEvent,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  MessageCompletePayload,
  MessageDeltaPayload,
  MessageStartPayload,
  PetChangedPayload,
  ReactionPayload,
  ReasoningDeltaPayload,
  ResumeSessionResult,
  ServerRequestApproval,
  ServerRequestClarify,
  Session,
  StatusUpdatePayload,
  ToolCompletePayload,
  ToolStartPayload,
} from './types'
import { useHermesStore } from '../store/useHermesStore'

export interface ConnectOptions {
  token?: string
  ticket?: string
  useSsl?: boolean
  autoReconnect?: boolean
  reconnectIntervalMs?: number
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  timer?: ReturnType<typeof setTimeout>
}

export class HermesClient {
  private socket: WebSocket | null = null
  private nextRequestId = 1
  private pendingRequests = new Map<string | number, PendingRequest>()
  private lastSeq = 0
  private activeSessionId: string | null = null
  private reasoningBuffer = ''
  private messageBuffer = ''
  private eventListeners = new Set<(event: GatewayEvent) => void>()
  private serverRequestListeners = new Set<
    (method: string, params: unknown, id: string | number) => void
  >()
  private statusListeners = new Set<(status: ConnectionStatus) => void>()
  private currentConfig: GatewayConfig = {
    host: '127.0.0.1',
    port: 9119,
    useSsl: false,
  }
  private connectOptions: ConnectOptions = {}
  private isManualDisconnect = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private petStateResetTimer: ReturnType<typeof setTimeout> | null = null

  public getReasoningBuffer(): string {
    return this.reasoningBuffer
  }

  public getMessageBuffer(): string {
    return this.messageBuffer
  }

  public getLastSeq(): number {
    return this.lastSeq
  }

  public getActiveSessionId(): string | null {
    return this.activeSessionId
  }

  public setActiveSessionId(sessionId: string | null): void {
    this.activeSessionId = sessionId
    useHermesStore.getState().setActiveSessionId(sessionId)
  }

  public async login(
    username: string,
    password: string
  ): Promise<{ ok: boolean; next?: string }> {
    const protocol = this.currentConfig.useSsl ? 'https:' : 'http:'
    const url = [
      protocol,
      '',
      `${this.currentConfig.host}:${this.currentConfig.port}`,
      'auth',
      'password-login',
    ].join('/')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'basic',
        username,
        password,
      }),
    })

    if (!response.ok) {
      throw new Error(String(response.status))
    }

    const data = await response.json()
    this.currentConfig.username = username
    useHermesStore.getState().setGatewayConfig({ username })
    return data
  }

  public async getWsTicket(): Promise<{ ticket: string; ttl_seconds: number }> {
    const protocol = this.currentConfig.useSsl ? 'https:' : 'http:'
    const url = [
      protocol,
      '',
      `${this.currentConfig.host}:${this.currentConfig.port}`,
      'api',
      'auth',
      'ws-ticket',
    ].join('/')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(String(response.status))
    }

    return await response.json()
  }

  public connect(
    host: string,
    port: number,
    options?: ConnectOptions
  ): Promise<void> {
    if (this.socket) {
      this.disconnect()
    }

    this.isManualDisconnect = false
    this.currentConfig.host = host
    this.currentConfig.port = port
    if (options?.useSsl !== undefined) {
      this.currentConfig.useSsl = options.useSsl
    }
    if (options?.token) {
      this.currentConfig.token = options.token
    }
    this.connectOptions = options ?? {}

    useHermesStore.getState().setGatewayConfig({
      host,
      port,
      useSsl: this.currentConfig.useSsl,
      token: this.currentConfig.token,
    })
    this.updateStatus('connecting')

    return new Promise<void>((resolve, reject) => {
      try {
        const wsProtocol = (
          options?.useSsl !== undefined
            ? options.useSsl
            : this.currentConfig.useSsl
        )
          ? 'wss:'
          : 'ws:'

        const queryParams: string[] = []
        if (options?.ticket) {
          queryParams.push(`ticket=${encodeURIComponent(options.ticket)}`)
        } else if (options?.token || this.currentConfig.token) {
          const t = options?.token || this.currentConfig.token
          if (t) {
            queryParams.push(`token=${encodeURIComponent(t)}`)
          }
        }

        const queryString =
          queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
        const wsUrl =
          [wsProtocol, '', `${host}:${port}`, 'api', 'ws'].join('/') +
          queryString

        const ws = new WebSocket(wsUrl)
        this.socket = ws

        let opened = false

        ws.onopen = () => {
          opened = true
          this.updateStatus('connected')
          this.startHeartbeat(30000)
          resolve()

          if (this.activeSessionId) {
            void this.replayEventsAfterReconnect()
          }
        }

        ws.onmessage = (event: MessageEvent) => {
          const raw = String(event.data)
          this.handleIncomingFrames(raw)
        }

        ws.onclose = () => {
          this.cleanupSocket()
          this.updateStatus('disconnected')
          if (!opened) {
            reject(new Error('WebSocket connection failed'))
          }
          if (
            !this.isManualDisconnect &&
            (this.connectOptions.autoReconnect ?? true)
          ) {
            this.scheduleReconnect()
          }
        }

        ws.onerror = (err) => {
          this.updateStatus('error')
          if (!opened) {
            reject(err)
          }
        }
      } catch (err) {
        this.updateStatus('error')
        reject(err)
      }
    })
  }

  public disconnect(): void {
    this.isManualDisconnect = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.petStateResetTimer) {
      clearTimeout(this.petStateResetTimer)
      this.petStateResetTimer = null
    }
    this.cleanupSocket()
    if (this.socket) {
      try {
        this.socket.close()
      } catch {
        void 0
      }
      this.socket = null
    }
    this.updateStatus('disconnected')
  }

  private cleanupSocket(): void {
    for (const [id, req] of this.pendingRequests.entries()) {
      if (req.timer) {
        clearTimeout(req.timer)
      }
      req.reject(new Error(`Connection closed before response for ID ${id}`))
    }
    this.pendingRequests.clear()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    const interval = this.connectOptions.reconnectIntervalMs ?? 2000
    this.updateStatus('reconnecting')
    this.reconnectTimer = setTimeout(() => {
      if (this.isManualDisconnect) {
        return
      }
      void this.connect(
        this.currentConfig.host,
        this.currentConfig.port,
        this.connectOptions
      ).catch(() => {
        if (!this.isManualDisconnect) {
          this.scheduleReconnect()
        }
      })
    }, interval)
  }

  private updateStatus(status: ConnectionStatus): void {
    useHermesStore.getState().setConnectionStatus(status)
    for (const listener of this.statusListeners) {
      try {
        listener(status)
      } catch {
        void 0
      }
    }
  }

  private sendRaw(data: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    this.socket.send(data)
  }

  public sendRequest<TResult = unknown>(
    method: string,
    params?: unknown,
    timeoutMs = 30000
  ): Promise<TResult> {
    const id = this.nextRequestId++
    const request = createRequest(method, params, id)

    return new Promise<TResult>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          this.pendingRequests.delete(id)
          reject(new Error(`Request timeout for method ${method} (ID ${id})`))
        }, timeoutMs)
      }

      this.pendingRequests.set(id, {
        resolve: resolve as (val: unknown) => void,
        reject,
        timer,
      })

      try {
        this.sendRaw(JSON.stringify(request))
      } catch (err) {
        if (timer) {
          clearTimeout(timer)
        }
        this.pendingRequests.delete(id)
        reject(err)
      }
    })
  }

  public sendNotification(method: string, params?: unknown): void {
    const notification: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 0,
      method,
      params,
    }
    delete (notification as Partial<JsonRpcRequest>).id
    this.sendRaw(JSON.stringify(notification))
  }

  private handleIncomingFrames(raw: string): void {
    const frames = splitBatchedFrames(raw)
    for (const frame of frames) {
      try {
        const parsed = JSON.parse(frame)
        this.handleParsedMessage(parsed)
      } catch {
        void 0
      }
    }
  }

  private handleParsedMessage(msg: unknown): void {
    if (isJsonRpcResponse(msg)) {
      this.handleResponse(msg)
      return
    }

    if (isJsonRpcRequest(msg)) {
      this.handleServerRequest(msg)
      return
    }

    if (isJsonRpcNotification(msg)) {
      this.handleNotification(msg)
      return
    }

    if (msg && typeof msg === 'object') {
      const record = msg as Record<string, unknown>
      if (record.method === 'event' && record.params) {
        this.handleEventParams(record.params as Record<string, unknown>)
        return
      }
      if (typeof record.type === 'string') {
        this.handleGatewayEvent({
          type: record.type,
          payload: record.payload,
          seq: typeof record.seq === 'number' ? record.seq : undefined,
          session_id:
            typeof record.session_id === 'string'
              ? record.session_id
              : undefined,
        })
      }
    }
  }

  private handleResponse(res: JsonRpcResponse): void {
    if (res.id === null || res.id === undefined) {
      return
    }
    const pending = this.pendingRequests.get(res.id)
    if (!pending) {
      return
    }
    this.pendingRequests.delete(res.id)
    if (pending.timer) {
      clearTimeout(pending.timer)
    }

    if (isJsonRpcSuccessResponse(res)) {
      pending.resolve(res.result)
    } else if (isJsonRpcErrorResponse(res)) {
      pending.reject(
        new Error(`[${res.error.code}] ${res.error.message}`)
      )
    }
  }

  private handleServerRequest(req: JsonRpcRequest): void {
    for (const listener of this.serverRequestListeners) {
      try {
        listener(req.method, req.params, req.id)
      } catch {
        void 0
      }
    }

    if (req.method === 'approval') {
      const p = req.params as Partial<ServerRequestApproval> | undefined
      if (p && typeof p.request_id === 'string') {
        useHermesStore.getState().setActiveApprovalRequest({
          request_id: p.request_id,
          command: p.command ?? '',
          description: p.description,
          choices: p.choices ?? ['once', 'session', 'always', 'deny'],
          expiresAt: p.expires_at ?? Date.now() + 300000,
        })
        useHermesStore.getState().setPetState('waiting')
      }
    } else if (req.method === 'clarify') {
      const p = req.params as Partial<ServerRequestClarify> | undefined
      if (p && typeof p.request_id === 'string' && Array.isArray(p.questions)) {
        useHermesStore.getState().setActiveClarifyRequest({
          request_id: p.request_id,
          questions: p.questions as ClarifyQuestion[],
        })
      }
    }
  }

  private handleNotification(notif: { method: string; params?: unknown }): void {
    if (notif.method === 'event' && notif.params) {
      this.handleEventParams(notif.params as Record<string, unknown>)
      return
    }

    if (notif.method === 'gateway.ready') {
      this.handleGatewayReady(notif.params as Record<string, unknown>)
      return
    }

    this.handleGatewayEvent({
      type: notif.method,
      payload: notif.params,
    })
  }

  private handleEventParams(params: Record<string, unknown>): void {
    const type = typeof params.type === 'string' ? params.type : 'unknown'
    const payload = params.payload
    const seq = typeof params.seq === 'number' ? params.seq : undefined
    const sessionId =
      typeof params.session_id === 'string' ? params.session_id : undefined

    if (seq !== undefined && seq > this.lastSeq) {
      this.lastSeq = seq
    }

    if (type === 'gateway.ready') {
      this.handleGatewayReady((payload as Record<string, unknown>) ?? params)
    }

    this.handleGatewayEvent({
      type,
      payload,
      seq,
      session_id: sessionId,
    })
  }

  private handleGatewayReady(payload: Record<string, unknown>): void {
    const handshake = {
      jsonrpc: '2.0',
      id: 1,
      method: 'client.capabilities',
      params: {
        server_requests: true,
      },
    }
    try {
      this.sendRaw(JSON.stringify(handshake))
    } catch {
      void 0
    }

    const interval = Number(payload?.heartbeat_interval_ms)
    if (!isNaN(interval) && interval > 0) {
      this.startHeartbeat(interval)
    }
  }

  private startHeartbeat(intervalMs: number): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const startTime = Date.now()
        this.sendRequest<{ timestamp?: number }>('session.ping', undefined, 5000)
          .then(() => {
            const latency = Date.now() - startTime
            useHermesStore.getState().setLatencyMs(latency)
          })
          .catch(() => {
            void 0
          })
      }
    }, intervalMs)
  }

  private handleGatewayEvent(event: GatewayEvent): void {
    if (typeof event.seq === 'number' && event.seq > this.lastSeq) {
      this.lastSeq = event.seq
    }

    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch {
        void 0
      }
    }

    const type = event.type
    const payload = event.payload

    if (type === 'message.start') {
      const p = payload as Partial<MessageStartPayload> | undefined
      this.reasoningBuffer = ''
      this.messageBuffer = ''
      const turnId = p?.turn_id ?? `turn_${Date.now()}`
      useHermesStore.getState().startStreaming(turnId)
      useHermesStore.getState().setPetState('review')
    } else if (type === 'reasoning.delta') {
      const p = payload as Partial<ReasoningDeltaPayload> | undefined
      const delta = p?.text ?? ''
      this.reasoningBuffer += delta
      useHermesStore.getState().appendReasoningDelta(delta)
      useHermesStore.getState().setPetState('review')
    } else if (type === 'message.delta') {
      const p = payload as Partial<MessageDeltaPayload> | undefined
      const delta = p?.text ?? ''
      const isContinuation = Boolean(p?._length_continuation_nudge)
      this.messageBuffer += delta
      useHermesStore.getState().appendMessageDelta(delta, isContinuation)
    } else if (type === 'tool.generating') {
      useHermesStore.getState().setPetState('review')
    } else if (type === 'tool.start') {
      const p = payload as Partial<ToolStartPayload> | undefined
      if (p && p.tool_id && p.name) {
        useHermesStore.getState().addOrUpdateToolCall({
          tool_id: p.tool_id,
          name: p.name,
          args: p.args ?? {},
          status: 'executing',
        })
        useHermesStore.getState().setPetState('running')
      }
    } else if (type === 'tool.complete') {
      const p = payload as Partial<ToolCompletePayload> | undefined
      if (p && p.tool_id && p.name) {
        useHermesStore.getState().addOrUpdateToolCall({
          tool_id: p.tool_id,
          name: p.name,
          result: p.result,
          inline_diff: p.inline_diff,
          duration: p.duration_s,
          status: 'completed',
        })
      }
    } else if (type === 'message.complete') {
      const p = payload as Partial<MessageCompletePayload> | undefined
      useHermesStore
        .getState()
        .finishStreaming(p?.text ?? this.messageBuffer, p?.reasoning)
      useHermesStore.getState().setPetState('waving')
      if (this.petStateResetTimer) {
        clearTimeout(this.petStateResetTimer)
      }
      this.petStateResetTimer = setTimeout(() => {
        useHermesStore.getState().setPetState('idle')
      }, 2000)
    } else if (type === 'status.update') {
      const p = payload as Partial<StatusUpdatePayload> | undefined
      if (p && p.status) {
        if (p.status === 'thinking') {
          useHermesStore.getState().setPetState('review')
        } else if (p.status === 'executing') {
          useHermesStore.getState().setPetState('running')
        } else if (p.status === 'idle') {
          useHermesStore.getState().setPetState('idle')
        }
      }
    } else if (type === 'reaction') {
      const p = payload as Partial<ReactionPayload> | undefined
      if (p && p.kind === 'hearts') {
        useHermesStore.getState().triggerVibeHearts()
      }
    } else if (type === 'pet.changed') {
      const p = payload as Partial<PetChangedPayload> | undefined
      if (p && p.slug) {
        useHermesStore.getState().setActivePet({
          slug: p.slug,
          scale: p.scale ?? 0.33,
        })
      }
    }
  }

  private async replayEventsAfterReconnect(): Promise<void> {
    if (!this.activeSessionId) {
      return
    }

    try {
      const result = await this.sessionEventsSince(
        this.activeSessionId,
        this.lastSeq
      )

      if (result && result.truncated) {
        await this.sessionResume(this.activeSessionId)
      } else if (result && Array.isArray(result.events)) {
        for (const event of result.events) {
          this.handleGatewayEvent(event)
        }
      }
    } catch {
      if (this.activeSessionId) {
        try {
          await this.sessionResume(this.activeSessionId)
        } catch {
          void 0
        }
      }
    }
  }

  public promptSubmit(
    sessionId: string,
    text: string,
    attachments?: Attachment[]
  ): Promise<unknown> {
    this.setActiveSessionId(sessionId)
    return this.sendRequest('prompt.submit', {
      session_id: sessionId,
      text,
      surface: 'mobile',
      attachments: attachments ?? [],
    })
  }

  public sessionInterrupt(sessionId: string): Promise<unknown> {
    return this.sendRequest('session.interrupt', {
      session_id: sessionId,
    })
  }

  public sessionSteer(
    sessionId: string,
    instruction: string
  ): Promise<unknown> {
    return this.sendRequest('session.steer', {
      session_id: sessionId,
      instruction,
    })
  }

  public sessionUndo(
    sessionId: string,
    intent: 'undo' | 'retry' = 'undo'
  ): Promise<unknown> {
    return this.sendRequest('session.undo', {
      session_id: sessionId,
      intent,
    })
  }

  public sessionCompress(
    sessionId: string,
    focusTopic?: string
  ): Promise<unknown> {
    const params: Record<string, unknown> = { session_id: sessionId }
    if (focusTopic !== undefined) {
      params.focus_topic = focusTopic
    }
    return this.sendRequest('session.compress', params)
  }

  public async sessionCreate(params: {
    model?: string
    profile?: string
    title?: string
    cwd?: string
  }): Promise<Session> {
    const res = await this.sendRequest<Session>('session.create', params)
    if (res && res.session_id) {
      this.setActiveSessionId(res.session_id)
    }
    return res
  }

  public async sessionResume(
    sessionId: string
  ): Promise<ResumeSessionResult> {
    this.setActiveSessionId(sessionId)
    const res = await this.sendRequest<ResumeSessionResult>('session.resume', {
      session_id: sessionId,
    })
    if (res && res.session) {
      useHermesStore.getState().setActiveSessionId(res.session.session_id)
      if (Array.isArray(res.turns)) {
        useHermesStore.getState().setTurns(res.turns)
      }
    }
    return res
  }

  public sessionList(params?: {
    limit?: number
    profile?: string
  }): Promise<Session[]> {
    return this.sendRequest<Session[]>('session.list', params ?? {})
  }

  public sessionEventsSince(
    sessionId: string,
    lastSeen: number
  ): Promise<EventsSinceResult> {
    return this.sendRequest<EventsSinceResult>('session.events.since', {
      session_id: sessionId,
      last_seen: lastSeen,
    })
  }

  public respondApproval(
    requestId: string,
    choice: 'once' | 'session' | 'always' | 'deny'
  ): void {
    const response: JsonRpcSuccessResponse<{ choice: string }> = {
      jsonrpc: '2.0',
      id: requestId,
      result: { choice },
    }
    this.sendRaw(JSON.stringify(response))
    useHermesStore.getState().setActiveApprovalRequest(null)
    useHermesStore.getState().setPetState('idle')
  }

  public respondClarify(
    requestId: string,
    answers: Record<string, string | string[]>
  ): void {
    const response: JsonRpcSuccessResponse<{
      answers: Record<string, string | string[]>
    }> = {
      jsonrpc: '2.0',
      id: requestId,
      result: { answers },
    }
    this.sendRaw(JSON.stringify(response))
    useHermesStore.getState().setActiveClarifyRequest(null)
  }

  public onEvent(listener: (event: GatewayEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  public onServerRequest(
    listener: (method: string, params: unknown, id: string | number) => void
  ): () => void {
    this.serverRequestListeners.add(listener)
    return () => {
      this.serverRequestListeners.delete(listener)
    }
  }

  public onConnectionStatus(
    listener: (status: ConnectionStatus) => void
  ): () => void {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }
}

export const hermesClient = new HermesClient()
