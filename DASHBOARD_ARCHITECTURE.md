# Dashboard Architecture

## Overview
Multi-tiered dashboard system for tracking student progress across different skill types.

## Route Structure

```
/lessons                    → Student assignments overview (current page)
/dashboard                  → Unified overview dashboard (NEW)
/dashboard/speaking         → Speaking-specific dashboard
/dashboard/writing          → Writing-specific dashboard
/dashboard/reading          → Reading-specific dashboard
/dashboard/listening        → Listening-specific dashboard
/dashboard/chatbot          → Chatbot conversations dashboard
/dashboard/grammar          → Grammar practice dashboard
/dashboard/pronunciation    → Pronunciation practice dashboard
```

## Data Sources by Skill Type

### Speaking Dashboard
**Tables:**
- `lesson_speaking_scores` - Speaking evaluations with detailed scores
- `speaking_log` - Conversation history
- `task_conversation_logs` - Detailed turn-by-turn conversations
- `pronunciation_scores` - Pronunciation accuracy

**Show:**
- ✅ All speaking conversations (chronological list)
- ✅ Speaking evaluation scores (grammar/vocabulary, communication, total)
- ✅ Pronunciation accuracy trends (chart)
- ✅ Most practiced tasks
- ✅ Average scores by dimension
- ✅ Improvement over time (line chart)
- ✅ Recent conversations with playback/review
- ✅ Detailed feedback from evaluations

### Writing Dashboard
**Tables:**
- `writing_scores` - Writing submissions with multi-dimensional scores
- `grammar_errors` - Grammar mistakes from writing

**Show:**
- ✅ All writing submissions (list with preview)
- ✅ Score breakdown by dimension:
  - Task Completion
  - Coherence & Cohesion
  - Vocabulary
  - Grammar Accuracy
  - Format
- ✅ Grammar error patterns (categorized)
- ✅ Word count trends (chart)
- ✅ Average scores comparison (radar chart)
- ✅ Most common mistakes
- ✅ Writing samples with detailed feedback
- ✅ Progress over time (line chart)

### Reading Dashboard
**Tables:**
- `reading_scores` - Individual question scores
- `task_questions` - Question details
- `tasks` (reading_tasks) - Test metadata

**Show:**
- ✅ All reading tests taken (list with scores)
- ✅ Overall accuracy rate
- ✅ Accuracy by question type (pie chart)
- ✅ Performance by test/task
- ✅ Time spent per test
- ✅ Most difficult question types
- ✅ Recent tests with review option
- ✅ Progress trend (line chart)

### Listening Dashboard
**Tables:**
- `listening_scores` - Individual question scores
- `listening_tasks` - Audio details
- `task_questions` - Question details

**Show:**
- ✅ All listening tests taken
- ✅ Overall accuracy rate
- ✅ Performance by section (chart)
- ✅ Accuracy by question type
- ✅ Audio completion rates
- ✅ Most challenging sections
- ✅ Progress over time
- ✅ Recent tests with audio replay option

### Chatbot Dashboard
**Tables:**
- `task_conversation_logs` - All chatbot conversations
- `chatbot_tasks` - Task/scenario details

**Show:**
- ✅ All chatbot conversations (chronological)
- ✅ Conversation topics/scenarios
- ✅ Turn count per conversation
- ✅ Vocabulary used (word cloud)
- ✅ Engagement metrics
- ✅ Recent conversations with full transcript
- ✅ Practice frequency (calendar heatmap)

### Grammar Dashboard
**Tables:**
- `grammar_scores` - Grammar quiz results
- `grammar_errors` - All grammar mistakes across exercises
- `task_questions` - Question details

**Show:**
- ✅ All grammar quizzes taken
- ✅ Overall accuracy
- ✅ Error categorization:
  - Verb conjugation
  - Articles (der/die/das)
  - Prepositions
  - Cases (Nominative, Accusative, Dative, Genitive)
  - Word order
  - Adjective endings
- ✅ Mastery by topic (progress bars)
- ✅ Most common mistakes
- ✅ Error trends over time
- ✅ Recommended practice areas

### Pronunciation Dashboard
**Tables:**
- `pronunciation_scores` - Word-level pronunciation scores
- `pronunciation_tasks` - Practice exercises

**Show:**
- ✅ All pronunciation attempts
- ✅ Average pronunciation score
- ✅ Most practiced words
- ✅ Difficult words/sounds
- ✅ Pronunciation accuracy trend
- ✅ Practice frequency
- ✅ Improvement by word/sound

