import React, { useState, useEffect } from 'react'
import {
  Server,
  Key,
  Shield,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  Check,
  X,
  User,
} from 'lucide-react'

export interface GatewayConfig {
  id: string
  name: string
  type: 'tailscale' | 'direct' | 'local'
  host: string
  port: number
  useHttps: boolean
  authType: 'password' | 'bearer'
  username?: string
  password?: string
  bearerToken?: string
  active?: boolean
}

export interface BotProfile {
  id: string
  name: string
  description: string
  soulFile: string
  model: string
  active: boolean
}

export interface GatewayVaultProps {
  isOpen: boolean
  onClose: () => void
  activeGateway?: GatewayConfig
  onSaveGateway?: (config: GatewayConfig) => void
  onConnect?: (config: GatewayConfig) => void
  onInjectOtp?: (otp: string) => Promise<boolean> | boolean
  onRequestUnlock?: () => Promise<boolean> | boolean
  className?: string
}

const DEFAULT_GATEWAYS: GatewayConfig[] = [
  {
    id: 'gw-tailscale',
    name: 'Tailscale Hermes Host',
    type: 'tailscale',
    host: '100.64.0.12',
    port: 9119,
    useHttps: false,
    authType: 'password',
    username: 'hermes',
    password: '',
    active: true,
  },
  {
    id: 'gw-direct',
    name: 'Direct Gateway VPS',
    type: 'direct',
    host: 'gateway.internal',
    port: 9119,
    useHttps: true,
    authType: 'bearer',
    bearerToken: '',
    active: false,
  },
  {
    id: 'gw-local',
    name: 'Local Devbox',
    type: 'local',
    host: '127.0.0.1',
    port: 9119,
    useHttps: false,
    authType: 'password',
    username: 'admin',
    password: '',
    active: false,
  },
]

const DEFAULT_BOT_PROFILES: BotProfile[] = [
  {
    id: 'bot-default',
    name: 'Hermes Primary',
    description: 'Autonomous core agent with full toolset and deep reasoning.',
    soulFile: 'SOUL.md',
    model: 'hermes (high)',
    active: true,
  },
  {
    id: 'bot-coder',
    name: 'Code Synthesizer',
    description: 'Specialized in multi-file refactoring and type safety.',
    soulFile: 'coder.soul.md',
    model: 'hermes-coder',
    active: false,
  },
  {
    id: 'bot-devops',
    name: 'DevOps Sentinel',
    description: 'Cloud deployments, Git checkpoint verification, and CI/CD.',
    soulFile: 'devops.soul.md',
    model: 'hermes (flash)',
    active: false,
  },
]

