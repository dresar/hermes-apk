import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  File,
  Loader2,
} from 'lucide-react'
import type { Attachment } from '../api/types'

export interface ComposerProps {
  onSend: (text: string, attachments?: Attachment[]) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  initialText?: string
  placeholder?: string
  className?: string
}

export const Composer: React.FC<ComposerProps> = ({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  initialText = '',
  placeholder = 'Ketik pesan...',
  className = '',
}) => {
  const [text, setText] = useState(initialText)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (initialText) {
      setText(initialText)
    }
  }, [initialText])

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 120)
    el.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [text, adjustTextareaHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (isStreaming) {
      onStop?.()
      return
    }

    const trimmed = text.trim()
    if (!trimmed && attachments.length === 0) return
    if (disabled) return

    onSend(trimmed, attachments.length > 0 ? attachments : undefined)
    setText('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64Content = result.split(',')[1] || ''
        const newAttachment: Attachment = {
          name: file.name,
          mime: file.type || 'application/octet-stream',
          content_base64: base64Content,
        }
        setAttachments((prev) => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index))
  }

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())
        await transcribeAudio(audioBlob)
      }

      recorder.start()
      setIsRecording(true)
    } catch {
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'audio.webm')
      const res = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        const transcription = data?.text || data?.transcript
        if (typeof transcription === 'string' && transcription.trim()) {
          setText((prev) => (prev ? `${prev} ${transcription.trim()}` : transcription.trim()))
        }
      }
    } catch {
      void 0
    } finally {
      setIsTranscribing(false)
    }
  }

  const canSubmit = (text.trim().length > 0 || attachments.length > 0) && !disabled

  return (
    <div
      className={`w-full border-t border-[#23262d] bg-[#090a0b] p-3 safe-area ${className}`}
    >
      <div className="mx-auto max-w-3xl">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 overflow-x-auto pb-1">
            {attachments.map((att, idx) => (
              <div
                key={`${att.name}-${idx}`}
                className="flex items-center gap-1.5 rounded-md border border-[#23262d] bg-[#121316] px-2.5 py-1 text-xs text-[#f3f4f6]"
              >
                <File className="h-3.5 w-3.5 text-[#ff6347]" />
                <span className="max-w-[140px] truncate text-[11px] font-mono">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:text-[#f3f4f6]"
                  aria-label={`Hapus lampiran ${att.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-lg border border-[#23262d] bg-[#121316] p-1.5 focus-within:border-[#ff6347]/50 focus-within:ring-1 focus-within:ring-[#ff6347]/50 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#1a1c20] hover:text-[#f3f4f6] transition-colors"
            aria-label="Lampirkan berkas"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors ${
              isRecording
                ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                : 'text-[#9ca3af] hover:bg-[#1a1c20] hover:text-[#f3f4f6]'
            }`}
            aria-label={isRecording ? 'Hentikan rekaman suara' : 'Mulai rekaman suara'}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#ff6347]" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4 text-rose-400" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={isRecording ? 'Mendengarkan...' : placeholder}
            className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent py-2 px-1 text-sm text-[#f3f4f6] placeholder-[#9ca3af] focus:outline-none leading-relaxed"
            aria-label="Input pesan prompt"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[#ff6347] text-[#090a0b] hover:bg-[#ff7b63] active:scale-95 transition-all shadow-md"
              aria-label="Hentikan respons streaming"
            >
              <Square className="h-4 w-4 fill-current stroke-none" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-all ${
                canSubmit
                  ? 'bg-[#ff6347] text-[#090a0b] hover:bg-[#ff7b63] active:scale-95 shadow-md cursor-pointer'
                  : 'bg-[#1a1c20] text-[#9ca3af]/40 cursor-not-allowed border border-[#23262d]'
              }`}
              aria-label="Kirim pesan"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Composer
