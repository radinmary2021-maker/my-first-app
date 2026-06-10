import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Sentry فقط در صورت نصب بودن package فعال می‌شود
// برای فعال‌سازی: npm install @sentry/react و VITE_SENTRY_DSN را در .env تنظیم کنید
// (به docs/SENTRY_SETUP.md مراجعه کنید)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
