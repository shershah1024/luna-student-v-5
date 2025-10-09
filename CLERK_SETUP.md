# Clerk RBAC Setup Guide (2024)

## Overview
This guide follows Clerk's latest 2024 documentation for implementing Role-Based Access Control using public metadata and session claims.

## 1. Clerk Dashboard Configuration

### Step 1: Create Session Token Template
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Configure → Sessions**
3. Click **Edit** on the session token
4. Add the following custom claims:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

### Step 2: Configure Webhooks
1. Go to **Configure → Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. **CRITICAL**: Select these events:
   - `user.created` (required for invitation flow)
   - `organizationMembership.created` (required for org invites)
   - `organizationMembership.updated` (required for role changes)
   - `user.updated` (optional)
4. Copy the signing secret and add to `.env.local`:
```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**IMPORTANT**: Without `organizationMembership.created` and `organizationMembership.updated` events enabled, teachers invited via Clerk organizations will NOT have their `is_teacher` or `is_institute_admin` metadata set automatically.

## 2. User Role Assignment

### Initial Setup (Manual)
For existing users or initial admin setup:

1. Go to **Users** in Clerk Dashboard
2. Select a user
3. Click **Edit** → **Public metadata**
4. Add:
```json
{
  "role": "teacher"
}
```

Valid roles: `admin`, `teacher`, `student`, `parent`

### Automatic Assignment (Via Invitations)
Students get roles automatically when using teacher invitation links.

## 3. File Structure

```
/lib
  roles-v2.ts         # Server-side role utilities
/hooks
  useUserRole-v2.ts   # Client-side role hook
/types
  globals.d.ts        # TypeScript definitions
/app/api
  /admin
    set-role/         # Admin role management
  /invitations
    create/           # Teacher invitation system
  /webhooks
    clerk/            # Webhook handler
middleware-2024.ts    # Route protection
```

## 4. Implementation Checklist

### Required Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxxx
CLERK_SECRET_KEY=sk_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Activation Steps
1. ✅ Add type definitions (`types/globals.d.ts`)
2. ✅ Configure session token in Clerk Dashboard
3. ✅ Set up webhook endpoint
4. ✅ Activate new middleware:
   ```bash
   mv middleware.ts middleware-old.ts
   mv middleware-2024.ts middleware.ts
   ```
5. ✅ Update imports to use new utilities

## 5. Usage Examples

### Server Component (App Router)
```tsx
import { checkRole } from '@/lib/roles-v2'
import { redirect } from 'next/navigation'

export default async function TeacherPage() {
  const isTeacher = await checkRole('teacher')
  
  if (!isTeacher) {
    redirect('/forbidden')
  }
  
  return <div>Teacher Content</div>
}
```

### Client Component
```tsx
'use client'
import { useUserRole } from '@/hooks/useUserRole-v2'

export function MyComponent() {
  const { isTeacher, isStudent, role } = useUserRole()
  
  return (
    <div>
      {isTeacher && <TeacherFeatures />}
      {isStudent && <StudentFeatures />}
      <p>Current role: {role || 'none'}</p>
    </div>
  )
}
```

### API Route
```tsx
import { checkRole } from '@/lib/roles-v2'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const isAdmin = await checkRole('admin')
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }
  
  // Admin logic here
}
```

## 6. Testing

### Test Flow
1. **Admin Setup**
   - Manually set admin role in Clerk Dashboard
   - Test admin-only routes

2. **Teacher Flow**
   - Set teacher role
   - Access teacher dashboard
   - Create student invitations

3. **Student Flow**
   - Use invitation link
   - Sign up
   - Verify automatic role assignment
   - Check restricted access

## 7. Security Notes

- Roles are stored in `publicMetadata` (read-only from frontend)
- Only backend can modify roles (via Clerk API)
- Session claims include metadata for efficient access
- No additional API calls needed for role checks
- Invitation codes expire and have usage limits

## 8. Troubleshooting

### Role Not Appearing in Session
- Check session token template in Clerk Dashboard
- Ensure metadata is included in claims
- User may need to sign out/in for changes

### Webhook Not Working
- Verify webhook secret in `.env.local`
- Check webhook logs in Clerk Dashboard
- Ensure endpoint is publicly accessible

### Middleware Issues
- Check matcher patterns in `middleware.ts`
- Verify route patterns match your paths
- Check browser console for redirect loops