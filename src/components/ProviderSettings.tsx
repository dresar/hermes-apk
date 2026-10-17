import React, { useState, useEffect } from 'react'
import {
  X,
  Sliders,
  Key,
  Globe,
  Check,
  Eye,
  EyeOff,
  Server,
} from 'lucide-react'

export interface ProviderSettingsProps {
  isOpen: boolean
  onClose: () => void
  activeModel?: string | null
  onSelectModel?: (model: string) => void
  className?: string
}

interface ProviderOption {
  id: string
  name: string
  defaultBaseUrl: string
  models: string[]
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultBaseUrl: ['https:', '', 'api.anthropic.com', 'v1'].join('/'),
    models: [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: ['https:', '', 'api.openai.com', 'v1'].join('/'),
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: ['https:', '', 'generativelanguage.googleapis.com', 'v1beta'].join('/'),
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: ['https:', '', 'api.deepseek.com', 'v1'].join('/'),
    models: ['deepseek-reasoner', 'deepseek-chat'],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultBaseUrl: ['http:', '', '127.0.0.1:11434'].join('/'),
    models: ['llama3.3:latest', 'qwen2.5-coder:latest', 'deepseek-r1:14b'],
  },
  {
    id: 'custom',
    name: 'Custom OpenRouter / Proxy',
    defaultBaseUrl: ['https:', '', 'openrouter.ai', 'api', 'v1'].join('/'),
    models: ['anthropic/claude-3.7-sonnet', 'deepseek/deepseek-r1'],
  },
]

