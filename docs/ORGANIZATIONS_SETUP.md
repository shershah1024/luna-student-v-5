# Clerk Organizations Setup Guide

## Overview

This app uses **Clerk Organizations** for multi-tenant institute management with a simplified role-based access control system. No custom permissions needed - everything is handled via roles and frontend logic!

## Architecture

```
Platform Level (SaaS Owners)
└── Platform Admin (metadata flag: is_platform_admin = true)
    └── Can manage all institutes

Institute Level (Each Institute = Clerk Organization)
├── Institute Admin (role: org:institute_admin)
│   └── Full control over their institute
├── Teachers (role: org:teacher)
│   └── Create assignments, invite students
└── Students (NO ROLE - default org members)
    └── Take assignments, view progress
```

## Clerk Dashboard Configuration

### Step 1: Create Custom Roles

#### A. Institute Admin Role

Go to: **Configure → Organizations → Roles & Permissions → Create Role**

- **Name:** `Institute Admin`
- **Key:** `org:institute_admin` (exactly this!)
- **Description:** `Administrator with full control over institute`
- **System Permissions:** (Keep defaults)
  - ✅ Manage organization
  - ✅ Delete organization
  - ✅ Read domains
  - ✅ Manage domains
  - ✅ Read members
  - ✅ Manage members

**DO NOT add custom permissions** - we handle everything in code!

#### B. Teacher Role

Go to: **Configure → Organizations → Roles & Permissions → Create Role**

- **Name:** `Teacher`
- **Key:** `org:teacher` (exactly this!)
- **Description:** `Teacher who can create assignments and invite students`
- **System Permissions:**
  - ✅ Read members (to see students)

**DO NOT add custom permissions** - we handle everything in code!

### Step 2: Configure Session Token

Go to: **Configure → Sessions → Edit Token**

Add these custom claims:

```json
{
  "metadata": "{{user.public_metadata}}",
  "org_role": "{{user.organization_role}}",
  "org_id": "{{user.organization_id}}",
  "org_slug": "{{user.organization_slug}}"
}
```

Click **Save**. This is CRITICAL for role detection!

### Step 3: Set Platform Admin

Go to: **Users → [Your User] → Public Metadata**

Add:
```json
{
  "is_platform_admin": true
}
```

This gives you platform-level access to manage all institutes.

### Step 4: Enable Organizations (if not already)

Go to: **Configure → Organizations**

Ensure Organizations are enabled.

## Database Schema

### Tables Created

1. **institutes** - Institute records linked to Clerk orgs
2. **teacher_students** - Teacher-student assignments
3. **parent_children** - Parent-child relationships
4. **institute_join_codes** - Join codes for teacher self-join
5. **tasks** - Updated with `institute_id` field

All tables have RLS enabled with anon access (as per your requirements).

## Role Detection

### Server-Side (API Routes, Server Components)

```typescript
import { getUserRole, canCreateAssignments } from '@/lib/auth/roles'

// Get role
const role = await getUserRole()
// Returns: 'platform_admin' | 'institute_admin' | 'teacher' | 'student' | 'guest'

// Check permissions
const canCreate = await canCreateAssignments()
```

### Client-Side (React Components)

```typescript
'use client'
import { useUserRole } from '@/hooks/useUserRole'

export function MyComponent() {
  const {
    role,
    isPlatformAdmin,
    isInstituteAdmin,
    isTeacher,
    isStudent,
    canCreateAssignments
  } = useUserRole()

  return (
    <>
      {canCreateAssignments && <CreateButton />}
      {isStudent && <StudentView />}
    </>
  )
}
```

## Access Control

### Middleware (Page-Level)

Routes are protected in [middleware.ts](../middleware.ts):

- `/platform/*` - Platform admins only
- `/admin/*`, `/institute/*` - Institute admins only
- `/teachers/assignments/create/*` - Teachers & admins only
- All other routes - Authenticated users (including students)

### Frontend (Feature-Level)

Check roles/permissions directly:

```typescript
// Show button only to teachers and admins
{canCreateAssignments && <CreateAssignmentButton />}

// Show settings only to admins
{canManageInstitute && <SettingsLink />}
```

## User Flows

### 1. Create an Institute (Platform Admin Only)

```bash
POST /api/institutes/create
{
  "name": "ABC Language School",
  "slug": "abc-school",
  "description": "...",
  "admin_user_id": "user_xxx" # Optional, defaults to creator
}
```

Creates:
- Clerk organization
- Supabase institute record
- Adds admin with `org:institute_admin` role

### 2. Invite a Teacher (Institute Admin)

**Option A: Email Invitation**

```bash
POST /api/institutes/invite-teacher
{
  "email": "teacher@example.com",
  "role": "org:teacher" # or org:institute_admin
}
```

**Option B: Join Code (Self-Join)**

```bash
# Admin creates code
POST /api/institutes/create-join-code
{
  "role": "org:teacher",
  "expires_at": "2025-12-31T23:59:59Z", # Optional
  "max_uses": 50 # Optional
}

# Returns: { code: "ABC12345", url: "https://app.com/join-institute?code=ABC12345" }

# Teacher uses code
POST /api/institutes/join-with-code
{
  "code": "ABC12345"
}
```

### 3. Invite a Student (Teacher or Admin)

```bash
POST /api/institutes/invite-student
{
  "email": "student@example.com"
}
```

Student gets:
- Clerk org membership (NO role = student)
- Linked to teacher in `teacher_students` table (via webhook)

## Key Features

✅ **No Custom Permissions** - Simple role-based access
✅ **Frontend Control** - Handle permissions in your code
✅ **Multi-Institute** - Users can belong to multiple institutes
✅ **Flexible** - Easy to change permissions without updating Clerk
✅ **Cost-Effective** - No need for paid Clerk features
✅ **Scalable** - Supports unlimited institutes and users

## Testing

1. **Set yourself as platform admin** (Step 3 above)
2. **Create a test institute** via API or UI
3. **Invite a teacher** with join code
4. **Invite a student** via email
5. **Test page access** with different roles
6. **Verify role detection** in components

## Troubleshooting

### Role not detected?

- Check session token includes `metadata` and `org_role`
- User may need to sign out/in after role changes
- Verify role key is exactly `org:institute_admin` or `org:teacher`

### Student has role?

- Students should have NO role in Clerk
- Check invitation didn't specify a role
- Remove role if accidentally added

### Can't access pages?

- Check middleware route matchers
- Verify user is in correct organization
- Check role via `useUserRole()` hook

## Next Steps

1. ✅ Configure Clerk roles (Step 1-3)
2. ✅ Database tables already created
3. 🔄 Build institute management UI
4. 🔄 Build invitation flows
5. 🔄 Test with real users

---

**Need help?** Check the code in:
- `/lib/auth/roles.ts` - Server-side utilities
- `/hooks/useUserRole.ts` - Client-side hook
- `/middleware.ts` - Route protection
- `/app/api/institutes/*` - Institute APIs
