# Clerk Session Token Template Fix

## Problem
Your session token has template placeholders that aren't being replaced:
```json
"org_id": "{{user.organization_id}}",
"org_role": "{{user.organization_role}}",
"org_slug": "{{user.organization_slug}}"
```

These should be actual values, not template strings.

## Solution: Fix Session Token Template

### Step 1: Go to Clerk Dashboard
1. Navigate to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Configure → Sessions**
4. Click **"Edit"** on the session token

### Step 2: Update the Template

**CURRENT (WRONG):**
```json
{
  "metadata": "{{user.public_metadata}}",
  "org_id": "{{user.organization_id}}",
  "org_role": "{{user.organization_role}}",
  "org_slug": "{{user.organization_slug}}"
}
```

**CORRECT (Use this):**
```json
{
  "metadata": {{user.public_metadata}}
}
```

That's it! Just the metadata field - no quotes around the template, and no org fields (Clerk provides these automatically).

### Step 3: Alternative (If you need org fields explicitly)

If you specifically want org fields in claims:
```json
{
  "metadata": {{user.public_metadata}},
  "org_id": {{org.id}},
  "org_role": {{org_membership.role}},
  "org_slug": {{org.slug}}
}
```

**Note:** Use `{{org.id}}` NOT `"{{user.organization_id}}"`

### Step 4: Save and Test
1. Click **"Save"** or **"Apply Changes"**
2. Sign out of your app
3. Sign back in
4. Check browser console - you should now see:
   ```javascript
   orgRole: "org:teacher"  // ← Not null!
   membershipRoles: ["org:teacher"]
   hasTeacherMembership: true
   ```

## Why This Matters

The middleware checks BOTH:
1. `metadata.is_teacher` ✅ (Already working)
2. `orgRole === 'org:teacher'` ❌ (Currently null)

Right now you're passing because of the metadata flag, but the org role should also be set for proper organization-based access control.

## Quick Test

After fixing and signing back in, run this in browser console:
```javascript
console.log(window.__clerk_session?.orgRole)
// Should show: "org:teacher" (not null)
```

## References
- [Clerk Session Claims Documentation](https://clerk.com/docs/backend-requests/making/custom-session-token)
- Template syntax: `{{variable}}` not `"{{variable}}"`
