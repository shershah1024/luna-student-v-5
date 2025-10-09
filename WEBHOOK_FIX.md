# Organization Membership Webhook Fix

## Problem
Teachers invited via Clerk organizations were not getting their `is_teacher` or `is_institute_admin` metadata flags set, causing middleware and navbar to treat them as guests.

## Root Cause
The Clerk webhook was configured to handle organization membership events (`organizationMembership.created` and `organizationMembership.updated`), but these events were likely **not enabled** in the Clerk Dashboard webhook configuration.

## Solution

### 1. Fix Webhook Configuration in Clerk Dashboard

**Action Required:** Enable organization membership events in your Clerk webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Configure → Webhooks**
2. Find your webhook endpoint: `/api/webhooks/clerk`
3. Click **Edit**
4. Ensure these events are checked:
   - ✅ `user.created`
   - ✅ `organizationMembership.created` ⚠️ **CRITICAL**
   - ✅ `organizationMembership.updated` ⚠️ **CRITICAL**
   - ☑️ `user.updated` (optional)

### 2. Enhanced Webhook Handler

Updated the webhook handler with:
- Comprehensive logging for debugging
- Better error handling
- Support for nested `public_user_data` structure
- Clear error messages

**File:** `app/(communication)/api/webhooks/clerk/route.ts`

Key improvements:
```typescript
// Now handles both direct and nested userId
const userId = membership.user_id || membership.public_user_data?.user_id

// Detailed logging at each step
console.log('[WEBHOOK] Organization membership event received:', { eventType, data })
console.log('[WEBHOOK] Setting is_teacher = true for user:', userId)
console.log('[WEBHOOK] Successfully updated user metadata for:', userId)

// Better error responses
if (!userId) {
  return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
}
```

### 3. Repair Script for Existing Users

Created an admin API endpoint to fix metadata for users already in organizations:

**Endpoint:** `POST /api/admin/repair-org-metadata`

**Access:** Platform admin only

**What it does:**
1. Fetches all organization memberships from Clerk
2. Identifies users with `org:teacher` or `org:institute_admin` roles
3. Checks if they're missing corresponding metadata flags
4. Updates their metadata if needed
5. Returns detailed report of changes

**Usage:**
```bash
# Using curl
curl -X POST https://your-domain.com/api/admin/repair-org-metadata \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Or create a simple admin page with a button to trigger this
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 15 members, updated 8",
  "totalMembers": 15,
  "updatedMembers": 8,
  "errors": [],
  "details": [
    {
      "userId": "user_xxx",
      "email": "teacher@example.com",
      "orgName": "My Institute",
      "orgRole": "org:teacher",
      "oldMetadata": { "role": "guest" },
      "newMetadata": { "role": "teacher", "is_teacher": true }
    }
  ]
}
```

## Testing

### Test New Invites
1. Ensure webhook events are enabled
2. Invite a new user to your organization with `org:teacher` role
3. Have them accept and sign up
4. Check logs for `[WEBHOOK]` messages
5. Verify their metadata includes `is_teacher: true`

### Test Repair Script
1. Run the repair endpoint: `POST /api/admin/repair-org-metadata`
2. Review the response to see which users were updated
3. Have affected users sign out and sign back in
4. Verify they can now access teacher routes

## Monitoring

### Check Webhook Logs
```bash
# In Clerk Dashboard
Configure → Webhooks → [Your webhook] → Recent Events

# Look for:
- organizationMembership.created events
- Success/failure status codes
- Any error messages
```

### Check Application Logs
After the fix, you should see logs like:
```
[WEBHOOK] Organization membership event received: { eventType: 'organizationMembership.created', ... }
[WEBHOOK] Extracted membership details: { userId: 'user_xxx', role: 'org:teacher', ... }
[WEBHOOK] Setting is_teacher = true for user: user_xxx
[WEBHOOK] Successfully updated user metadata for: user_xxx
```

## Files Changed

1. **app/(communication)/api/webhooks/clerk/route.ts**
   - Enhanced logging
   - Better error handling
   - Support for nested user data structure

2. **app/api/admin/repair-org-metadata/route.ts** (NEW)
   - Repair script for existing users

3. **CLERK_SETUP.md**
   - Updated webhook configuration instructions
   - Added critical warning about organization events

4. **WEBHOOK_FIX.md** (this file)
   - Documentation of the issue and fix

## Next Steps

1. ✅ Enable webhook events in Clerk Dashboard
2. ✅ Run repair script for existing affected users
3. ✅ Test with a new organization invite
4. ✅ Monitor webhook logs to confirm events are being received
5. ✅ Consider adding a UI button for admins to run the repair script

## Rollback

If issues occur:
- The webhook handler is backward compatible
- Original functionality is preserved
- Additional logging can be removed if needed

## Support

If the webhook is still not working:
1. Check webhook secret in `.env.local`
2. Verify webhook URL is correct and publicly accessible
3. Check Clerk webhook logs for delivery failures
4. Review Supabase logs: `mcp__supabase__get_logs(service: "api")`
5. Check browser console for middleware issues