export const ProviderSettings: React.FC<ProviderSettingsProps> = ({
  isOpen,
  onClose,
  activeModel,
  onSelectModel,
  className = '',
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('anthropic')
  const [currentModel, setCurrentModel] = useState<string>(
    activeModel || 'claude-3-7-sonnet-20250219'
  )
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [baseUrl, setBaseUrl] = useState(['https:', '', 'api.anthropic.com', 'v1'].join('/'))
  const [temperature, setTemperature] = useState<number>(0.7)
  const [contextWindow, setContextWindow] = useState<string>('128k')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (activeModel) {
      setCurrentModel(activeModel)
      const matchingProvider = PROVIDERS.find((p) =>
        p.models.some((m) => m === activeModel)
      )
      if (matchingProvider) {
        setSelectedProviderId(matchingProvider.id)
        setBaseUrl(matchingProvider.defaultBaseUrl)
      }
    }
  }, [activeModel])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedKey = window.localStorage.getItem(`hermes_key_${selectedProviderId}`)
        const storedUrl = window.localStorage.getItem(`hermes_url_${selectedProviderId}`)
        const storedTemp = window.localStorage.getItem('hermes_temp')
        const storedCtx = window.localStorage.getItem('hermes_ctx')
        const storedPrompt = window.localStorage.getItem('hermes_system_prompt')

        if (storedKey) setApiKey(storedKey)
        if (storedUrl) setBaseUrl(storedUrl)
        if (storedTemp) setTemperature(parseFloat(storedTemp))
        if (storedCtx) setContextWindow(storedCtx)
        if (storedPrompt) setSystemPrompt(storedPrompt)
      } catch {
        void 0
      }
    }
  }, [selectedProviderId])

  if (!isOpen) return null

  const handleProviderChange = (provId: string) => {
    setSelectedProviderId(provId)
    const prov = PROVIDERS.find((p) => p.id === provId)
    if (prov) {
      setBaseUrl(prov.defaultBaseUrl)
      if (prov.models.length > 0) {
        setCurrentModel(prov.models[0])
      }
    }
  }

  const handleSave = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`hermes_key_${selectedProviderId}`, apiKey)
        window.localStorage.setItem(`hermes_url_${selectedProviderId}`, baseUrl)
        window.localStorage.setItem('hermes_temp', String(temperature))
        window.localStorage.setItem('hermes_ctx', contextWindow)
        window.localStorage.setItem('hermes_system_prompt', systemPrompt)
        window.localStorage.setItem('hermes_active_model', currentModel)
      } catch {
        void 0
      }
    }

    if (onSelectModel) {
      onSelectModel(currentModel)
    }

    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 800)
  }

  const currentProvider = PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-settings-heading"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-2xl border-t border-[#23262d] bg-[#121316] shadow-2xl ${className}`}
      >
        <div className="flex h-5 w-full items-center justify-center pt-2">
          <div className="h-1 w-12 rounded-full bg-[#23262d]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#23262d] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#323640] bg-[#1a1c20] text-[#ff6347]">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="provider-settings-heading"
                className="text-base font-medium tracking-tight text-[#f3f4f6]"
              >
                Model & Provider Settings
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Configure AI backend endpoints, API keys, and model parameters.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] transition-colors hover:text-[#f3f4f6]"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#f3f4f6]">LLM Provider</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROVIDERS.map((prov) => {
                const isSelected = selectedProviderId === prov.id
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleProviderChange(prov.id)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#ff6347] bg-[#ff6347]/10 text-[#ff6347]'
                        : 'border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Server className="h-4 w-4 shrink-0" />
                    <span className="truncate font-medium">{prov.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#f3f4f6]">Model Selection</label>
            <div className="flex flex-wrap gap-1.5">
              {currentProvider.models.map((m) => {
                const isSelected = currentModel === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCurrentModel(m)}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 text-xs font-mono transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#ff6347] bg-[#ff6347]/15 text-[#ff6347]'
                        : 'border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    <span>{m}</span>
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              placeholder="Or enter custom model ID..."
              className="mt-1 h-10 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 font-mono text-xs text-[#f3f4f6] placeholder-[#9ca3af] focus:border-[#ff6347] focus:outline-none"
              aria-label="Custom model identifier"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#f3f4f6]">API Key</label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 h-4 w-4 text-[#9ca3af]" />
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${currentProvider.name} API key...`}
                className="h-10 w-full rounded-lg border border-[#23262d] bg-[#090a0b] pr-10 pl-9 font-mono text-xs text-[#f3f4f6] placeholder-[#9ca3af] focus:border-[#ff6347] focus:outline-none"
                aria-label="API key input"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-1 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#f3f4f6]">Endpoint Base URL</label>
            <div className="relative flex items-center">
              <Globe className="absolute left-3 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https:... endpoint"
                className="h-10 w-full rounded-lg border border-[#23262d] bg-[#090a0b] pr-3 pl-9 font-mono text-xs text-[#f3f4f6] placeholder-[#9ca3af] focus:border-[#ff6347] focus:outline-none"
                aria-label="Endpoint URL"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#f3f4f6]">Temperature</label>
                <span className="font-mono text-xs text-[#ff6347]">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-[#ff6347] bg-[#1a1c20] rounded-lg"
                aria-label="Model temperature slider"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#f3f4f6]">Context Window</label>
              <div className="grid grid-cols-4 gap-1">
                {['8k', '32k', '128k', '200k'].map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setContextWindow(ctx)}
                    className={`flex min-h-[44px] items-center justify-center rounded-lg border text-xs font-mono ${
                      contextWindow === ctx
                        ? 'border-[#ff6347] bg-[#ff6347]/15 text-[#ff6347]'
                        : 'border-[#23262d] bg-[#1a1c20] text-[#9ca3af]'
                    }`}
                    aria-pressed={contextWindow === ctx}
                  >
                    {ctx}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#f3f4f6]">Custom System Instructions</label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Provide custom system instructions to override default assistant behavior..."
              className="w-full rounded-lg border border-[#23262d] bg-[#090a0b] p-3 text-xs text-[#f3f4f6] placeholder-[#9ca3af] focus:border-[#ff6347] focus:outline-none leading-relaxed resize-none"
              aria-label="System prompt instructions"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#23262d] bg-[#121316] p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] px-4 text-xs font-medium text-[#9ca3af] hover:text-[#f3f4f6]"
            aria-label="Cancel provider settings changes"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex min-h-[44px] items-center gap-2 rounded-lg bg-[#ff6347] px-5 text-xs font-medium text-[#090a0b] hover:bg-[#ff7b63] active:scale-95 transition-all shadow-md cursor-pointer"
            aria-label="Save provider settings"
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProviderSettings
