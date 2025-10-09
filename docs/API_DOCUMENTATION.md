# Reading Quiz Generation API Documentation

## Quick Start
```bash
# Simplest possible request - just provide a topic
curl -X POST https://lunathesmart.com/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic": "Daily Routine"}'
```

## Endpoint
`POST https://lunathesmart.com/api/create-reading-quiz`

## Description
Generate a complete reading comprehension quiz with AI-generated passage and questions in a single API call. This endpoint uses GPT-5 with high reasoning effort to create educational content.

## Authentication
**Not Required** - The API is open and can be called without any authentication.

### Optional Headers for Tracking:
- `x-user-id`: Custom user identifier (optional)
- `x-api-key`: API key for tracking usage (optional)

## Request Headers
```
Content-Type: application/json
x-user-id: [optional] Custom user identifier
x-api-key: [optional] API key for tracking
```

## Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Topic for the reading passage |
| `language` | string | No | "English" | Language for content generation |
| `level` | string | No | "A2" | CEFR level: A1, A2, B1, B2, C1, C2 |
| `word_count` | number | No | 150 | Target word count (50-500) |
| `total_points` | number | No | 20 | Total points for all questions (5-100) |
| `question_types` | array | No | ["multiple_choice", "true_false", "short_answer"] | Available types: multiple_choice, true_false, short_answer, match_the_following, sentence_reordering, fill_in_the_blanks |
| `num_questions` | number | No | Auto | Number of questions (2-20) |
| `save_assignment` | boolean | No | false | Save to database |
| `title` | string | No | Auto-generated | Custom title for the quiz |

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "task_id": "uuid-if-saved",
  "data": {
    "passage": {
      "title": "Passage Title",
      "content": "Full passage text...",
      "word_count": 150
    },
    "questions": [
      {
        "type": "multiple_choice",
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 1,
        "correct_answer": "Option B",
        "points": 3,
        "explanation": "Optional explanation"
      },
      {
        "type": "true_false",
        "question": "Statement to evaluate",
        "correct_answer": "true",
        "points": 2
      }
    ],
    "metadata": {
      "total_points": 20,
      "question_count": 6,
      "difficulty_level": "B1",
      "topic": "Climate Change"
    }
  },
  "metadata": {
    "generated_at": "2025-09-15T16:53:58.372Z",
    "model": "gpt-5",
    "reasoning_effort": "high"
  }
}
```

### Error Response (400/500)
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Quick Start Examples

### Minimal Request (only required field)
```bash
curl -X POST https://lunathesmart.com/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic": "Daily Routine"}'
```

### Basic Request with Common Options
```bash
curl -X POST https://lunathesmart.com/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Climate Change",
    "level": "B1",
    "word_count": 200,
    "total_points": 20
  }'
```

### Full Request with All Options
```bash
curl -X POST https://lunathesmart.com/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-system" \
  -d '{
    "topic": "Space Exploration",
    "language": "English",
    "level": "B2",
    "word_count": 250,
    "total_points": 30,
    "question_types": ["multiple_choice", "true_false", "short_answer", "fill_in_the_blanks"],
    "num_questions": 8,
    "save_assignment": false,
    "title": "Space Quiz"
  }'
```

### Test with Local Server
```bash
curl -X POST http://localhost:3001/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic": "Technology", "level": "A2"}'
```

### Save Response to File
```bash
curl -X POST https://lunathesmart.com/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic": "Environment"}' \
  -o quiz_response.json
```

### Pretty Print Response
```bash
curl -X POST https://lunathesmart.com/api/create-reading-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic": "Sports"}' \
  | python -m json.tool
```

## Question Types

### 1. Multiple Choice
```json
{
  "type": "multiple_choice",
  "question": "What time does Maya wake up?",
  "options": ["6:00", "6:30", "7:00", "7:30"],
  "correct_index": 1,
  "correct_answer": "6:30",
  "points": 3
}
```

### 2. True/False
```json
{
  "type": "true_false",
  "question": "Maya drives to work.",
  "correct_answer": "false",
  "points": 2
}
```

### 3. Short Answer
```json
{
  "type": "short_answer",
  "question": "What does Maya eat for breakfast?",
  "correct_answer": "Toast with jam",
  "points": 3
}
```

### 4. Match the Following
```json
{
  "type": "match_the_following",
  "prompt": "Match the times with activities",
  "left": ["6:30", "7:30", "12:30"],
  "right": ["Wake up", "Take bus", "Lunch"],
  "correct_answer": {
    "6:30": "Wake up",
    "7:30": "Take bus",
    "12:30": "Lunch"
  },
  "points": 4
}
```

### 5. Sentence Reordering
```json
{
  "type": "sentence_reordering",
  "question": "Put the sentences in correct order",
  "sentences": ["She eats breakfast.", "Maya wakes up.", "She takes the bus."],
  "correct_order": [1, 0, 2],
  "correct_answer": ["Maya wakes up.", "She eats breakfast.", "She takes the bus."],
  "points": 5
}
```

### 6. Fill in the Blanks
```json
{
  "type": "fill_in_the_blanks",
  "question": "Maya wakes up at ___ and takes the ___ to work.",
  "correct_answer": ["6:30", "bus"],
  "points": 3
}
```

## Rate Limits
- Maximum request size: 10KB
- Maximum execution time: 60 seconds
- Recommended: Max 10 requests per minute

## CORS
The API supports CORS and can be called from any origin.

## Notes
- The AI ensures questions are answerable from the passage content alone
- Point distribution is automatically optimized based on question difficulty
- The model internally plans question distribution before generation
- All content is appropriate for the specified CEFR level