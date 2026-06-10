import { useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import { notify } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import { updateMe } from '../../api/auth'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim() || fullName.trim().length < 2) {
      notify('نام باید حداقل ۲ کاراکتر باشد.', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await updateMe({ full_name: fullName.trim() })
      setUser(res.data)
      notify('پروفایل به‌روزرسانی شد.', 'success')
    } catch (err) {
      notify(err?.response?.data?.full_name?.[0] || 'خطا در ذخیره اطلاعات.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-sm space-y-6">
        <h1 className="text-xl font-bold text-gray-800">پروفایل من</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">شماره موبایل</p>
            <p className="font-mono text-gray-700">{user?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">نقش</p>
            <p className="text-gray-700">
              {user?.role === 'customer'  && 'مشتری'}
              {user?.role === 'owner'     && 'صاحب کسب‌وکار'}
              {user?.role === 'provider'  && 'ارائه‌دهنده خدمت'}
              {user?.role === 'secretary' && 'منشی'}
              {user?.role === 'admin'     && 'ادمین'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">ویرایش نام</h2>
          <div>
            <label className="text-xs text-gray-500 block mb-1">نام و نام خانوادگی</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="نام خود را وارد کنید"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
          </div>
          <button
            type="submit"
            disabled={saving || fullName.trim() === (user?.full_name ?? '')}
            className="w-full bg-cyan-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </form>
      </div>
    </MainLayout>
  )
}
