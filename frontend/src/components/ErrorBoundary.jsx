import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
            <p className="text-4xl">⚠️</p>
            <h1 className="text-lg font-bold text-gray-800">خطای غیرمنتظره</h1>
            <p className="text-sm text-gray-500">مشکلی پیش آمد. صفحه را بازخوانی کنید.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              بازخوانی صفحه
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
