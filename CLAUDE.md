# CLAUDE.md — Project Memory

## Project Overview
- Name: Nobatic (نوبتیک)
- Type: Online appointment booking platform
- Users: Business owners + Customers

## Tech Stack
- Backend: Django REST Framework
- Frontend: React + Vite
- Database: PostgreSQL
- Hosting: Render (backend) + [frontend host]
- Auth: OTP-based (phone number) → returns JWT tokens

## Project Structure
- Backend API base: /api/
- Frontend dev proxy: /api → localhost:8000

## Git Rules (ALWAYS follow these)
- NEVER commit directly to main
- Every fix = new branch → commit → push → open PR
- Branch naming: fix/<description> or feat/<description>
- Always create a PR, even for small changes

## API Endpoints (documented so far)
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/otp/send/ | POST | Send OTP to phone |
| /api/auth/otp/verify/ | POST | Verify OTP → returns JWT |
| /api/businesses/ | POST | Create business (upgrades role to owner) |
| /api/services/ | POST | Add service to business |
| /api/working-hours/ | POST | Bulk save working hours |
| /api/time-offs/ | POST | Create vacation/day-off |
| /api/providers/ | GET | Customer searches providers |
| /api/providers/<id>/slots/ | GET | Get available slots (requires ?service_id=) |
| /api/appointments/ | POST | Book appointment |
| /api/appointments/mine/ | GET | Customer's booking history |
| /api/v1/appointments/business/ | GET | Owner views all appointments |

## Known Issues & Fixes History
| # | Issue | Status | Commit |
|---|-------|--------|--------|
| 1 | Bulk working hours crash (frontend + backend) | ✅ Fixed | b83318b |
| 2 | DEBUG=True in production | ✅ Fixed | 3e4b227 |
| 3 | /slots/ ignores service_id | ✅ Fixed | 3e4b227 + b0f3a70 |
| 4 | OTP 429 no retry info | ✅ Fixed | 3e4b227 |
| 5 | Provider list search error (Persian آ vs ا normalization) | ✅ Fixed | ebc7ff9 |

## Production Config (Render Dashboard)
These env vars must be set manually in Render dashboard for nobatic-api:
- DEBUG=False ✅ Done
- DEBUG_OTP=False ✅ Done

## Business Rules
- Booking requires: provider_id, service_id, date, start_time
- /slots/ endpoint requires ?service_id= (returns 400 otherwise)
- OTP rate limit: ~3 requests per minute per phone
- Double-booking same slot → correctly rejected with Persian error
- Cancelling appointment → slot freed immediately

## Test Accounts
- Owner: owner@test.com / Password123!
- Customer: customer@test.com / Customer123!

## Persian Text Notes
- PostgreSQL ILIKE compares bytes exactly — visually identical Persian chars can differ at the byte level
- Users may type Alef with Madda (U+0622 — آ) but stored data may use plain Alef (U+0627 — ا)
- Fix: `_normalize_persian()` in `backend/apps/providers/views.py` normalizes query before DB filter
- Characters normalized: آ/أ/إ → ا, ي → ی, ك → ک, ة → ه
- TODO: also normalize on write (model `save()`) so stored data is consistent for future records

## Current Open Tasks
- [ ] Investigate and fix the 502 error on /api/providers/ in dev (Vite proxy → localhost:8000 not running; needs local Django setup or .env pointing to Render)
