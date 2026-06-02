import client from './client'

export function sendOtp(phone) {
  return client.post('/api/auth/send-otp/', { phone })
}

export function verifyOtp(phone, otp) {
  return client.post('/api/auth/verify-otp/', { phone, otp })
}

export function getCurrentUser() {
  return client.get('/api/auth/me/')
}
