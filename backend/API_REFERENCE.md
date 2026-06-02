# Backend API Reference — React Integration

Base URL (dev): `http://localhost:8000`  
All dates: **Gregorian `YYYY-MM-DD`**  
Auth header: `Authorization: Bearer <access_token>`

---

## Authentication

### POST /api/auth/send-otp/
Sends OTP to phone. No auth required.

**Request**
```json
{ "phone": "09120000001" }
```

**Response 200**
```json
{ "success": true }
```
In `DEBUG=True` mode, `"dev_code": "123456"` is also returned.

**Response 429** — rate limited

---

### POST /api/auth/verify-otp/
Verifies OTP and returns JWT tokens. No auth required.

**Request**
```json
{ "phone": "09120000001", "otp": "123456" }
```

**Response 200**
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": { "id": 1, "phone": "09120000001", "full_name": "...", "role": "patient" }
}
```

**Response 400** — wrong or expired code

---

### POST /api/auth/refresh/
Refreshes access token. No auth required.

**Request**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200**
```json
{ "access": "<new_jwt>" }
```

---

## Doctors

### GET /api/doctors/
Public. Lists all active doctors.

**Response 200**
```json
[
  {
    "id": 1,
    "full_name": "دکتر علی رضایی",
    "specialty": "عمومی",
    "bio": "...",
    "visit_duration": 20,
    "consultation_fee": "300000",
    "is_active": true,
    "available_weekdays": [0, 1, 2, 4]
  }
]
```
`available_weekdays`: integers 0–6 where **0=Saturday, 6=Friday** (Iranian week).  
`consultation_fee`: string representation of integer Rials (e.g. `"300000"` = 300,000 Rials = 30,000 Toman).

---

### GET /api/doctors/{id}/
Public. Returns single doctor detail. Same schema as list item.

**Response 404** `{ "error": "پزشک یافت نشد." }`

---

### GET /api/doctors/{id}/slots/?date=YYYY-MM-DD
Public. Returns available time slots for a doctor on a given date.

**Query params**
- `date` (required): Gregorian date, e.g. `2026-06-06`

**Response 200**
```json
{
  "date": "2026-06-06",
  "slots": ["09:00", "09:20", "09:40"]
}
```
`slots` is empty `[]` when the doctor has no schedule or all slots are booked.

**Response 400** — missing or invalid date format  
**Response 404** — doctor not found

---

## Appointments

### POST /api/appointments/
Requires auth. Books a new appointment.

**Request**
```json
{
  "doctor_id": 1,
  "date": "2026-06-06",
  "start_time": "09:00"
}
```

**Response 201**
```json
{
  "id": 42,
  "tracking_code": "APT-X4K9WZ",
  "doctor_name": "دکتر علی رضایی",
  "doctor_specialty": "عمومی",
  "date": "2026-06-06",
  "start_time": "09:00:00",
  "end_time": "09:20:00",
  "status": "pending_payment",
  "notes": "",
  "created_at": "2026-06-02T10:30:00+03:30",
  "updated_at": "2026-06-02T10:30:00+03:30"
}
```

**Response 400** — slot unavailable, double booking, past date, invalid doctor

---

### GET /api/appointments/mine/
Requires auth. Lists all appointments for the authenticated patient.

**Response 200** — array of appointment objects (same schema as above), ordered by `-date, -start_time`

---

## Payments

### POST /api/payments/{appointment_id}/initiate/
Requires auth. Patient must own the appointment. Initiates Zarinpal payment.

**Response 200**
```json
{
  "gate_url": "https://www.zarinpal.com/pg/StartPay/A00000...",
  "tracking_code": "APT-X4K9WZ"
}
```
Frontend must redirect the browser: `window.location.href = gate_url`

**Response 400** — appointment expired or already paid  
**Response 404** — appointment not found or not owned by user

---

### GET /api/payments/callback/ ← Zarinpal calls this
Public. Called by Zarinpal after payment. **Not called by frontend directly.**

This endpoint verifies the payment with Zarinpal and redirects the browser:

**Success → 302** to:
```
{FRONTEND_BASE_URL}/payment/result?status=success&tracking_code=APT-X4K9WZ&ref_id=123456789
```

**Failure → 302** to:
```
{FRONTEND_BASE_URL}/payment/result?status=failed
```

`ZARINPAL_CALLBACK_BASE_URL` in backend `.env` must point to the **backend** host so Zarinpal can reach it.  
`FRONTEND_BASE_URL` in backend `.env` must point to the **frontend** host for the redirect destination.

---

## Error Format

All API errors return:
```json
{ "error": "پیام خطا" }
```
Validation errors from DRF return field-keyed objects:
```json
{ "phone": ["این فیلد الزامی است."] }
```
