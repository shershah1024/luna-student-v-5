/**
 * TypeScript types for Institute Organizations
 */

export interface Institute {
  id: string
  clerk_org_id: string
  name: string
  slug: string
  description?: string
  settings: Record<string, any>
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface TeacherStudent {
  id: string
  teacher_id: string
  student_id: string
  institute_id: string
  status: 'active' | 'inactive'
  assigned_at: string
  created_at: string
}

export interface ParentChild {
  id: string
  parent_id: string
  child_id: string
  verified: boolean
  relationship_type: 'parent' | 'guardian'
  created_at: string
}

export interface InstituteJoinCode {
  id: string
  institute_id: string
  code: string
  role: 'org:teacher' | 'org:institute_admin'
  expires_at?: string
  max_uses?: number
  current_uses: number
  created_by: string
  created_at: string
}

// API request/response types

export interface CreateInstituteRequest {
  name: string
  slug: string
  description?: string
  settings?: Record<string, any>
}

export interface CreateInstituteResponse {
  institute: Institute
  clerk_org_id: string
}

export interface InviteTeacherRequest {
  email: string
  institute_id: string
  role?: 'org:teacher' | 'org:institute_admin'
}

export interface InviteStudentRequest {
  email: string
  institute_id: string
  teacher_id: string
}

export interface CreateJoinCodeRequest {
  institute_id: string
  role: 'org:teacher' | 'org:institute_admin'
  expires_at?: string
  max_uses?: number
}

export interface CreateJoinCodeResponse {
  join_code: InstituteJoinCode
  url: string
}

export interface JoinWithCodeRequest {
  code: string
  user_id: string
}