export const GatewayVault: React.FC<GatewayVaultProps> = ({
  isOpen,
  onClose,
  activeGateway,
  onSaveGateway,
  onConnect,
  onInjectOtp,
  onRequestUnlock,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'gateways' | 'profiles' | 'vault'>('gateways')
  const [gateways, setGateways] = useState<GatewayConfig[]>(DEFAULT_GATEWAYS)
  const [botProfiles, setBotProfiles] = useState<BotProfile[]>(DEFAULT_BOT_PROFILES)
  const [editingGateway, setEditingGateway] = useState<GatewayConfig>(activeGateway || DEFAULT_GATEWAYS[0])
  const [showPassword, setShowPassword] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpStatus, setOtpStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    if (activeGateway) {
      setEditingGateway(activeGateway)
    }
  }, [activeGateway])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSelectGateway = (gw: GatewayConfig) => {
    setGateways((prev) =>
      prev.map((item) => ({ ...item, active: item.id === gw.id })),
    )
    setEditingGateway(gw)
  }

  const handleSelectProfile = (profileId: string) => {
    setBotProfiles((prev) =>
      prev.map((item) => ({ ...item, active: item.id === profileId })),
    )
  }

  const handleSaveConnection = () => {
    setGateways((prev) => {
      const exists = prev.some((g) => g.id === editingGateway.id)
      if (exists) {
        return prev.map((g) => (g.id === editingGateway.id ? editingGateway : g))
      }
      return [...prev, editingGateway]
    })
    if (onSaveGateway) {
      onSaveGateway(editingGateway)
    }
    if (onConnect) {
      onConnect(editingGateway)
    }
  }

  const handleInjectOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) return

    setOtpStatus('submitting')
    try {
      let ok = true
      if (onInjectOtp) {
        ok = await onInjectOtp(otpCode)
      }
      if (ok) {
        setOtpStatus('success')
        setTimeout(() => {
          setOtpCode('')
          setOtpStatus('idle')
        }, 1200)
      } else {
        setOtpStatus('error')
      }
    } catch {
      setOtpStatus('error')
    }
  }

  const handleUnlockMasterVault = async () => {
    if (onRequestUnlock) {
      const ok = await onRequestUnlock()
      setIsUnlocked(ok)
    } else {
      setIsUnlocked(true)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs transition-opacity ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateway-vault-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-2xl border border-[#23262d] bg-[#121316] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#23262d] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#323640] bg-[#1a1c20] text-[#ff6347]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="gateway-vault-title"
                className="text-base font-semibold tracking-tight text-[#f3f4f6]"
              >
                Gateway & Credential Vault
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Hermes Mode 1 (Profiles) & Mode 10 (Vault)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] transition-colors hover:text-[#f3f4f6]"
            aria-label="Close gateway vault"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[#23262d] px-4 pt-2 pb-2">
          {(['gateways', 'profiles', 'vault'] as const).map((tab) => {
            const isTabActive = activeTab === tab
            const label =
              tab === 'gateways'
                ? 'Multi-Gateway'
                : tab === 'profiles'
                  ? 'Bot Profiles'
                  : '2FA & Vault'
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-3 text-xs font-medium transition-colors ${
                  isTabActive
                    ? 'border border-[#ff6347]/40 bg-[#ff6347]/15 text-[#ff6347]'
                    : 'border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]'
                }`}
                aria-pressed={isTabActive}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'gateways' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-[#9ca3af]">
                  Active Gateway Presets
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {gateways.map((gw) => {
                    const isSelected = gw.id === editingGateway.id
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => handleSelectGateway(gw)}
                        className={`flex min-h-[44px] flex-col justify-center rounded-xl border p-2.5 text-left transition-colors ${
                          isSelected
                            ? 'border-[#ff6347] bg-[#ff6347]/10'
                            : 'border-[#23262d] bg-[#1a1c20] hover:border-[#323640]'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#f3f4f6]">
                            {gw.type.toUpperCase()}
                          </span>
                          {gw.active && (
                            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                          )}
                        </div>
                        <span className="mt-0.5 truncate font-mono text-[11px] text-[#9ca3af]">
                          {gw.host}:{gw.port}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-[#23262d] bg-[#1a1c20] p-3.5">
                <span className="text-xs font-semibold text-[#f3f4f6]">
                  Endpoint Configuration
                </span>

                <div className="space-y-1">
                  <label
                    htmlFor="gw-name-input"
                    className="text-[11px] text-[#9ca3af]"
                  >
                    Gateway Name
                  </label>
                  <input
                    id="gw-name-input"
                    type="text"
                    value={editingGateway.name}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, name: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 text-xs text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                    aria-label="Gateway Name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label
                      htmlFor="gw-host-input"
                      className="text-[11px] text-[#9ca3af]"
                    >
                      Host / Tailscale IP
                    </label>
                    <input
                      id="gw-host-input"
                      type="text"
                      value={editingGateway.host}
                      onChange={(e) =>
                        setEditingGateway({ ...editingGateway, host: e.target.value })
                      }
                      className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 font-mono text-xs text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                      aria-label="Host IP or domain"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="gw-port-input"
                      className="text-[11px] text-[#9ca3af]"
                    >
                      Port
                    </label>
                    <input
                      id="gw-port-input"
                      type="number"
                      value={editingGateway.port}
                      onChange={(e) =>
                        setEditingGateway({
                          ...editingGateway,
                          port: parseInt(e.target.value, 10) || 9119,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 font-mono text-xs text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                      aria-label="Port number"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#9ca3af]">
                    Authentication Method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingGateway({ ...editingGateway, authType: 'password' })
                      }
                      className={`flex min-h-[44px] items-center justify-center rounded-lg border text-xs font-medium ${
                        editingGateway.authType === 'password'
                          ? 'border-[#ff6347]/50 bg-[#ff6347]/15 text-[#ff6347]'
                          : 'border-[#23262d] bg-[#090a0b] text-[#9ca3af]'
                      }`}
                      aria-pressed={editingGateway.authType === 'password'}
                    >
                      Password / Basic
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingGateway({ ...editingGateway, authType: 'bearer' })
                      }
                      className={`flex min-h-[44px] items-center justify-center rounded-lg border text-xs font-medium ${
                        editingGateway.authType === 'bearer'
                          ? 'border-[#ff6347]/50 bg-[#ff6347]/15 text-[#ff6347]'
                          : 'border-[#23262d] bg-[#090a0b] text-[#9ca3af]'
                      }`}
                      aria-pressed={editingGateway.authType === 'bearer'}
                    >
                      Bearer Token
                    </button>
                  </div>
                </div>

                {editingGateway.authType === 'password' ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="gw-username-input"
                        className="text-[11px] text-[#9ca3af]"
                      >
                        Username
                      </label>
                      <input
                        id="gw-username-input"
                        type="text"
                        value={editingGateway.username || ''}
                        onChange={(e) =>
                          setEditingGateway({
                            ...editingGateway,
                            username: e.target.value,
                          })
                        }
                        className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 text-xs text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                        aria-label="Username"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="gw-password-input"
                        className="text-[11px] text-[#9ca3af]"
                      >
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="gw-password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={editingGateway.password || ''}
                          onChange={(e) =>
                            setEditingGateway({
                              ...editingGateway,
                              password: e.target.value,
                            })
                          }
                          className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] pr-10 pl-3 text-xs text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                          aria-label="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6]"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label
                      htmlFor="gw-bearer-input"
                      className="text-[11px] text-[#9ca3af]"
                    >
                      Bearer Token
                    </label>
                    <input
                      id="gw-bearer-input"
                      type="password"
                      value={editingGateway.bearerToken || ''}
                      onChange={(e) =>
                        setEditingGateway({
                          ...editingGateway,
                          bearerToken: e.target.value,
                        })
                      }
                      placeholder="eyJh..."
                      className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 font-mono text-xs text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                      aria-label="Bearer Token"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveConnection}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#ff6347] bg-[#ff6347] text-xs font-semibold text-[#090a0b] transition-transform active:scale-95"
                    aria-label="Save and Connect to Gateway"
                  >
                    <Server className="h-4 w-4" />
                    Save & Connect Gateway
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9ca3af]">
                  Hermes Bot Profiles (Mode 1)
                </span>
                <span className="font-mono text-[10px] text-[#ff6347]">SOUL.md</span>
              </div>

              <div className="space-y-2.5">
                {botProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelectProfile(profile.id)}
                    className={`flex min-h-[44px] w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      profile.active
                        ? 'border-[#ff6347] bg-[#ff6347]/10'
                        : 'border-[#23262d] bg-[#1a1c20] hover:border-[#323640]'
                    }`}
                    aria-pressed={profile.active}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#23262d] bg-[#090a0b] text-[#ff6347]">
                      <User className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#f3f4f6]">
                          {profile.name}
                        </span>
                        <span className="rounded bg-[#090a0b] px-2 py-0.5 font-mono text-[10px] text-[#ff6347]">
                          {profile.model}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#9ca3af]">
                        {profile.description}
                      </p>
                      <span className="mt-2 block font-mono text-[10px] text-[#9ca3af]">
                        File: {profile.soulFile}
                      </span>
                    </div>

                    {profile.active && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6347] text-[#090a0b]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090a0b] text-[#10b981]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#f3f4f6]">
                      Credential Vault Status
                    </span>
                    <p className="text-[10px] text-[#9ca3af]">
                      AES-256-GCM Secure Secrets Storage
                    </p>
                  </div>
                </div>

                <span className="rounded bg-[#10b981]/20 px-2 py-0.5 text-[10px] font-semibold text-[#10b981]">
                  ENCRYPTED
                </span>
              </div>

              <form onSubmit={handleInjectOtp} className="space-y-3 rounded-xl border border-[#23262d] bg-[#1a1c20] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#f3f4f6]">
                    2FA / OTP Code Injection
                  </span>
                  <span className="font-mono text-[10px] text-[#ff6347]">vault.code</span>
                </div>

                <p className="text-xs text-[#9ca3af]">
                  When an external server request prompts for 2FA, inject the current 6-digit one-time password below.
                </p>

                <div className="space-y-1">
                  <label
                    htmlFor="otp-code-input"
                    className="text-[11px] text-[#9ca3af]"
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp-code-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    placeholder="123456"
                    className="h-12 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 text-center font-mono text-lg tracking-widest text-[#f3f4f6] focus:border-[#ff6347] focus:outline-none"
                    aria-label="6-Digit OTP Code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpCode.length < 6 || otpStatus === 'submitting'}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#ff6347] bg-[#ff6347] text-xs font-semibold text-[#090a0b] transition-transform active:scale-95 disabled:opacity-50"
                  aria-label="Inject OTP Code to Hermes"
                >
                  {otpStatus === 'submitting' ? (
                    <span>Injecting...</span>
                  ) : otpStatus === 'success' ? (
                    <>
                      <Check className="h-4 w-4" />
                      Injected to vault.code!
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Inject OTP Code
                    </>
                  )}
                </button>
              </form>

              <div className="rounded-xl border border-[#23262d] bg-[#1a1c20] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-[#ff6347]" />
                    <span className="text-xs font-semibold text-[#f3f4f6]">
                      Master Password Prompt
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#9ca3af]">
                    vault.unlock_prompt
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#9ca3af]">
                  Request biometric or master passphrase authorization to access external encrypted keychains.
                </p>

                <button
                  type="button"
                  onClick={handleUnlockMasterVault}
                  className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#23262d] bg-[#090a0b] text-xs font-medium text-[#f3f4f6] transition-colors hover:border-[#323640]"
                  aria-label="Request Master Vault Unlock"
                >
                  <Lock className="h-4 w-4 text-[#10b981]" />
                  {isUnlocked ? 'Vault Unlocked' : 'Trigger Master Unlock Prompt'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GatewayVault
