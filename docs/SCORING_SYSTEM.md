# Scoring System Documentation

## Overview

The teachezee platform implements a comprehensive scoring system that supports multiple assessment types across different languages and proficiency levels. The system is designed to provide detailed, actionable feedback while maintaining flexibility for various language learning contexts.

## Table Structure

### Question-Based Scoring Tables

For exercises with discrete questions (reading, listening, grammar):

#### `reading_scores`
Stores question-level scores for reading comprehension tasks.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | User identifier |
| task_id | UUID | Foreign key to tasks |
| question_id | UUID | Foreign key to task_questions |
| question_number | INTEGER | Question number in sequence |
| user_answer | JSONB | User's submitted answer |
| correct_answer | JSONB | The correct answer |
| is_correct | BOOLEAN | Whether answer is correct |
| points_earned | NUMERIC | Points earned |
| max_points | NUMERIC | Maximum points possible |
| evaluation_data | JSONB | AI feedback and evaluation details |
| attempt_number | INTEGER | Attempt number (default 1) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

#### `listening_scores`
Same structure as `reading_scores`, for listening comprehension tasks.

#### `grammar_scores`
Same structure as `reading_scores`, for grammar exercises.

### Holistic Scoring Tables

For tasks requiring holistic evaluation (writing, speaking):

#### `writing_scores`
Stores multi-dimensional writing evaluations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | User identifier |
| task_id | UUID | Foreign key to tasks |
| attempt_number | INTEGER | Attempt number |
| response_text | TEXT | User's writing response |
| word_count | INTEGER | Number of words |
| task_completion_score | NUMERIC | Score for addressing prompt |
| coherence_cohesion_score | NUMERIC | Score for organization/flow |
| vocabulary_score | NUMERIC | Score for word choice |
| grammar_accuracy_score | NUMERIC | Score for grammar |
| format_score | NUMERIC | Score for format appropriateness |
| total_score | NUMERIC | Sum of all dimension scores |
| max_score | NUMERIC | Maximum possible score |
| percentage_score | NUMERIC | Percentage score |
| evaluation_data | JSONB | Detailed evaluation breakdown |
| grammar_error_count | INTEGER | Number of grammar errors |
| language | TEXT | Target language (default 'English') |
| course_name | TEXT | Course identifier for multi-language |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

**evaluation_data Structure:**
```json
{
  "task_completion": {
    "score": 4,
    "max_score": 5,
    "feedback": "All required points addressed...",
    "points_covered": ["point1", "point2"],
    "points_missing": []
  },
  "coherence_cohesion": {
    "score": 3.5,
    "max_score": 5,
    "feedback": "Good use of linking words...",
    "strengths": ["clear paragraphing"],
    "weaknesses": ["some repetition"]
  },
  "vocabulary": {
    "score": 4,
    "max_score": 5,
    "feedback": "Good range of vocabulary...",
    "strong_words": ["subsequently", "nevertheless"],
    "weak_areas": ["limited academic vocabulary"]
  },
  "grammar": {
    "score": 3,
    "max_score": 5,
    "feedback": "Generally accurate but some errors...",
    "error_count": 5,
    "error_types": ["verb_tense", "article_usage"]
  },
  "format": {
    "score": 5,
    "max_score": 5,
    "feedback": "Appropriate format for email...",
    "has_greeting": true,
    "has_closing": true,
    "has_subject": true
  },
  "overall_feedback": "Well-structured response...",
  "level_assessment": "B1",
  "strengths": ["Clear communication", "Good vocabulary range"],
  "areas_for_improvement": ["Grammar accuracy", "More complex sentences"]
}
```

#### `lesson_speaking_scores`
Stores holistic speaking evaluations based on conversation interactions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | User identifier |
| task_id | TEXT | Task identifier |
| course_name | TEXT | Course identifier (default 'goethe-a1') |
| attempt_id | INTEGER | Attempt number |
| conversation_history | JSONB | Full conversation transcript |
| task_instructions | TEXT | Task instructions/prompt |
| grammar_vocabulary_score | NUMERIC | Grammar and vocabulary score |
| communication_score | NUMERIC | Communication effectiveness score |
| total_score | NUMERIC | Total score |
| percentage_score | NUMERIC | Percentage score |
| evaluation_data | JSONB | Detailed evaluation breakdown |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

