import React, { useState } from 'react'
import { HelpCircle, Check, X, Send } from 'lucide-react'
import type { ClarifyRequest } from '../api/types'

export interface ClarifyModalProps {
  request: ClarifyRequest | null
  onRespond: (answers: Record<string, string | string[]>) => void
  onClose?: () => void
}

export const ClarifyModal: React.FC<ClarifyModalProps> = ({
  request,
  onRespond,
  onClose,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({})
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})

  if (!request || !request.questions || request.questions.length === 0) {
    return null
  }

  const handleToggleSingle = (qid: string, choice: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qid]: choice,
    }))
  }

  const handleToggleMulti = (qid: string, choice: string) => {
    setSelectedAnswers((prev) => {
      const current = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : []
      const exists = current.includes(choice)
      const updated = exists ? current.filter((c) => c !== choice) : [...current, choice]
      return {
        ...prev,
        [qid]: updated,
      }
    })
  }

  const handleCustomChange = (qid: string, val: string) => {
    setCustomInputs((prev) => ({
      ...prev,
      [qid]: val,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalAnswers: Record<string, string | string[]> = { ...selectedAnswers }

    request.questions.forEach((q) => {
      const custom = customInputs[q.qid]?.trim()
      if (custom) {
        if (q.multi_select) {
          const arr = Array.isArray(finalAnswers[q.qid])
            ? (finalAnswers[q.qid] as string[])
            : []
          finalAnswers[q.qid] = [...arr, custom]
        } else {
          finalAnswers[q.qid] = custom
        }
      }
    })

    onRespond(finalAnswers)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clarify-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[#23262d] bg-[#121316] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#23262d] px-5 py-4 bg-[#1a1c20]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#323640] bg-[#121316] text-[#ff6347]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 id="clarify-modal-title" className="text-sm font-semibold text-[#f3f4f6]">
                Clarification Needed
              </h3>
              <p className="text-[11px] text-[#9ca3af]">
                The agent needs more details to proceed with your request.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6]"
              aria-label="Close clarification dialog"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {request.questions.map((q, qIndex) => {
            const isMulti = Boolean(q.multi_select)
            const currentSelection = selectedAnswers[q.qid]
            const currentCustom = customInputs[q.qid] || ''

            return (
              <div key={q.qid || qIndex} className="space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-[#f3f4f6]">
                    {qIndex + 1}. {q.question}
                  </span>
                  <span className="text-[10px] text-[#9ca3af]">
                    {isMulti ? 'Multi-select' : 'Single-select'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {q.choices.map((choice) => {
                    const isSelected = isMulti
                      ? Array.isArray(currentSelection) && currentSelection.includes(choice)
                      : currentSelection === choice

                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() =>
                          isMulti
                            ? handleToggleMulti(q.qid, choice)
                            : handleToggleSingle(q.qid, choice)
                        }
                        className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#ff6347] bg-[#ff6347]/15 text-[#ff6347]'
                            : 'border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:border-[#323640] hover:text-[#f3f4f6]'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        <span>{choice}</span>
                      </button>
                    )
                  })}
                </div>

                <input
                  type="text"
                  value={currentCustom}
                  onChange={(e) => handleCustomChange(q.qid, e.target.value)}
                  placeholder="Or write custom response..."
                  className="h-10 w-full rounded-lg border border-[#23262d] bg-[#090a0b] px-3 text-xs text-[#f3f4f6] placeholder-[#9ca3af] focus:border-[#ff6347] focus:outline-none"
                  aria-label={`Custom answer for question ${qIndex + 1}`}
                />
              </div>
            )
          })}

          <div className="pt-3 border-t border-[#23262d] flex justify-end gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] px-4 text-xs font-medium text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label="Skip clarification"
              >
                Skip
              </button>
            )}
            <button
              type="submit"
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#ff6347] px-4 text-xs font-medium text-[#090a0b] hover:bg-[#ff7b63] active:scale-95 transition-all shadow-md cursor-pointer"
              aria-label="Submit clarification answers"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Answer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClarifyModal
