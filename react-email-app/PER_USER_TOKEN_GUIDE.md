# Per-User Supabase Token - Implementation Guide

## Overview

Each user provides their Supabase Personal Access Token **ONCE**, we store it, then automatically use it for all project operations.

---

## Database Update

Run this SQL:
```sql
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS supabase_access_token TEXT;
```

---

## Updated Flow

### Step 1: Sign In
User logs in with Google OAuth

### Step 2: Check for Existing Tokens
```typescript
// In EmailSetup.tsx - add to state
const [supabaseToken, setSupabaseToken] = useState('')
const [existingToken, setExistingToken] = useState<string | null>(null)

// Check on mount
const { data } = await supabase
  .from('user_email_settings')
  .select('elastic_email_api_key, supabase_access_token')
  .eq('user_id', user.id)
  .maybeSingle()

if (data?.supabase_access_token) {
  setExistingToken(data.supabase_access_token)
}
```

### Step 3: Ask for Token (If Not Exists)
```tsx
{!existingToken && step === 1 && (
  <div>
    <h2>Supabase Personal Access Token</h2>
    <p>Get it from: <a href="https://app.supabase.com/account/tokens">Supabase Tokens</a></p>
    
    <div className="input-group">
      <label>Supabase Token (starts with sbp_)</label>
      <input
        type="password"
        value={supabaseToken}
        onChange={(e) => setSupabaseToken(e.target.value)}
        placeholder="sbp_..."
      />
    </div>
    
    <button onClick={proceedWithToken}>Continue</button>
  </div>
)}
```

### Step 4: Save Token to Database
```typescript
await supabase
  .from('user_email_settings')
  .upsert({
    user_id: user.id,
    supabase_access_token: supabaseToken,
    // ... other fields
  })
```

### Step 5: Use Token in API Calls
```typescript
// Fetch projects
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-projects`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userToken: supabaseToken || existingToken
    })
  }
)

// Update SMTP
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-project-smtp`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectRef: selectedProject.ref,
      smtpConfig: { /* ... */ },
      userToken: supabaseToken || existingToken
    })
  }
)
```

---

## Complete User Experience

1. **First Time:**
   - Sign in with Google ✓
   - Enter Supabase token (sbp_...) → ONE TIME
   - Enter Elastic Email API key
   - Select project from list
   - Auto-configure SMTP
   - Done!

2. **Next Time:**
   - Sign in with Google ✓
   - **Everything automatic** - tokens loaded from DB
   - Select different project (optional)
   - Configure another project
   - Done!

---

## Security

- ✅ Token stored per-user in database
- ✅ RLS policies prevent cross-user access
- ✅ Token encrypted at rest by Supabase
- ✅ Never exposed in client-side logs
- ✅ Used only server-side in Edge Functions

---

## Implementation Steps

### 1. Run Database Migration
```bash
-- In Supabase SQL Editor
ALTER TABLE user_email_settings ADD COLUMN supabase_access_token TEXT;
```

### 2. Update EmailSetup Component
Add token checking and storage logic (see code above)

### 3. Edge Functions Already Updated ✅
- `fetch-projects` now accepts `userToken`
- `update-project-smtp` now accepts `userToken`
- Functions deployed ✅

### 4. Test
- Sign in
- Enter token when prompted
- Verify projects fetch
- Configure SMTP
- Sign out & in → Should NOT ask for token again!

---

**Status:** Edge Functions deployed ✅  
**Next:** Update React component to ask for token once and store it