**evaluation_data Structure:**
```json
{
  "task_completion": {
    "score": 2.5,
    "max_score": 3,
    "feedback": "All required topics were addressed...",
    "points_addressed": ["greeting", "main topic", "conclusion"],
    "points_missing": []
  },
  "grammar_vocabulary": {
    "score": 3.5,
    "max_score": 4,
    "feedback": "Good range of vocabulary with minor errors...",
    "grammar_strengths": ["correct verb tenses", "good sentence structure"],
    "grammar_weaknesses": ["article usage", "prepositions"],
    "vocabulary_strengths": ["varied expressions", "topic-specific words"],
    "vocabulary_weaknesses": ["limited connectors"],
    "grammar_errors_list": [
      {
        "error": "I go to school yesterday",
        "correction": "I went to school yesterday",
        "explanation": "Past tense should be 'went' not 'go'",
        "grammar_category": "verb_tense",
        "severity": "moderate"
      }
    ]
  },
  "communication_effectiveness": {
    "score": 2.5,
    "max_score": 3,
    "feedback": "Clear and coherent communication...",
    "strengths": ["natural flow", "appropriate responses"],
    "weaknesses": ["some hesitation"],
    "fluency_assessment": "Good fluency with minor pauses",
    "clarity_assessment": "Very clear pronunciation"
  },
  "overall_feedback": "Strong performance overall...",
  "level_assessment": "A2+",
  "strengths": ["Confidence", "Good vocabulary"],
  "areas_for_improvement": ["Grammar accuracy", "Fluency"]
}
```

### Cross-Exercise Error Tracking

#### `grammar_errors`
Aggregates grammar errors from all exercise types for analytics and personalized learning.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | User identifier |
| source_type | TEXT | 'writing', 'speaking', or 'grammar' |
| source_id | TEXT | ID from source table |
| task_id | TEXT | Task/assignment ID |
| attempt_id | INTEGER | Attempt number |
| course | TEXT | Course identifier (e.g., 'goethe-a1') |
| language | TEXT | Target language |
| error_text | TEXT | The incorrect text |
| correction | TEXT | The correct version |
| explanation | TEXT | Explanation of the error |
| grammar_category | TEXT | Error category |
| error_type | TEXT | Alias for grammar_category |
| severity | TEXT | 'minor', 'moderate', or 'major' |
| context | TEXT | Surrounding text or full response |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

**Grammar Categories:**
- `verb_tense` - Incorrect verb tense usage
- `article_usage` - Missing or incorrect articles (a, an, the)
- `word_order` - Incorrect word order in sentences
- `preposition` - Wrong preposition usage
- `subject_verb_agreement` - Subject-verb agreement errors
- `pronoun` - Pronoun errors
- `plural` - Plural form errors
- `punctuation` - Punctuation errors
- `spelling` - Spelling mistakes
- `word_choice` - Incorrect word selection

## API Endpoints

### Question-Based Scoring APIs

#### POST `/api/score-reading`
Scores reading comprehension questions.

**Request (Single Question):**
```json
{
  "user_id": "user_123",
  "task_id": "uuid-here",
  "question_id": "uuid-here",
  "user_answer": "answer text or object",
  "attempt_number": 1
}
```

**Request (Batch):**
```json
{
  "user_id": "user_123",
  "task_id": "uuid-here",
  "attempt_number": 1,
  "answers": [
    {
      "question_id": "uuid-1",
      "user_answer": "answer 1"
    },
    {
      "question_id": "uuid-2",
      "user_answer": "answer 2"
    }
  ]
}
```

**Response (Batch):**
```json
{
  "success": true,
  "results": [
    {
      "question_id": "uuid-1",
      "question_number": 1,
      "is_correct": true,
      "points_earned": 1,
      "max_points": 1,
      "evaluation_data": {}
    }
  ],
  "summary": {
    "total_questions": 10,
    "total_points_earned": 8,
    "total_points_possible": 10,
    "percentage_score": 80
  }
}
```

#### POST `/api/score-listening`
Same interface as `/api/score-reading`, for listening tasks.

#### POST `/api/score-grammar`
Same interface as `/api/score-reading`, for grammar tasks.

### Holistic Scoring APIs

#### POST `/api/score-speaking`
Evaluates speaking with multi-dimensional assessment based on conversation.

