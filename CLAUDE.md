# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luna is an AI-powered language learning platform built with Next.js 14, focusing on German language learning. This is a learner-centric application where all authenticated users have access to learning features including lessons, exercises, speaking/listening/reading/writing practice, and progress tracking.

## Development Commands

- `npm run dev` - Start development server (runs with `NEXT_LOG_LEVEL=error` to reduce console noise)
- `npm run build` - Production build (uses 8GB Node memory for large builds)
- `npm run start` - Serve production build
- `npm run lint` - Run ESLint
- `npm run format:check` - Check code formatting with Prettier
- `npm run format:write` - Auto-format code with Prettier
- `npm run generate-library` - Generate content library using ts-node script
- `npm run generate-library:dry-run` - Test content generation without saving

## Architecture

### Route Organization (Next.js 14 App Router)

Routes are organized by feature using route groups:

- `(learning)/` - Core learning features (lessons, exams, practice exercises, speaking/listening/reading/writing)
- `(communication)/` - Chat and WhatsApp integration features
- `(assessments)/` - Evaluation and scoring APIs
- `(operations)/` - Health checks and monitoring
- `(marketing)/` - Public-facing pages
- `(auth)/` - Authentication flows (sign-in/sign-up)
- `(testing)/` - Test pages for development

### Authentication & Authorization

- Uses **Clerk** for simple authentication
- Simplified middleware (`middleware.ts`) - all authenticated users can access learning features
- After sign-up, users are redirected to `/lessons` to begin learning
- No role-based access control - all users are learners

### Database & Storage

- **Supabase** as primary database (project ID: `gglkagcmyfdyojtgrzyv`)
- Always use the Supabase MCP for database operations
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not service role key)
- RLS policies grant anon users full access
- Before creating new tables, check for existing tables first and confirm with user

### AI/LLM Integration

- **Azure OpenAI** for AI features (protected service in `lib/azure-openai-protected.ts`)
- Uses **gpt-4o-mini** model for structured outputs (not "04-mini")
- Circuit breaker pattern for API resilience (see `lib/circuit-breaker.ts`)
- Rate limiting via `lib/rate-limiter.ts` and `lib/edge-rate-limiter.ts`
- Redis caching layer in `lib/redis-cache.ts`
- LiveKit for real-time voice features

### Key Services & Libraries

- `lib/supabase.ts` - Supabase client initialization
- `lib/azure-openai-protected.ts` - Protected Azure OpenAI service with retry logic
- `lib/examService.ts` - Exam/test management
- `lib/speaking-evaluation-service.ts` - Speaking assessment logic
- `lib/writing-eval.ts` - Writing evaluation logic
- `lib/whatsapp.ts` - WhatsApp integration
- `lib/roles-v2.ts` - Role management utilities
- `lib/stores/examStore.ts` - Zustand store for exam state

### Component Structure

- `components/ui/` - Radix UI primitives (Button, Dialog, etc.)
- `components/lessons/` - Lesson and exercise components
- `components/dashboard/` - Dashboard widgets and cards
- `components/exam/` - Exam-taking interface components
- `components/v3/` - Universal test components (Reading, Listening)

### Custom Hooks

- `hooks/useUserRole-v2.ts` - Role detection and permissions
- `hooks/useSpeakingPipeline*.ts` - Various speaking exercise implementations (PTT, VAD, streaming)
- `hooks/useChatbotLesson.ts` - Chatbot interaction logic
- `hooks/useTeacherAssignment.ts` - Assignment management for teachers
- `hooks/useUserOrganization.ts` - Organization context

## Important Technical Notes

### Next.js Specifics

- Server components by default; add `"use client"` only when needed
- `useSearchParams()` must be wrapped in a Suspense boundary
- TypeScript build errors are ignored in production (`ignoreBuildErrors: true` in `next.config.js:7`)

### Error Handling

- Do NOT add fallbacks - when something fails, errors should be visible for debugging
- Sentry enabled in production only (`next.config.js:71-86`)
- PostHog analytics integrated via rewrites (`next.config.js:51-66`)

