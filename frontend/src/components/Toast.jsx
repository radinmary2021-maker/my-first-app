import { useState, useEffect, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertCircleIcon } from './Icon'

const VARIANTS = {
  success: {
    bg:   'bg-green-600',
    Icon: CheckCircleIcon,
  },
  error: {
    bg:   'bg-red-600',
    Icon: XCircleIcon,
  },
  warning: {
    bg:   'bg-amber-500',
    Icon: AlertCircleIcon,
  },
  info: {
    bg:   'bg-cyan-500',
    Icon: InfoIcon,
  },
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
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none"
      dir="rtl"
    >
      {toasts.map((t) => {
        const config = VARIANTS[t.variant] ?? VARIANTS.info
        const { Icon } = config
        return (
          <div
            key={t.id}
            className={`
              ${config.bg} text-white
              flex items-center gap-2.5
              px-4 py-3 rounded-xl shadow-lg
              text-sm font-medium min-w-56 max-w-xs
              pointer-events-auto
            `}
            style={{ animation: 'toastIn 200ms ease' }}
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
