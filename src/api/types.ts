export type JsonRpcId = string | number | null

export type JsonRpcVersion = '2.0'

export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: JsonRpcVersion
  id: string | number
  method: string
  params?: TParams
}

export interface JsonRpcNotification<TParams = unknown> {
  jsonrpc: JsonRpcVersion
  method: string
  params?: TParams
}

export interface JsonRpcErrorObject<TData = unknown> {
  code: number
  message: string
  data?: TData
}

export interface JsonRpcSuccessResponse<TResult = unknown> {
  jsonrpc: JsonRpcVersion
  id: JsonRpcId
  result: TResult
}

export interface JsonRpcErrorResponse<TData = unknown> {
  jsonrpc: JsonRpcVersion
  id: JsonRpcId
  error: JsonRpcErrorObject<TData>
}

export type JsonRpcResponse<TResult = unknown, TData = unknown> =
  | JsonRpcSuccessResponse<TResult>
  | JsonRpcErrorResponse<TData>

export type JsonRpcMessage =
  | JsonRpcRequest
  | JsonRpcNotification
  | JsonRpcResponse

export type GatewayEventName =
  | 'gateway.ready'
  | 'message.start'
  | 'message.delta'
  | 'reasoning.delta'
  | 'tool.generating'
  | 'tool.start'
  | 'tool.complete'
  | 'message.interim'
  | 'message.complete'
  | 'status.update'
  | 'reaction'
  | 'pet.changed'
  | `subagent.${string}`

export interface GatewayReadyPayload {
  active_skin?: string
  heartbeat_interval_ms?: number
  version?: string
}

export interface MessageStartPayload {
  turn_id?: string
  session_id?: string
  role?: string
}

export interface MessageDeltaPayload {
  text: string
  _length_continuation_nudge?: boolean
}

export interface ReasoningDeltaPayload {
  text: string
}

export interface ToolGeneratingPayload {
  tool_id?: string
  name?: string
}

export interface ToolStartPayload {
  tool_id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolCompletePayload {
  tool_id: string
  name: string
  result: string
  inline_diff?: string
  duration_s?: number
}

export interface MessageInterimPayload {
  text: string
}

export interface MessageCompletePayload {
  text?: string
  usage?: Record<string, unknown>
  status?: string
  reasoning?: string
  finish_reason?: string
}

export interface StatusUpdatePayload {
  status: 'thinking' | 'executing' | 'compacting' | 'goal' | 'idle' | string
  details?: string
}

export interface ReactionPayload {
  kind: 'hearts' | string
}

export interface PetChangedPayload {
  enabled: boolean
  slug: string
  scale?: number
}

export interface SubagentEventPayload {
  subagent_id?: string
  type?: string
  text?: string
  status?: string
  data?: unknown
}

export type GatewayPayloadMap = {
  'gateway.ready': GatewayReadyPayload
  'message.start': MessageStartPayload
  'message.delta': MessageDeltaPayload
  'reasoning.delta': ReasoningDeltaPayload
  'tool.generating': ToolGeneratingPayload
  'tool.start': ToolStartPayload
  'tool.complete': ToolCompletePayload
  'message.interim': MessageInterimPayload
  'message.complete': MessageCompletePayload
  'status.update': StatusUpdatePayload
  'reaction': ReactionPayload
  'pet.changed': PetChangedPayload
  [key: `subagent.${string}`]: SubagentEventPayload
}

export interface GatewayEvent<T = unknown> {
  type: GatewayEventName | string
  payload: T
  seq?: number
  session_id?: string
  timestamp?: number
}

export interface ClarifyQuestion {
  qid: string
  question: string
  choices: string[]
  multi_select?: boolean
}

export interface ServerRequestApproval {
  request_id: string
  command: string
  description?: string
  choices: ('once' | 'session' | 'always' | 'deny')[]
  expires_at?: number
}

export interface ServerRequestClarify {
  request_id: string
  questions: ClarifyQuestion[]
}

export interface ServerRequestSudo {
  request_id: string
  prompt?: string
  reason?: string
}

export interface ServerRequestSecret {
  request_id: string
  key_name: string
  description?: string
}

export interface ServerRequestVaultUnlockPrompt {
  request_id: string
  prompt?: string
  provider?: string
}

export interface ServerRequestMap {
  approval: ServerRequestApproval
  clarify: ServerRequestClarify
  sudo: ServerRequestSudo
  secret: ServerRequestSecret
  'vault.unlock_prompt': ServerRequestVaultUnlockPrompt
}

export type ServerRequestMethod = keyof ServerRequestMap

export interface Session {
  session_id: string
  title: string
  model?: string
  profile?: string
  cwd?: string
  created_at?: string
  updated_at?: string
}

export interface Model {
  id: string
  name: string
  provider?: string
  context_window?: number
}

export interface PetManifestEntry {
  slug: string
  name: string
  spritesheetUrl: string
  zipUrl?: string
  thumb?: string
  scale?: number
}

export interface PetGalleryItem {
  slug: string
  name: string
  spritesheetUrl: string
  thumbUrl?: string
  previewBase64?: string
  isLocal?: boolean
}

export interface RollbackCheckpoint {
  checkpoint_id: string
  session_id?: string
  commit_hash?: string
  message: string
  timestamp: string
  files_changed?: string[]
}

export interface GoalMilestone {
  id: string
  title: string
  completed: boolean
}

export interface GoalContract {
  goal_id: string
  session_id?: string
  title: string
  status: 'pending' | 'in_progress' | 'achieved' | 'paused' | 'failed'
  milestones?: GoalMilestone[]
}

export interface LoopItem {
  loop_id: string
  session_id?: string
  name: string
  cron_expression?: string
  interval_ms?: number
  status: 'active' | 'paused' | 'stopped'
  last_run?: string
}

export interface Attachment {
  name: string
  mime: string
  content_base64: string
}

export interface ToolCall {
  tool_id: string
  name: string
  args: Record<string, unknown>
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: string
  inline_diff?: string
  duration?: number
}

export interface Turn {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  timestamp: number
  toolCalls?: ToolCall[]
  _length_continuation_nudge?: boolean
}

export interface ActiveTurnStreamingState {
  reasoningBuffer: string
  messageBuffer: string
  isStreaming: boolean
  currentTurnId: string | null
}

export interface ApprovalRequest {
  request_id: string
  command: string
  description?: string
  choices: ('once' | 'session' | 'always' | 'deny')[]
  expiresAt?: number
}

export interface ClarifyRequest {
  request_id: string
  questions: ClarifyQuestion[]
}

export type PetState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'wave'
  | 'waving'
  | 'jump'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'run'
  | 'review'

export interface ActivePet {
  slug: string
  name: string
  spritesheetUrl: string
  scale: number
  state: PetState
}

export interface GatewayConfig {
  host: string
  port: number
  token?: string
  username?: string
  password?: string
  useSsl?: boolean
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export interface EventsSinceResult {
  events: GatewayEvent[]
  truncated: boolean
  last_seq: number
}

export interface ResumeSessionResult {
  session: Session
  turns?: Turn[]
  status?: string
}