### Performance Optimizations

- VAD (Voice Activity Detection) files copied via webpack for client-side use
- Image domains whitelisted: `images.unsplash.com`, `gglkagcmyfdyojtgrzyv.supabase.co`, `*.tslfiles.org`
- Circuit breaker and exponential backoff for external API calls

### Code Style

- Use kebab-case for routes and folders (e.g., `app/api/generate-passage-audio`)
- Use PascalCase for component files (e.g., `ListeningPageClient.tsx`)
- 2-space indentation, Prettier formatting
- Import sorting via `@trivago/prettier-plugin-sort-imports`

## API Routes by Category

### Reading APIs
- `/api/reading/[paperId]` - Fetch reading test
- `/api/reading/section-[1-3]` - Section-specific content
- `/api/reading/score-question` - Score individual questions
- `/api/reading/generate-with-ai` - AI-generated passages

### Listening APIs
- `/api/listening/[paperId]` - Fetch listening test
- `/api/listening/section-[1-3]` - Section content with scoring logic
- `/api/listening/generate-conversation` - AI-generated audio dialogues

### Writing APIs
- `/api/writing/[testId]/section[1-2]` - Writing task sections
- `/api/writing-evaluations/*` - Evaluation endpoints
- `/api/lesson-writing-evaluation` - Lesson-specific writing feedback

### Speaking APIs
- `/api/speaking-task` - Speaking task details
- `/api/assess-pronunciation-fast` - Pronunciation assessment via Azure Speech SDK
- `/api/pronunciation-progress` - Track speaking progress

### Lesson APIs
- `/api/lesson-chatbot-instructions` - Chatbot instructions for lessons
- `/api/next-lesson` - Get next lesson in sequence
- `/api/vocab-practice/*` - Vocabulary practice endpoints
- `/api/grammar-tutor-contextual` - Contextual grammar tutoring
- `/api/pronunciation-exercise` - Pronunciation exercises

## Environment Variables Required

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_SECRET_KEY` - Clerk server-side operations
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (use this, not service role)
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
- `AZURE_OPENAI_API_KEY` - Azure OpenAI key
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Deployment name
- `SENTRY_*` - Sentry error tracking (production only)
- `NEXT_PUBLIC_POSTHOG_*` - PostHog analytics

## Testing

No formal test runner configured. Use provided Node.js test scripts:
- `node test-ai-reading.js` - Test reading API endpoints
- `node scripts/check-pages.js` - Puppeteer-based page validation

## Key Types & Interfaces

See `types.ts` for core data structures:
- `Test` - Test metadata with papers (reading, writing, speaking, listening)
- `Paper` - Paper structure with sections
- `Section` - Section with questions/tasks
- `Question` - Individual question with options and correct answers
- `Task` - Writing/speaking task prompts

## Documentation Files

- `AGENTS.md` - Repository guidelines (already exists)
- `STUDENT_INVITATION_FLOW.md` - Student invitation process
- `CLERK_SETUP.md` - Clerk authentication setup
- `CONTENT_LIBRARY_IMPLEMENTATION.md` - Content library architecture

## Common Patterns

### Creating API Routes with Error Handling
```typescript
import { NextResponse } from 'next/server'
import { withCircuitBreaker } from '@/lib/circuit-breaker'

export async function POST(request: Request) {
  try {
    const data = await withCircuitBreaker('serviceName', async () => {
      // API logic here
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Using Supabase
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
```

### User Authentication Check
```typescript
import { useUser } from '@clerk/nextjs'

const { isSignedIn, user } = useUser()
// All authenticated users are learners
```

## Workflow Notes

- Always use @ navigation for file references
- Add comprehensive comments and documentation to files for maintainability
- Name files thoughtfully to indicate their purpose
- Show table structure in markdown after creating Supabase tables
- Do not stop mid-todo-list to check with user - complete tasks autonomously