## Unified Overview Dashboard (`/dashboard`)

**Purpose:** High-level view of progress across ALL skill types

**Show:**
- 📊 **Skill Cards Grid** (6-8 cards):
  - Speaking: avg score, total conversations
  - Writing: avg score, total submissions
  - Reading: accuracy %, tests taken
  - Listening: accuracy %, tests taken
  - Chatbot: total conversations
  - Grammar: accuracy %, quizzes taken
  - Pronunciation: avg score, words practiced

- 📈 **Overall Progress Chart**:
  - Multi-line chart showing progress across all skills over time

- 🎯 **Strengths & Weaknesses**:
  - Top 3 strongest skills (green badges)
  - Top 3 areas for improvement (yellow badges)

- 📝 **Recent Activity Feed**:
  - Last 10-15 activities across all types
  - "Completed Reading Test: 85%"
  - "Had Speaking conversation: 4.2/5.0"
  - etc.

- 💡 **Recommendations**:
  - AI-powered suggestions based on patterns
  - "Practice more grammar - error rate is 25%"
  - "Great progress in speaking! Keep it up!"

## API Routes

```
GET /api/dashboard/speaking          → Speaking data + evaluations
GET /api/dashboard/writing           → Writing submissions + scores
GET /api/dashboard/reading           → Reading tests + accuracy
GET /api/dashboard/listening         → Listening tests + performance
GET /api/dashboard/chatbot           → Chatbot conversations
GET /api/dashboard/grammar           → Grammar quizzes + error patterns
GET /api/dashboard/pronunciation     → Pronunciation scores
GET /api/dashboard/overview          → Aggregate data from all skills
```

## Component Structure

```
components/dashboard/
  ├── skill-specific/
  │   ├── SpeakingDashboard.tsx
  │   ├── WritingDashboard.tsx
  │   ├── ReadingDashboard.tsx
  │   ├── ListeningDashboard.tsx
  │   ├── ChatbotDashboard.tsx
  │   ├── GrammarDashboard.tsx
  │   └── PronunciationDashboard.tsx
  │
  ├── shared/
  │   ├── StatCard.tsx              → Reusable stat card
  │   ├── ScoreChart.tsx            → Line/bar charts for scores
  │   ├── ActivityCard.tsx          → Individual activity item
  │   ├── ProgressRing.tsx          → Circular progress indicator
  │   ├── SkillBadge.tsx           → Skill type badge
  │   └── TrendIndicator.tsx       → Up/down trend arrow
  │
  └── overview/
      ├── SkillCard.tsx             → Skill summary card
      ├── ActivityFeed.tsx          → Recent activity list
      ├── StrengthsWeaknesses.tsx   → Analysis section
      └── RecommendationsPanel.tsx  → AI suggestions
```

## Design Principles

1. **Consistency**: Same design language across all dashboards
2. **Data-Rich**: Show detailed insights, not just numbers
3. **Actionable**: Every insight should suggest next steps
4. **Visual**: Use charts, graphs, progress bars extensively
5. **Responsive**: Mobile-first design
6. **Fast**: Cache API responses, lazy load charts
7. **Accessible**: Proper labels, ARIA attributes

## Implementation Priority

**Phase 1** (MVP):
1. ✅ Student assignments page (DONE)
2. Speaking dashboard (most complex, do first)
3. Writing dashboard (second most important)
4. Unified overview dashboard

**Phase 2**:
5. Reading dashboard
6. Listening dashboard
7. Grammar dashboard

**Phase 3**:
8. Chatbot dashboard
9. Pronunciation dashboard
10. Advanced analytics and AI recommendations

## Database Queries Strategy

For each dashboard:
1. Fetch user's attempts/submissions for that skill
2. Join with task/question details
3. Aggregate statistics (avg, count, sum)
4. Group by time periods (daily, weekly, monthly)
5. Calculate trends (improvement rate)
6. Identify patterns (common errors, difficult areas)

Example query for Speaking:
```sql
SELECT
  lss.*,
  lst.topic,
  lst.lesson_title,
  COUNT(*) OVER (PARTITION BY user_id) as total_conversations,
  AVG(total_score) OVER (PARTITION BY user_id) as avg_total_score
FROM lesson_speaking_scores lss
LEFT JOIN lesson_speaking_instructions lst ON lss.task_id = lst.task_id
WHERE lss.user_id = $1
ORDER BY lss.created_at DESC;
```
