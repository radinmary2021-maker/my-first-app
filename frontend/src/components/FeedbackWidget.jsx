/**
 * FeedbackWidget — lightweight in-product feedback for beta users.
 *
 * Shows a floating button (bottom-left). On click, opens a compact panel where
 * the user can rate their experience, select a category, and optionally add a note.
 *
 * Submission: POST /api/v1/feedback/ — fails gracefully if the endpoint is not
 * yet available (stores to localStorage as a fallback for local review).
 */

import { useState, useRef, useEffect } from 'react'
import client from '../api/client'

const CATEGORIES = [
  { value: 'bug',        label: 'مشکل فنی' },
  { value: 'suggestion', label: 'پیشنهاد بهبود' },
  { value: 'question',   label: 'سوال' },
  { value: 'other',      label: 'سایر' },
]

const RATINGS = [
  { value: 1, emoji: '😞', label: 'ضعیف' },
  { value: 2, emoji: '😐', label: 'متوسط' },
  { value: 3, emoji: '😊', label: 'عالی' },
]

async function submitFeedback(payload) {
  try {
    await client.post('/api/v1/feedback/', payload)
  } catch {
    // Fallback: persist locally so no feedback is lost during beta
    try {
      const stored = JSON.parse(localStorage.getItem('_nbt_feedback') || '[]')
      stored.push({ ...payload, _ts: Date.now() })
      localStorage.setItem('_nbt_feedback', JSON.stringify(stored))
    } catch {
      // Silent — storage quota or parse error
    }
  }
}

export default function FeedbackWidget() {
  const [open,     setOpen]     = useState(false)
  const [rating,   setRating]   = useState(null)
  const [category, setCategory] = useState('bug')
  const [note,     setNote]     = useState('')
  const [status,   setStatus]   = useState('idle') // idle | submitting | done
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  function reset() {
    setRating(null)
    setCategory('bug')
    setNote('')
    setStatus('idle')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) return
    setStatus('submitting')
    await submitFeedback({ rating, category, note: note.trim() })
    setStatus('done')
    setTimeout(() => { setOpen(false); reset() }, 2200)
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-end gap-2" dir="rtl">

      {/* Feedback panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="ارسال بازخورد"
          className="bg-white rounded-2xl shadow-xl border border-gray-100 w-72 p-5 space-y-4
                     animate-[slideUp_.18s_ease-out]"
          style={{ transformOrigin: 'bottom left' }}
        >
          {status === 'done' ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-2xl">🙏</p>
              <p className="text-sm font-semibold text-gray-800">ممنون از بازخورد شما!</p>
              <p className="text-xs text-gray-400">این اطلاعات به بهبود Nobatic کمک می‌کند.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">بازخورد شما</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="بستن"
                >
                  ×
                </button>
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">تجربه شما چطور بود؟</p>
                <div className="flex gap-2">
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(r.value)}
                      aria-pressed={rating === r.value}
                      className={`flex-1 text-center py-2 rounded-xl border text-xl transition-all ${
                        rating === r.value
                          ? 'border-cyan-400 bg-cyan-50 scale-105 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">نوع بازخورد</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      aria-pressed={category === c.value}
                      className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${
                        category === c.value
                          ? 'border-cyan-400 bg-cyan-50 text-cyan-700 font-medium'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">توضیحات (اختیاری)</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="بنویسید چه اتفاقی افتاد یا چه پیشنهادی دارید..."
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none
                             focus:outline-none focus:ring-2 focus:ring-cyan-200 placeholder-gray-300"
                />
              </div>

              <button
                type="submit"
                disabled={!rating || status === 'submitting'}
                className="w-full bg-cyan-500 text-white text-sm py-2.5 rounded-xl
                           hover:bg-cyan-600 disabled:opacity-50 transition-colors font-medium"
              >
                {status === 'submitting' ? 'در حال ارسال...' : 'ارسال بازخورد'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen((v) => !v); if (open) reset() }}
        aria-label={open ? 'بستن پنل بازخورد' : 'ارسال بازخورد'}
        aria-expanded={open}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white
                    transition-all hover:scale-110 active:scale-95
                    ${open ? 'bg-gray-600' : 'bg-cyan-500 hover:bg-cyan-600'}`}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

    </div>
  )
}
