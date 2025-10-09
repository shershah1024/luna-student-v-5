# Refactored Student Invitation Flow

## Key Principle:
**Store ONLY Clerk User IDs, never email addresses**

## Problem with Current Approach:
```
1. Teacher invites: student_id = "email@example.com" ❌
2. Student accepts: student_id = "user_abc123" ✅
3. We have to UPDATE the record (fragile)
```

## Better Approach:

### Two Separate Tables:

#### 1. `pending_student_invitations` (Temporary tracking)
```sql
CREATE TABLE pending_student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL,           -- Clerk user ID
  invitation_type TEXT NOT NULL,       -- 'email' or 'join_code'

  -- For email invitations
  clerk_invitation_id TEXT,            -- Clerk's invitation ID
  invited_email TEXT,                  -- Just for display/tracking

  -- For join code invitations
  join_code TEXT,                      -- Reference to join code

  -- Common fields
  course TEXT,
  class_code TEXT,
  status TEXT DEFAULT 'pending',       -- 'pending', 'accepted', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Constraint: must have either email or join_code
  CONSTRAINT check_invitation_method
    CHECK (
      (invitation_type = 'email' AND clerk_invitation_id IS NOT NULL) OR
      (invitation_type = 'join_code' AND join_code IS NOT NULL)
    )
)
```

#### 2. `teacher_students` (Only active relationships)
```sql
-- This table ONLY stores active student-teacher relationships
-- student_id is ALWAYS a Clerk user ID, never an email
CREATE TABLE teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL,            -- Clerk user ID
  student_id TEXT NOT NULL,            -- Clerk user ID (NEVER email!)
  institute_id UUID,                   -- Optional
  course TEXT,
  class_code TEXT,
  joined_via TEXT,                     -- 'email_invitation' or 'join_code'
  status TEXT DEFAULT 'active',        -- 'active', 'inactive'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(teacher_id, student_id, institute_id)
)
```

---

## Flow 1: Email Invitation

### Teacher Side:
```typescript
// POST /api/teachers/invite-student
1. Teacher enters: email, course, class_code
2. Create Clerk invitation with metadata
3. Insert into pending_student_invitations:
   {
     teacher_id: "user_teacher123",
     invitation_type: "email",
     clerk_invitation_id: "inv_abc",
     invited_email: "student@example.com", // Just for tracking
     course: "Spanish A1",
     class_code: "Room 301",
     status: "pending"
   }
4. Return success
```

### Student Side:
```typescript
// When student accepts Clerk invitation
// Webhook: user.created

1. Student signs up via Clerk invitation link
2. Clerk sets publicMetadata: {
     is_student: true,
     teacher_id: "user_teacher123",
     course: "Spanish A1",
     class_code: "Room 301"
   }
3. Webhook receives user.created event
4. Extract: userId = "user_student456", metadata
5. Insert into teacher_students (ONLY Clerk IDs!):
   {
     teacher_id: "user_teacher123",
     student_id: "user_student456",  // ← Clerk user ID!
     course: "Spanish A1",
     class_code: "Room 301",
     joined_via: "email_invitation",
     status: "active"
   }
6. Update pending_student_invitations:
   - Find by teacher_id + clerk_invitation_id
   - Set status = "accepted"
7. Done!
```

---

## Flow 2: Join Code

### Teacher Side:
```typescript
// POST /api/teachers/generate-join-code
1. Teacher enters: course, class_code, max_uses, expires_at
2. Generate code: "ABC123"
3. Insert into student_join_codes:
   {
     code: "ABC123",
     teacher_id: "user_teacher123",
     course: "Spanish A1",
     class_code: "Room 301",
     max_uses: 30,
     current_uses: 0,
     expires_at: "2025-12-31"
   }
4. Return code and link
```

### Student Side:
```typescript
// GET /join/ABC123
1. Student visits join link
2. Validate code (check expiry, max_uses)
3. Show landing page with teacher/class info
4. Student clicks "Sign Up"
5. Redirect to sign-up with query param: ?join_code=ABC123

// During sign-up
6. Clerk signup form captures join_code
7. Store in publicMetadata or unsafeMetadata

// Webhook: user.created
8. Extract: userId, publicMetadata.join_code
9. Fetch join code details
10. Insert into teacher_students:
    {
      teacher_id: "user_teacher123",
      student_id: "user_student789",  // ← Clerk user ID!
      course: "Spanish A1",
      class_code: "Room 301",
      joined_via: "join_code",
      status: "active"
    }
11. Increment join_code usage count
12. Track usage in student_join_code_usage
13. Done!
```

---

## Getting Email Addresses for Display

### In Teacher Dashboard:
```typescript
// GET /api/teachers/students

1. Fetch from teacher_students (only Clerk user IDs)
2. For each student_id, call Clerk API:
   const user = await clerkClient.users.getUser(student_id)
   const email = user.emailAddresses[0].emailAddress
3. Return enriched data:
   {
     student_id: "user_abc",
     email: "student@example.com",  // ← Fetched from Clerk
     course: "Spanish A1",
     ...
   }
```

### Optimization: Cache emails
```typescript
// Option 1: Cache in memory (simple)
const emailCache = new Map()

// Option 2: Store in database (better)
CREATE TABLE student_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW()
)

// Update cache when student logs in or periodically
```

---

## Migration Strategy

### Step 1: Create new tables
```sql
CREATE TABLE pending_student_invitations (...);
CREATE TABLE student_join_codes (...);
```

### Step 2: Clean up existing data
```sql
-- Remove any records where student_id is an email
DELETE FROM teacher_students
WHERE student_id LIKE '%@%';
```

### Step 3: Update API endpoints
- `/api/teachers/invite-student` → Use new flow
- `/api/teachers/students` → Fetch emails from Clerk

### Step 4: Update webhook
- Handle both email and join_code flows
- Only insert Clerk user IDs

---

## Benefits:

1. ✅ **Single source of truth**: Clerk manages user data
2. ✅ **No fragile updates**: Never change student_id
3. ✅ **Email changes handled**: If student changes email in Clerk, we get it
4. ✅ **Cleaner data**: No email/userID confusion
5. ✅ **Better tracking**: Separate pending vs active
6. ✅ **Scalable**: Easy to add more invitation methods

---

## Code Changes Needed:

1. **Database migration**: Create new tables
2. **Invite API**: Store in pending_student_invitations
3. **Webhook**: Create teacher_students with Clerk user IDs only
4. **Students API**: Fetch emails from Clerk on-demand
5. **UI**: Display emails fetched from Clerk

This is the correct architecture! Should I implement it?
