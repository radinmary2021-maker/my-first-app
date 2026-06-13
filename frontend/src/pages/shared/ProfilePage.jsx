import { useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Spinner from '../../components/Spinner'
import { notify } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import { updateMe } from '../../api/auth'

export default function ProfilePage() {
  const user    = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [saving,   setSaving]   = useState(false)

  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20"><Spinner /></div>
      </MainLayout>
    )
  }

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
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          پروفایل من
        </h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>شماره موبایل</p>
            <p className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{user.phone}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>نقش</p>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {user.role === 'customer'  && 'مشتری'}
              {user.role === 'owner'     && 'صاحب کسب‌وکار'}
              {user.role === 'provider'  && 'ارائه‌دهنده خدمت'}
              {user.role === 'secretary' && 'منشی'}
              {user.role === 'admin'     && 'ادمین'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>ویرایش نام</h2>
          <Input
            label="نام و نام خانوادگی"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="نام خود را وارد کنید"
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={saving}
            disabled={saving || fullName.trim() === (user.full_name ?? '')}
          >
            ذخیره تغییرات
          </Button>
        </form>
      </div>
    </MainLayout>
  )
}
