# Speaking Data Structure

## Tables

### `speaking_log`
Stores turn-by-turn conversation messages during speaking practice.

**Columns:**
- `id` (uuid) - Primary key
- `task_id` (text) - The speaking task/lesson ID
- `user_id` (text) - Clerk user ID
- `role` (text) - "user" or "assistant"
- `content` (text) - Message content (can be JSON string or plain text)
- `message_index` (integer) - Turn number in conversation
- `created_at` (timestamptz)

**API:** `/api/speaking-log`
- **GET** `?taskId=X&userId=Y` - Fetch all messages for a conversation
- **POST** - Save a new message
- **DELETE** `?taskId=X&userId=Y` - Clear conversation history

### `lesson_speaking_scores`
Stores evaluation results after a speaking conversation is complete.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (text) - Clerk user ID
- `task_id` (text) - The speaking task/lesson ID
- `course_name` (text) - e.g., "telc_a1", "goethe-a1"
- `attempt_id` (integer) - Attempt number (max 3)
- `conversation_history` (jsonb) - Full conversation array
- `task_instructions` (text) - Instructions given to student
- `grammar_vocabulary_score` (numeric) - Score out of 5
- `communication_score` (numeric) - Score out of 5
- `total_score` (numeric) - Total score out of 10
- `percentage_score` (numeric) - Percentage 0-100
- `evaluation_data` (jsonb) - Detailed evaluation breakdown
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**API:** `/api/lesson-speaking-evaluation` (POST)
- Evaluates conversation using LLM
- Saves score to `lesson_speaking_scores`
- Extracts grammar errors and saves to `grammar_errors` table

## Evaluation Data Structure

The `evaluation_data` JSONB field contains:

```json
{
  "task_completion": {
    "completed": boolean,
    "explanation": "string"
  },
  "grammar_vocabulary": {
    "score": number (0-5),
    "strengths": "string",
    "weaknesses": "string",
    "grammar_errors_list": [
      {
        "error": "incorrect phrase",
        "correction": "correct phrase",
        "explanation": "why it's wrong",
        "grammar_category": "verb conjugation | articles | prepositions | cases | word order | adjective endings",
        "severity": "minor | moderate | major"
      }
    ]
  },
  "communication_effectiveness": {
    "score": number (0-5),
    "strengths": "string",
    "areas_for_improvement": "string"
  },
  "overall_feedback": "string",
  "level_assessment": "A1 | A2 | B1 | B2 | C1 | C2",
  "evaluation_timestamp": "ISO datetime"
}
```

## Response from Evaluation API

```json
{
  "task_completion": { ... },
  "grammar_vocabulary": { ... },
  "communication_effectiveness": { ... },
  "total_score": 8.5,
  "max_score": 10,
  "percentage": 85,
  "overall_feedback": "...",
  "level_assessment": "A2",
  "db_record_id": "uuid",
  "attempt_id": 1,
  "breakdown": {
    "grammar_vocabulary": 4.0,
    "communication": 4.5
  }
}
```

## What to Show in Speaking Dashboard

### 1. Overview Stats
- Total conversations
- Average total score
- Average grammar/vocabulary score
- Average communication score
- Current level assessment (most recent)
- Trend (improving/declining)

### 2. Conversations List
Each conversation card shows:
- Task title/topic
- Date
- Attempt number (1/2/3)
- Total score with breakdown
- Quick feedback snippet
- "View Details" button

### 3. Detailed Conversation View
For each conversation:
- Full conversation transcript
- Task instructions
- Complete evaluation scores:
  - Task Completion (✓/✗)
  - Grammar & Vocabulary (X/5)
  - Communication Effectiveness (X/5)
  - Total Score (X/10)
- Grammar Errors List with corrections
- Overall feedback
- Level assessment

### 4. Progress Charts
- Score trend over time (line chart)
- Grammar vs Communication scores (comparison)
- Most common grammar error categories (bar chart)

### 5. Grammar Error Patterns
- List of all grammar mistakes grouped by category
- Most frequent error types
- Recommendations for practice areas

## Key Insights for Dashboard Design

1. **Max 3 attempts per task** - Show attempt number clearly
2. **Two main score dimensions** - Grammar/Vocab + Communication
3. **Detailed error tracking** - Grammar errors are saved separately for cross-task analysis
4. **Level progression** - Track CEFR level assessment over time
5. **Task-specific history** - Group conversations by task_id
6. **Rich evaluation data** - All feedback is in evaluation_data JSONB
