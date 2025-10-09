# Immediate Fix Steps for Organization Membership Issue

## The Problem
You're seeing `role: 'guest'` in the navbar debug even though you're a teacher in a Clerk organization. This happens because the webhook events weren't enabled to set the metadata flags.

## Immediate Solutions (Choose One)

### Option 1: Run the Repair Script (Fastest)
1. Navigate to: http://localhost:3003/admin/repair-metadata
2. Click "Run Metadata Repair"
3. Wait for completion
4. **Sign out and sign back in** (critical!)
5. You should now see your proper role

### Option 2: Manual Fix via Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users**
3. Find your user account
4. Click **Edit** → **Public metadata**
5. Add this (adjust as needed):
```json
{
  "is_teacher": true,
  "role": "teacher"
}
```
6. **Sign out and sign back in**

### Option 3: Check Webhook Configuration (Permanent Fix)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Configure → Webhooks**
2. Find your webhook endpoint
3. Ensure these events are checked:
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.updated`
4. Save changes
5. Invite a new test user to verify it works

## What to Look For in Logs

After restarting your dev server, you should see:

### In Browser Console (useUserRole debug):
```javascript
{
  userId: "user_xxx",
  metadata: {
    is_teacher: true,  // ← Should be true!
    role: "teacher"     // ← Should be "teacher"!
  },
  orgRole: "org:teacher",
  membershipRoles: ["org:teacher"],
  hasTeacherMembership: true
}
```

### In Server Logs (middleware):
```
Teacher route check: {
  path: '/teachers/students',
  orgRole: 'org:teacher',
  isTeacher: true,           // ← Should be true!
  hasTeacherOrgRole: true,
  metadata: { is_teacher: true, role: 'teacher' }
}
```

### In Webhook Logs (if receiving events):
```
[WEBHOOK] Organization membership event received: { eventType: 'organizationMembership.created', ... }
[WEBHOOK] Setting is_teacher = true for user: user_xxx
[WEBHOOK] Successfully updated user metadata for: user_xxx
```

## Debug Checklist

If still showing as guest after trying above:

1. **Check Session Claims**
   - Open browser console
   - Look for "useUserRole debug" logs
   - Verify `metadata` object has the right flags

2. **Check Organization Membership**
   - Verify `membershipRoles` includes `"org:teacher"`
   - Verify `hasTeacherMembership: true`

3. **Check Middleware Logs**
   - Look for "Teacher route check:" in server logs
   - Verify `orgRole` is `"org:teacher"`

4. **Force Session Refresh**
   - Clear browser cookies for localhost:3003
   - Sign out completely
   - Close browser tab
   - Open new tab and sign in

5. **Check Webhook Delivery**
   - Go to Clerk Dashboard → Webhooks
   - Check "Recent Events" tab
   - Look for `organizationMembership.created` events
   - Check response status (should be 200)

## Quick Test Script

Run this in your browser console to see your current state:

```javascript
// This will show you what Clerk thinks your roles are
console.log({
  sessionClaims: window.__clerk_session_claims,
  user: window.__clerk_user,
  org: window.__clerk_organization
})
```

## Still Not Working?

If you've tried everything and it's still showing as guest:

1. **Check the Clerk Session Token template**
   - Dashboard → Configure → Sessions → Edit
   - Ensure it includes: `"metadata": "{{user.public_metadata}}"`

2. **Verify publicMetadata in Clerk**
   - Go to your user in Clerk Dashboard
   - Check if `publicMetadata` actually has the flags
   - If not, use Option 2 above to set manually

3. **Check for cache issues**
   ```bash
   # In your terminal
   rm -rf .next
   npm run dev
   ```

4. **Enable detailed logging**
   - Enhanced logs are already added to:
     - `hooks/useUserRole.ts`
     - `middleware.ts`
     - `app/(communication)/api/webhooks/clerk/route.ts`

## Expected Timeline
- **Option 1 (Repair Script)**: 2 minutes
- **Option 2 (Manual Fix)**: 1 minute
- **Option 3 (Webhook Config)**: Works for new users only

## Need Help?
Check the detailed logs in:
- Browser console (for client-side issues)
- Terminal running `npm run dev` (for server-side issues)
- Clerk Dashboard → Webhooks → Recent Events (for webhook issues)
