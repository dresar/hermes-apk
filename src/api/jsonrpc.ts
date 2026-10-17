import type {
  JsonRpcErrorObject,
  JsonRpcErrorResponse,
  JsonRpcId,
  JsonRpcMessage,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
} from './types'

export function createRequest<TParams = unknown>(
  method: string,
  params?: TParams,
  id: string | number = Date.now()
): JsonRpcRequest<TParams> {
  const request: JsonRpcRequest<TParams> = {
    jsonrpc: '2.0',
    id,
    method,
  }
  if (params !== undefined) {
    request.params = params
  }
  return request
}

export function createNotification<TParams = unknown>(
  method: string,
  params?: TParams
): JsonRpcNotification<TParams> {
  const notification: JsonRpcNotification<TParams> = {
    jsonrpc: '2.0',
    method,
  }
  if (params !== undefined) {
    notification.params = params
  }
  return notification
}

export function createResponse<TResult = unknown>(
  id: JsonRpcId,
  result: TResult
): JsonRpcSuccessResponse<TResult> {
  return {
    jsonrpc: '2.0',
    id,
    result,
  }
}

export function createErrorResponse<TData = unknown>(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: TData
): JsonRpcErrorResponse<TData> {
  const errorObj: JsonRpcErrorObject<TData> = {
    code,
    message,
  }
  if (data !== undefined) {
    errorObj.data = data
  }
  return {
    jsonrpc: '2.0',
    id,
    error: errorObj,
  }
}

export function splitBatchedFrames(raw: string): string[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function isJsonRpcRequest(val: unknown): val is JsonRpcRequest {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return false
  }
  const obj = val as Record<string, unknown>
  return (
    obj.jsonrpc === '2.0' &&
    typeof obj.method === 'string' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number')
  )
}

export function isJsonRpcNotification(val: unknown): val is JsonRpcNotification {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return false
  }
  const obj = val as Record<string, unknown>
  return (
    obj.jsonrpc === '2.0' &&
    typeof obj.method === 'string' &&
    obj.id === undefined
  )
}

export function isJsonRpcSuccessResponse(val: unknown): val is JsonRpcSuccessResponse {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return false
  }
  const obj = val as Record<string, unknown>
  return (
    obj.jsonrpc === '2.0' &&
    'result' in obj &&
    (typeof obj.id === 'string' || typeof obj.id === 'number' || obj.id === null)
  )
}

export function isJsonRpcErrorResponse(val: unknown): val is JsonRpcErrorResponse {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return false
  }
  const obj = val as Record<string, unknown>
  if (
    obj.jsonrpc !== '2.0' ||
    typeof obj.error !== 'object' ||
    obj.error === null
  ) {
    return false
  }
  const err = obj.error as Record<string, unknown>
  return (
    typeof err.code === 'number' &&
    typeof err.message === 'string' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number' || obj.id === null)
  )
}

export function isJsonRpcResponse(val: unknown): val is JsonRpcResponse {
  return isJsonRpcSuccessResponse(val) || isJsonRpcErrorResponse(val)
}

export function isJsonRpcMessage(val: unknown): val is JsonRpcMessage {
  return (
    isJsonRpcRequest(val) ||
    isJsonRpcNotification(val) ||
    isJsonRpcResponse(val)
  )
}

export function parseJsonRpcMessage(raw: string): JsonRpcMessage | null {
  try {
    const parsed = JSON.parse(raw)
    if (isJsonRpcMessage(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function parseBatchedFrames(raw: string): JsonRpcMessage[] {
  const frames = splitBatchedFrames(raw)
  const messages: JsonRpcMessage[] = []
  for (const frame of frames) {
    const msg = parseJsonRpcMessage(frame)
    if (msg) {
      messages.push(msg)
    }
  }
  return messages
}
