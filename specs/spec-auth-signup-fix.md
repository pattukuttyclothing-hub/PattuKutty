# Manipulation Specification: Accurate Supabase Auth Error Reporting & User Creation Test

---

### Section 1: Overview & Problem Statement
Live testing against Supabase Cloud confirmed that user creation (`signUp`) functions cleanly and creates new user rows in `auth.users` (`ccaf6b3e-82b6-40e2-b8c9-6cc7211d6de0`).

The false "already account exists" error occurred because previous custom error interception replaced Supabase errors (such as rate limits `over_email_send_rate_limit` or domain validation `email_address_invalid`) with a generic duplicate account string.

This spec details instructions to restore direct, un-corrupted Supabase error reporting in `src/lib/auth.tsx` and conduct verified new user creation tests.

---

### Section 2: Explicit Scope & Target Protection (Rules 1–5)

- **Target Files Authorized for Modification**:
  - `/home/ben10_balaji/Pattu_Kutty/PattuKutty/src/lib/auth.tsx`
  - `/home/ben10_balaji/Pattu_Kutty/PattuKutty/src/routes/auth.tsx`

- **OFF-LIMITS Scope (Protected Files)**:
  - `/home/ben10_balaji/Pattu_Kutty/PattuKutty/src/integrations/supabase/client.ts`
  - `/home/ben10_balaji/Pattu_Kutty/PattuKutty/frontend/butterflies_admin/*`
  - `/home/ben10_balaji/Pattu_Kutty/PattuKutty/src/components/boutique/*`

---

### Section 3: Verified Bug List & Fix Instructions

### Bug 1: False "Account Already Exists" Error Message
- **Symptoms**: Creating a brand new user returned `"An account with this email may already exist"` even when no such user existed in the database.
- **Root Cause**: Custom error logic wrapped `error.message` and overrode specific error codes (like `over_email_send_rate_limit` or `email_address_invalid`) with hardcoded duplicate messaging.
- **Fix**: Remove error overriding in `src/lib/auth.tsx`. Return `error.message` directly from Supabase Auth so the user receives exact feedback.

### Feature 2: Password Visibility Toggle & Clean Toast Alerts
- **Details**: Keep the Eye/EyeOff toggle in `src/routes/auth.tsx` and ensure success/error toasts display exact responses.

---

### Section 4: Contract Field Mapping Matrix

| Frontend Field | API Payload Key | Backend Service Field | DB Table | DB Column | Required Guard |
|---------------|-----------------|----------------------|----------|-----------|----------------|
| `email`       | `email`         | `auth.users.email`   | `auth.users` | `email` | Real domain email format |
| `password`    | `password`      | `auth.users.password`| `auth.users` | `encrypted_password` | `string` min 6 |
| `fullName`    | `options.data.full_name` | `customers.full_name` | `public.customers` | `full_name` | `string` trim |
| `phone`       | `options.data.phone` | `customers.phone` | `public.customers` | `phone` | `string` trim |

---

### Section 5: Strict Production Testing & Zero-Mocking Requirements

- [ ] **Assertion 1**: Live Supabase API Signup — `signUp` with unique real domain email returns `user.id` and `error: null`.
- [ ] **Assertion 2**: TypeScript compilation `npx tsc --noEmit` passes with 0 errors.
- [ ] **Assertion 3**: Error Accuracy — Invalid email formats or rate limits display exact error strings from Supabase.

---

### Section 6: Production Build Verification Criteria

- Customer App Build: `npm run build` in `/home/ben10_balaji/Pattu_Kutty/PattuKutty` — MUST pass 0 errors.
- TypeScript Verification: `npx tsc --noEmit` in `/home/ben10_balaji/Pattu_Kutty/PattuKutty` — MUST pass 0 errors.

---

### Section 7: Mandatory Verification Reporting (Rules 6 & 12)

Output exact file paths modified, line ranges, and clean `npx tsc --noEmit` compilation results.
