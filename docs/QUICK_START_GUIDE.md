# 🚀 Quick Start Guide: Clerk Organizations Implementation

## ✅ What's Been Built

You now have a complete multi-tenant institute management system using Clerk Organizations!

### 📋 Core Features

✅ **Platform Admin Dashboard** - Manage all institutes
✅ **Institute Admin Dashboard** - Manage teachers & students
✅ **Teacher Invitations** - Email invites & join codes
✅ **Student Invitations** - Email invites with auto-assignment
✅ **Role-Based Access Control** - Page-level protection
✅ **Organization Switcher** - Multi-institute support
✅ **Role Indicator** - Visual role display

---

## 🎯 Getting Started

### Step 1: Configure Clerk Dashboard

#### A. Create Custom Roles

**1. Teacher Role:**
- Go to: Configure → Organizations → Roles & Permissions → Create Role
- Name: `Teacher`
- Key: `org:teacher`
- Permissions: Just "Read members"

**2. Verify Institute Admin Role:**
- Should already exist
- Key must be: `org:institute_admin`
- Keep default system permissions

#### B. Update Session Token

Go to: Configure → Sessions → Edit

Add these claims:
```json
{
  "metadata": "{{user.public_metadata}}",
  "org_role": "{{user.organization_role}}",
  "org_id": "{{user.organization_id}}",
  "org_slug": "{{user.organization_slug}}"
}
```

#### C. Set Yourself as Platform Admin

1. Go to: Users → [Your User]
2. Click: Public Metadata
3. Add:
```json
{
  "is_platform_admin": true
}
```

### Step 2: Test the System

#### 1. Access Platform Dashboard
- Go to: `/platform`
- You should see platform admin dashboard
- Click "Create Institute"

#### 2. Create a Test Institute
- Name: "Test School"
- Slug: "test-school"
- Click "Create Institute"

#### 3. Switch to Institute Admin
- Use Organization Switcher (top right)
- Select "Test School"
- Go to: `/institute`

#### 4. Invite a Teacher
- Click "Invite Teachers"
- Enter email or...
- Click "Generate Join Code"
- Copy the link and share

#### 5. Test Teacher Join
- Open join link in incognito/another browser
- Sign up/in
- Enter join code
- Should join as teacher

#### 6. Invite a Student
- As teacher, go to: `/teachers/invite-student`
- Enter student email
- Student will receive invitation

---

## 📁 File Structure

### Pages Created

```
app/
├── platform/
│   ├── page.tsx                          # Platform admin dashboard
│   └── institutes/
│       └── create/
│           ├── page.tsx                  # Create institute page
│           └── CreateInstituteForm.tsx   # Form component
│
├── institute/
│   ├── page.tsx                          # Institute admin dashboard
│   ├── invite/
│   │   └── teacher/
│   │       ├── page.tsx
│   │       └── InviteTeacherForm.tsx
│   └── join-codes/
│       ├── page.tsx
│       └── JoinCodeGenerator.tsx
│
├── join-institute/
│   ├── page.tsx                          # Teacher self-join
│   └── JoinWithCodeForm.tsx
│
└── teachers/
    └── invite-student/
        ├── page.tsx
        └── InviteStudentForm.tsx
```

### API Routes

```
app/api/institutes/
├── create/route.ts              # Create institute
├── invite-teacher/route.ts      # Invite teacher by email
├── invite-student/route.ts      # Invite student by email
├── create-join-code/route.ts    # Generate join code
└── join-with-code/route.ts      # Join with code
```

### Utilities & Components

```
lib/auth/
└── roles.ts                     # Server-side role utilities

hooks/
└── useUserRole.ts               # Client-side role hook

components/
├── Navbar.tsx                   # Navigation with role links
└── RoleIndicator.tsx            # Role badge display

types/
└── organizations.ts             # TypeScript types
```

### Database Tables

```
supabase/
├── institutes
├── teacher_students
├── parent_children
└── institute_join_codes
```

---

## 🔐 Role Hierarchy

### Platform Admin
- **Who:** SaaS owners (you)
- **Metadata:** `is_platform_admin: true`
- **Can:**
  - Create/manage all institutes
  - Access `/platform/*` routes
  - Override all permissions

### Institute Admin
- **Role:** `org:institute_admin`
- **Can:**
  - Manage their institute
  - Invite teachers (email or code)
  - View all members
  - Access `/institute/*` routes

### Teacher
- **Role:** `org:teacher`
- **Can:**
  - Create assignments
  - Invite students
  - Grade student work
  - Access `/teachers/*` routes