**Request:**
```json
{
  "user_id": "user_123",
  "task_id": "task_abc",
  "conversation_history": [
    {
      "role": "assistant",
      "content": "Hello! Let's talk about your hobbies. What do you like to do in your free time?"
    },
    {
      "role": "user",
      "content": "I like to play football and reading books."
    },
    {
      "role": "assistant",
      "content": "That's great! How often do you play football?"
    },
    {
      "role": "user",
      "content": "I play every weekend with my friends."
    }
  ],
  "attempt_number": 1,

  "task_instructions": "Discuss your hobbies and free time activities",
  "required_points": ["Mention hobbies", "Describe frequency", "Give details"],

  "language": "English",
  "course_name": "general-english-a2",
  "level": "A2",

  "scoring_weights": {
    "task_completion": 3,
    "grammar_vocabulary": 4,
    "communication_effectiveness": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "db_record_id": "uuid-here",
  "task_completion": {
    "score": 2.5,
    "max_score": 3,
    "feedback": "All required points addressed well",
    "points_addressed": ["Mention hobbies", "Describe frequency"],
    "points_missing": []
  },
  "grammar_vocabulary": {
    "score": 3,
    "max_score": 4,
    "feedback": "Good vocabulary range with minor errors",
    "grammar_errors_list": [
      {
        "error": "reading books",
        "correction": "read books",
        "explanation": "After 'like to' use base form of verb",
        "grammar_category": "verb_form",
        "severity": "minor"
      }
    ]
  },
  "communication_effectiveness": {
    "score": 2.5,
    "max_score": 3,
    "feedback": "Clear and natural communication"
  },
  "total_score": 8,
  "max_score": 10,
  "percentage": 80,
  "overall_feedback": "Good conversational skills...",
  "level_assessment": "A2",
  "attempt_id": 1,
  "breakdown": {
    "grammar_vocabulary": 3,
    "communication": 2.5,
    "task_completion": 2.5
  }
}
```

#### POST `/api/score-writing`
Evaluates writing with multi-dimensional assessment.

**Request:**
```json
{
  "user_id": "user_123",
  "task_id": "uuid-here",
  "response_text": "The student's full writing response...",
  "attempt_number": 1,

  "prompt": "Write an email to your friend...",
  "required_points": ["Greet your friend", "Explain the situation", "Make a suggestion"],
  "format_type": "email",
  "word_count_min": 80,
  "word_count_max": 120,

  "language": "English",
  "course_name": "ielts",
  "level": "B1",

  "scoring_weights": {
    "task_completion": 5,
    "coherence_cohesion": 5,
    "vocabulary": 5,
    "grammar": 5,
    "format": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "writing_score_id": "uuid-here",
  "word_count": 95,
  "scores": {
    "task_completion": 4,
    "coherence_cohesion": 3.5,
    "vocabulary": 4,
    "grammar": 3,
    "format": 5,
    "total": 19.5,
    "max_total": 25,
    "percentage": 78
  },
  "evaluation": {
    "task_completion": { /* detailed feedback */ },
    "coherence_cohesion": { /* detailed feedback */ },
    "vocabulary": { /* detailed feedback */ },
    "grammar": { /* detailed feedback */ },
    "format": { /* detailed feedback */ },
    "overall_feedback": "...",
    "level_assessment": "B1",
    "strengths": ["..."],
    "areas_for_improvement": ["..."]
  },
  "grammar_errors": [
    {
      "error": "I am agree",
      "correction": "I agree",
      "explanation": "The verb 'agree' does not need 'am' before it",
      "grammar_category": "verb_usage",
      "severity": "moderate"
    }
  ],
  "attempt_number": 1
}
```

## Multi-Language Support

The scoring system supports multiple languages and courses through:

### 1. Course Identifier (`course_name`)
Use this field to distinguish between different language programs:
- `'goethe-a1'` - German A1 (Goethe)
- `'telc-a2'` - German A2 (TELC)
- `'ielts'` - English IELTS
- `'toefl'` - English TOEFL
- `'delf-a1'` - French DELF A1
- Custom identifiers for your courses

### 2. Language Field (`language`)
Specify the target language being learned:
- `'English'`
- `'German'`
- `'French'`
- `'Spanish'`
- etc.

### 3. Level Field (`level`)
Specify CEFR level for calibrated feedback:
- `'A1'`, `'A2'` - Beginner
- `'B1'`, `'B2'` - Intermediate
- `'C1'`, `'C2'` - Advanced

### Example: Multi-Language Usage

**German A1 Writing:**
```json
{
  "language": "German",
  "course_name": "goethe-a1",
  "level": "A1",
  "response_text": "Ich bin Student. Ich wohne in Berlin..."
}
```

**French B2 Writing:**
```json
{
  "language": "French",
  "course_name": "delf-b2",
  "level": "B2",
  "response_text": "Je vous écris pour exprimer..."
}
```

## Question Type Support

### Reading & Listening Question Types

