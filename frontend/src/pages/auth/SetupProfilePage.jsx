import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ErrorMessage from '../../components/ErrorMessage'
import { UserIcon, BuildingIcon } from '../../components/Icon'

const IS_DESKTOP = typeof window !== 'undefined' && window.innerWidth >= 768

export default function SetupProfilePage() {
  const navigate = useNavigate()
  const setUser  = useAuthStore((s) => s.setUser)
  const user     = useAuthStore((s) => s.user)

  const [fullName,    setFullName]    = useState('')
  const [accountType, setAccountType] = useState('customer')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = fullName.trim()
    if (trimmed.length < 2) {
      setError('نام باید حداقل ۲ کاراکتر باشد.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const updatedUser = await updateProfile({ fullName: trimmed })
      setUser(updatedUser)
      if (accountType === 'owner') {
        navigate('/create-business', { replace: true })
      } else {
        navigate('/providers', { replace: true })
      }
    } catch (err) {
      const msg = err?.response?.data?.full_name?.[0] || err?.response?.data?.error
      setError(msg || 'خطا در ذخیره اطلاعات. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تکمیل پروفایل</h1>
          <p className="text-sm text-gray-500 mt-1">
            لطفاً اطلاعات خود را وارد کنید.
          </p>
          {user?.phone && (
            <p className="text-xs text-gray-400 mt-1 font-mono" dir="ltr">{user.phone}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="full-name"
            label={<>نام و نام خانوادگی <span className="text-red-400">*</span></>}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: علی رضایی"
            autoFocus={IS_DESKTOP}
            autoComplete="name"
            disabled={loading}
          />

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">نوع حساب</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  accountType === 'customer'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-cyan-300'
                }`}
              >
                <span className="flex justify-center mb-1 text-current opacity-70">
                  <UserIcon size={24} />
                </span>
                مشتری
                <span className="block text-xs font-normal text-gray-400 mt-0.5">رزرو نوبت</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('owner')}
                className={`border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  accountType === 'owner'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-cyan-300'
                }`}
              >
                <span className="flex justify-center mb-1 text-current opacity-70">
                  <BuildingIcon size={24} />
                </span>
                صاحب کسب‌وکار
                <span className="block text-xs font-normal text-gray-400 mt-0.5">مدیریت نوبت</span>
              </button>
            </div>
          </div>

          <ErrorMessage message={error} />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading || !fullName.trim()}
          >
            ذخیره و ادامه
          </Button>
        </form>
      </div>
    </div>
  )
}
