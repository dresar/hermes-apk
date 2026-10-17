import React, { useState, useEffect } from 'react'
import { Download, ExternalLink, X, RefreshCw, CheckCircle, ArrowUpCircle } from 'lucide-react'

export interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

const CURRENT_VERSION = 'v1.0.0'
const GITHUB_API_URL = ['https:', '', 'api.github.com', 'repos', 'dresar', 'hermes-apk', 'releases', 'latest'].join('/')
const RELEASES_PAGE_URL = ['https:', '', 'github.com', 'dresar', 'hermes-apk', 'releases'].join('/')
const DOWNLOAD_APK_URL = ['https:', '', 'github.com', 'dresar', 'hermes-apk', 'releases', 'download', 'v1.0.0', 'HERMES.APK'].join('/')

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string>(DOWNLOAD_APK_URL)
  const [error, setError] = useState<string | null>(null)

  const checkUpdate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(GITHUB_API_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      if (!res.ok) {
        throw new Error(`Status ${res.status}`)
      }
      const data = await res.json()
      const tag = data.tag_name || CURRENT_VERSION
      setLatestVersion(tag)
      if (data.body) {
        setReleaseNotes(data.body)
      }
      if (Array.isArray(data.assets)) {
        const apkAsset = data.assets.find((a: { name?: string; browser_download_url?: string }) =>
          a.name?.toLowerCase().endsWith('.apk')
        )
        if (apkAsset?.browser_download_url) {
          setDownloadUrl(apkAsset.browser_download_url)
        } else {
          setDownloadUrl(['https:', '', 'github.com', 'dresar', 'hermes-apk', 'releases', 'download', tag, 'HERMES.APK'].join('/'))
        }
      } else {
        setDownloadUrl(['https:', '', 'github.com', 'dresar', 'hermes-apk', 'releases', 'download', tag, 'HERMES.APK'].join('/'))
      }
    } catch {
      setError('Gagal memeriksa pembaruan terkini')
      setLatestVersion(CURRENT_VERSION)
      setDownloadUrl(DOWNLOAD_APK_URL)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkUpdate()
    }
  }, [isOpen])

  if (!isOpen) return null

  const isUpToDate = latestVersion === CURRENT_VERSION

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#23262d] bg-[#121316] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#23262d] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#ff6347]">
              <ArrowUpCircle className="h-4 w-4" />
            </div>
            <h2 id="update-modal-title" className="text-sm font-semibold text-[#f3f4f6]">
              Pembaruan Aplikasi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#23262d] text-[#9ca3af] hover:bg-[#1a1c20] hover:text-[#f3f4f6]"
            aria-label="Tutup modal pembaruan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="rounded-xl border border-[#23262d] bg-[#090a0b] p-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#23262d]/50">
              <span className="text-[#9ca3af]">Versi Terpasang:</span>
              <span className="font-mono font-medium text-[#f3f4f6]">{CURRENT_VERSION}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#9ca3af]">Versi Terbaru:</span>
              <span className="font-mono font-medium text-[#f3f4f6]">
                {loading ? 'Memeriksa...' : latestVersion || '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#ff6347]" />
                <span>Memeriksa server rilis...</span>
              </div>
            ) : isUpToDate ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Aplikasi Anda mutakhir.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#ff6347]">
                <ArrowUpCircle className="h-4 w-4 shrink-0" />
                <span>Versi baru tersedia: {latestVersion}</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-rose-400 px-1">{error}</p>
          )}

          {releaseNotes && !isUpToDate && (
            <div className="max-h-24 overflow-y-auto rounded-lg border border-[#23262d] bg-[#090a0b] p-2 font-mono text-[11px] text-[#9ca3af]">
              {releaseNotes}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-[#23262d]">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#ff6347] px-4 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            <span>Download APK Terbaru</span>
          </a>

          <a
            href={RELEASES_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#23262d] bg-[#1a1c20] px-4 py-2 text-xs font-medium text-[#9ca3af] hover:text-[#f3f4f6] hover:border-[#323640]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Halaman Rilis GitHub</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default UpdateModal