### Student
- **Role:** None (default org member)
- **Can:**
  - View assignments
  - Submit work
  - See own progress
  - Access student pages only

---

## 🎨 User Flows

### Flow 1: Platform Admin Creates Institute

1. Platform admin goes to `/platform`
2. Clicks "Create Institute"
3. Fills form and submits
4. Institute created with Clerk org + DB record
5. Admin user added to org with `institute_admin` role

### Flow 2: Institute Admin Invites Teacher (Email)

1. Institute admin goes to `/institute/invite/teacher`
2. Enters teacher email
3. Selects role (teacher or admin)
4. Teacher receives email invitation
5. Teacher signs up/in and joins org

### Flow 3: Teacher Self-Joins (Code)

1. Institute admin goes to `/institute/join-codes`
2. Generates join code
3. Shares link with teacher
4. Teacher opens link, signs up/in
5. Enters code and joins org

### Flow 4: Teacher Invites Student

1. Teacher goes to `/teachers/invite-student`
2. Enters student email
3. Student receives invitation (NO role)
4. Student joins as default org member
5. Auto-linked to teacher in DB

---

## 🚧 Access Control

### Middleware Protection

```typescript
// Platform routes
if (isPlatformRoute) {
  require: is_platform_admin metadata
}

// Institute admin routes
if (isInstituteAdminRoute) {
  require: org:institute_admin role
}

// Teacher routes
if (isTeacherRoute) {
  require: org:teacher OR org:institute_admin
}

// Student routes
else {
  allow: authenticated users (including students)
}
```

### Frontend Checks

```typescript
// Using hook
const { canCreateAssignments } = useUserRole()
{canCreateAssignments && <CreateButton />}

// Using server function
const canCreate = await canCreateAssignments()
if (canCreate) { ... }
```

---

## 🔑 Key Concepts

### 1. No Custom Permissions
- Just use roles: `org:institute_admin` and `org:teacher`
- Handle all permissions in your code
- Simpler & more flexible

### 2. Students = No Role
- Students are default org members
- No special role needed
- Detected by absence of role

### 3. Organization Context
- Users switch orgs via `<OrganizationSwitcher />`
- Current org determines permissions
- Use `orgId` to filter data

### 4. Platform vs Institute
- Platform admin: Metadata flag
- Institute admin: Org role
- Platform admin can access all institutes

---

## 📊 Data Model

### Institute → Teachers → Students

```
Institute (Clerk Org + DB Record)
├── Institute Admins (org:institute_admin)
├── Teachers (org:teacher)
│   └── Students (assigned via teacher_students table)
└── Students (no role, just org members)
```

### Relationships in Supabase

```sql
-- Institute
institutes
├── id
├── clerk_org_id (links to Clerk)
└── ...

-- Teacher-Student Link
teacher_students
├── teacher_id (Clerk user ID)
├── student_id (Clerk user ID)
└── institute_id (FK to institutes)

-- Parent-Child (Future)
parent_children
├── parent_id
└── child_id
```

---

## 🐛 Troubleshooting

### Role not detected?
✅ Check session token includes `metadata` and `org_role`
✅ User may need to sign out/in
✅ Verify role key is exactly `org:institute_admin` or `org:teacher`

### Can't access pages?
✅ Check middleware route matchers
✅ Verify user in correct organization
✅ Use `useUserRole()` to debug

### Student has role?
✅ Students should have NO role
✅ Check invitation didn't specify role
✅ Remove role if accidentally added

### Join code not working?
✅ Check code is valid & not expired
✅ Verify max uses not reached
✅ User must be signed in first

---

## 🎯 Next Steps

### Immediate:
1. ✅ Configure Clerk (Steps above)
2. ✅ Set yourself as platform admin
3. ✅ Create test institute
4. ✅ Test all flows

### Future Enhancements:
- [ ] Add parent role support
- [ ] Create analytics dashboard
- [ ] Build assignment management
- [ ] Add billing integration
- [ ] Create mobile app support

---

## 📚 Documentation

- [Full Setup Guide](./ORGANIZATIONS_SETUP.md)
- [Middleware Code](../middleware.ts)
- [Role Utilities](../lib/auth/roles.ts)
- [Hook Usage](../hooks/useUserRole.ts)

---

## 💡 Tips

1. **Always test with multiple browsers** - Different roles in different browsers
2. **Use incognito for testing** - Fresh sessions for each role
3. **Check the Organization Switcher** - Make sure you're in the right org
4. **Monitor Clerk Dashboard** - See real-time org changes
5. **Use role indicator** - Quick visual confirmation of current role

---

**You're all set! 🎉**

Start by setting yourself as platform admin, then create your first institute!