1. **multiple_choice** - Single correct answer from 4 options
2. **checkbox** - Multiple correct answers (2+ required)
3. **true_false** - Binary true/false questions
4. **fill_in_the_blanks** - One blank to fill (AI-evaluated for flexibility)
5. **short_answer** - Open-ended short response (AI-evaluated)
6. **essay** - Extended response with word count (AI-evaluated)
7. **match_the_following** - Pair items from two lists
8. **sentence_reordering** - Arrange sentences in correct order

### Grammar Question Types

1. **multiple_choice** - Single correct answer
2. **checkbox** - Multiple correct answers
3. **true_false** - Grammar rule statements
4. **fill_in_the_blanks** - Fill in missing grammar elements
5. **error_correction** - Identify and correct errors (AI-evaluated with partial credit)
6. **sentence_transformation** - Transform sentences (AI-evaluated with accepted variations)
7. **verb_conjugation** - Conjugate verbs correctly (AI-evaluated)
8. **word_order** - Arrange words in correct order

## Scoring Methods

### Objective Scoring
Used for questions with clear right/wrong answers:
- Multiple choice
- Checkbox (all-or-nothing)
- True/false
- Matching (partial credit per match)
- Sentence/word ordering

### AI-Assisted Scoring
Used for questions requiring semantic understanding:
- Fill in the blanks (accepts synonyms and variations)
- Short answer (evaluates meaning, not exact wording)
- Essay (multi-dimensional evaluation)
- Error correction (partial credit for each error fixed)
- Sentence transformation (accepts grammatically correct variations)
- Verb conjugation (accepts alternative forms)
- **All writing tasks** (holistic multi-dimensional scoring)
- **All speaking tasks** (holistic conversation evaluation)

### Fallback Mechanisms
- If AI evaluation fails, system falls back to exact string matching
- Errors are logged with `ai_error` in `evaluation_data`
- Manual review flag set when fallback is insufficient

## Analytics Queries

### User Progress by Question Type
```sql
SELECT
  question_type,
  COUNT(*) as attempts,
  AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
  AVG(points_earned) as avg_points
FROM reading_scores
WHERE user_id = 'user_123'
GROUP BY question_type;
```

### Grammar Error Patterns
```sql
SELECT
  grammar_category,
  COUNT(*) as error_count,
  severity,
  language
FROM grammar_errors
WHERE user_id = 'user_123'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY grammar_category, severity, language
ORDER BY error_count DESC;
```

### Writing Progress Over Time
```sql
SELECT
  DATE(created_at) as date,
  AVG(percentage_score) as avg_score,
  AVG(grammar_error_count) as avg_errors,
  language,
  course_name
FROM writing_scores
WHERE user_id = 'user_123'
GROUP BY DATE(created_at), language, course_name
ORDER BY date;
```

### Cross-Exercise Grammar Analysis
```sql
SELECT
  u.user_id,
  ge.grammar_category,
  COUNT(*) FILTER (WHERE ge.source_type = 'writing') as writing_errors,
  COUNT(*) FILTER (WHERE ge.source_type = 'speaking') as speaking_errors,
  COUNT(*) FILTER (WHERE ge.source_type = 'grammar') as grammar_errors,
  COUNT(*) as total_errors
FROM grammar_errors ge
WHERE ge.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.user_id, ge.grammar_category
HAVING COUNT(*) >= 3
ORDER BY total_errors DESC;
```

## Best Practices

### 1. Use Batch Scoring for Multiple Questions
When scoring multiple questions from the same task, use batch mode to:
- Reduce API calls
- Get summary statistics
- Improve performance

### 2. Set Appropriate Course Names
Use meaningful course identifiers to:
- Track progress across different programs
- Generate course-specific analytics
- Support multi-language portfolios

### 3. Store Grammar Errors
Always enable grammar error tracking for:
- Personalized error reports
- Adaptive learning recommendations
- Progress tracking over time

### 4. Leverage Evaluation Data
The `evaluation_data` JSONB field contains rich feedback:
- Use for detailed student reports
- Extract specific feedback elements
- Build adaptive learning paths

### 5. Multi-Language Considerations
When supporting multiple languages:
- Always set `language` and `course_name`
- Use language-specific prompts in AI evaluation
- Consider language-specific scoring rubrics
- Track grammar categories by language

## Future Enhancements

Planned improvements to the scoring system:
- [ ] Real-time scoring during task completion
- [ ] Adaptive difficulty based on performance
- [ ] Peer comparison analytics
- [ ] Automated learning path recommendations
- [ ] Voice analysis for speaking (pronunciation, fluency)
- [ ] Plagiarism detection for writing
- [ ] Multi-rater reliability for subjective tasks
- [ ] Custom scoring rubrics per teacher/institution
