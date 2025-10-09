# Webhook Debugging Guide

## Current Situation
You have a webhook set up at Svix, but we need to verify it's receiving `organizationMembership.*` events.

## Steps to Debug

### 1. Check Webhook Event Subscriptions

In your Clerk Dashboard:
1. Go to **Configure → Webhooks**
2. Click on your webhook endpoint
3. Look for the **"Message Filtering"** or **"Subscribe to events"** section
4. **Required events that MUST be checked:**
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.updated`
   - ✅ `user.created` (already working)

### 2. Test the Webhook

**Option A: Check Svix Logs**
1. Go to https://play.svix.com (or your Svix dashboard)
2. Look for recent events
3. Filter by event type: `organizationMembership.created`
4. If you don't see any such events, they're not being sent

**Option B: Check Clerk Dashboard**
1. In Clerk Dashboard → Webhooks
2. Click on your webhook
3. Go to **"Recent Messages"** or **"Logs"** tab
4. Look for `organizationMembership.*` events
5. Check if they show as delivered (200) or failed

### 3. What Each Event Should Show

**When a user joins an organization, you should see:**
```json
{
  "type": "organizationMembership.created",
  "data": {
    "id": "orgmem_xxx",
    "object": "organization_membership",
    "role": "org:teacher",  // ← This is what we need!
    "organization": {
      "id": "org_xxx",
      "name": "Your Institute"
    },
    "public_user_data": {
      "user_id": "user_xxx",  // ← This is the user who joined
      "first_name": "...",
      "last_name": "..."
    }
  }
}
```

**Our webhook handler looks for:**
- `evt.type === 'organizationMembership.created'`
- Extracts `role` (e.g., "org:teacher")
- Extracts `user_id`
- Sets metadata: `is_teacher: true` or `is_institute_admin: true`

### 4. Current Webhook Code Status

The webhook handler at `/api/webhooks/clerk/route.ts` is configured to:
- ✅ Handle `user.created` events (for invitation codes)
- ✅ Handle `organizationMembership.created` events (lines 118-201)
- ✅ Handle `organizationMembership.updated` events (lines 118-201)
- ✅ Has detailed logging with `[WEBHOOK]` prefix
- ✅ Sets `is_teacher` and `is_institute_admin` flags

### 5. How to Enable Missing Events

If `organizationMembership.*` events are NOT subscribed:

**In Clerk Dashboard:**
1. Navigate to **Configure → Webhooks**
2. Click your webhook endpoint
3. Click **"Edit"** or **"Configure"**
4. Scroll to **"Subscribe to events"**
5. Search for "organization"
6. Check these boxes:
   - `organizationMembership.created`
   - `organizationMembership.updated`
7. Click **"Save"** or **"Update"**

### 6. Test After Enabling

After enabling the events:
1. Delete your current user from the organization (in Clerk Dashboard)
2. Re-invite them to the organization with `org:teacher` role
3. Accept the invitation
4. Check webhook logs in Svix/Clerk for the event
5. Check your server logs for `[WEBHOOK]` messages
6. The metadata should be set automatically

### 7. If Events Are Already Enabled But Not Working

Check the webhook endpoint URL:
- Should be: `https://your-production-domain.com/api/webhooks/clerk`
- For local testing: You need a tunnel (ngrok, etc.) since webhooks need a public URL
- Localhost URLs won't work for webhooks!

### 8. Local Development Note

⚠️ **Important**: Webhooks cannot reach `localhost:3003`!

For local development, you need:
1. Use a tunneling service (ngrok, Cloudflare Tunnel, etc.)
2. Or test on a deployed environment (Vercel, etc.)
3. Or use the manual fix endpoint: `/api/admin/fix-my-metadata`

**Quick fix for local dev:**
Since you're on localhost, the webhook won't trigger. Instead:
1. After joining the organization
2. Visit: `http://localhost:3003/api/admin/fix-my-metadata` (POST)
3. This will manually set the metadata based on your org role
4. Sign out and back in

### 9. Expected Log Output

**When webhook receives organizationMembership.created:**
```
[WEBHOOK] Organization membership event received: {
  eventType: 'organizationMembership.created',
  data: { ... }
}
[WEBHOOK] Extracted membership details: {
  userId: 'user_33XoeUM6rwQIUYOKg7d57WjrZBO',
  role: 'org:teacher',
  orgId: 'org_xxx'
}
[WEBHOOK] Current user metadata: {
  userId: 'user_33XoeUM6rwQIUYOKg7d57WjrZBO',
  currentMetadata: {}
}
[WEBHOOK] Setting is_teacher = true for user: user_33XoeUM6rwQIUYOKg7d57WjrZBO
[WEBHOOK] Updating user metadata to: { is_teacher: true, role: 'teacher' }
[WEBHOOK] Successfully updated user metadata for: user_33XoeUM6rwQIUYOKg7d57WjrZBO
```

**If you don't see these logs**, the webhook isn't receiving the events.

### 10. Quick Solution Summary

**Immediate fix (works on localhost):**
```bash
# While logged in as the user with org membership
curl -X POST http://localhost:3003/api/admin/fix-my-metadata
```

**Permanent fix (for production):**
1. Enable `organizationMembership.created` and `organizationMembership.updated` in Clerk webhook settings
2. Ensure webhook URL is publicly accessible (not localhost)
3. Test with a new user invitation
