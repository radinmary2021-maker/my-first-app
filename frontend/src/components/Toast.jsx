import { useState, useEffect, useCallback } from 'react'

const VARIANTS = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
}

// Mutable ref shared with notify() in toast.js — set when ToastContainer mounts
export let _setNotify = null

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const add = useCallback(({ message, variant, duration }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  useEffect(() => {
    _setNotify = add
    return () => { _setNotify = null }
  }, [add])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center" dir="rtl">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-5 py-3 rounded-xl shadow-lg text-sm font-medium min-w-48 text-center ${VARIANTS[t.variant] ?? VARIANTS.info}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
