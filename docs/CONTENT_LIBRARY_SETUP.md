# Content Library Setup Guide

## 🎯 Overview

This guide walks through setting up and populating the multi-language public content library with 500+ learning exercises across German, Spanish, French, and English.

## 📋 Prerequisites

- Supabase project set up with anon key configured
- OpenAI Azure GPT-5 API access
- Next.js development environment running

## 🚀 Quick Start

### Step 1: Apply Database Migration

```bash
# Apply the migration to add public content support
npx supabase db push
```

Or manually apply the migration:
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/20250205_add_public_content_library.sql
```

### Step 2: Generate Content Library

```bash
# Full generation (500+ items across 4 languages)
npm run generate-library

# Preview blueprints first (dry run)
npm run generate-library -- --dry-run

# Generate for specific language only
npm run generate-library -- --lang=German --count=50
```

### Step 3: Verify Results

```bash
# Check library statistics
curl http://localhost:3000/api/public-library/stats

# Browse German A2 content
curl "http://localhost:3000/api/public-library?language=German&level=A2"

# Search for grammar exercises
curl "http://localhost:3000/api/public-library?q=grammar&type=grammar"
```

## 📊 What Gets Created

### Database Changes

The migration adds:
- `is_public` (boolean) - marks content as publicly available
- `language` (text) - target language (German, Spanish, etc.)
- `level` (text) - CEFR level (A1-C2)
- Indexes for efficient querying
- `public_content_library` view for easy access
- `search_public_content()` function for full-text search
- `public_content_stats` table for tracking popularity

### Content Distribution

**Default configuration generates 500 items:**
- **German**: 125 items (40% grammar, 30% reading, 15% speaking, 15% listening)
- **Spanish**: 125 items (same distribution)
- **French**: 125 items (same distribution)
- **English**: 125 items (same distribution)

**Level distribution per language:**
- A1: ~30 items (24%)
- A2: ~40 items (32%)
- B1: ~35 items (28%)
- B2: ~20 items (16%)

## 🔧 API Endpoints

### Content Generation

#### Generate Blueprints
```bash
POST /api/generate-content-blueprints
Content-Type: application/json

{
  "languages": ["German", "Spanish", "French", "English"],
  "levels": ["A1", "A2", "B1", "B2"],
  "count_per_language": 125
}
```

#### Bulk Generate Content
```bash
POST /api/bulk-generate-content
Content-Type: application/json

{
  "blueprints": [...],
  "batch_size": 5,
  "delay_ms": 2000,
  "mark_as_public": true
}
```

### Public Library Access

#### Browse Library
```bash
GET /api/public-library?language=German&level=A2&type=grammar&limit=20
```

Parameters:
- `language` - Filter by language (German, Spanish, French, English)
- `level` - Filter by CEFR level (A1, A2, B1, B2, C1, C2)
- `type` - Filter by task type (grammar, reading, listening, etc.)
- `q` - Full-text search query
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset (default: 0)

#### Random Content
```bash
GET /api/public-library/random?language=Spanish&level=B1&count=5
```

Returns random exercises matching criteria - great for "surprise me" features.

#### Library Statistics
```bash
GET /api/public-library/stats
```

Returns comprehensive statistics about the library content.

### Content Review

#### Get Review Queue
```bash
GET /api/content-review?status=pending&limit=20
```

Status options: `pending`, `approved`, `rejected`

#### Submit Review
```bash
POST /api/content-review
Content-Type: application/json

{
  "task_id": "uuid",
  "review_status": "approved",
  "quality_score": 4,
  "notes": "Great exercise, clear instructions",
  "issues": []
}
```

#### Update Review
```bash
PATCH /api/content-review
Content-Type: application/json

{
  "task_id": "uuid",
  "quality_score": 5,
  "notes": "Updated after corrections"
}
```

## 🎨 Content Types

### Grammar Exercises
- Question types: multiple_choice, fill_in_blanks, error_correction, sentence_transformation, verb_conjugation, word_order, true_false, checkbox
- Points: 12-25 per exercise
- Topics: tenses, cases, articles, conjugations, syntax

### Reading Comprehension
- Text types: article, story, news, essay, report, tutorial
- Word counts: A1/A2 (100-200), B1/B2 (200-400), C1/C2 (400-600)
- Question types: multiple_choice, true_false, short_answer, matching, essay
- Points: 10-20 per exercise

### Speaking/Conversation
- Chatbot-based interactive dialogues
- Scenarios: introductions, shopping, travel, debates, discussions
- Level-appropriate vocabulary and complexity

### Listening Comprehension
- Audio-based exercises with questions
- Types: dialogues, interviews, podcasts, lectures
- Duration: 1-3 minutes

## 📈 Monitoring & Quality Control

### Content Review Workflow

1. **Generated Content** → Automatically marked for review
2. **Review Queue** → Accessible at `/api/content-review?status=pending`
3. **Manual Review** → Check quality, grammar, pedagogical value
4. **Approval/Rejection** → Updates status and visibility
5. **Public Library** → Approved content appears in search results

### Quality Criteria

✅ **Approve if:**
- CEFR level is accurate
- Grammar and language are correct
- Instructions are clear
- Questions are answerable from content
- Culturally appropriate
- Pedagogically sound

❌ **Reject if:**
- Incorrect language level
- Contains errors
- Unclear instructions
- Cultural issues
- Poor educational value

### Analytics

Track content performance:
```sql
SELECT
  language,
  level,
  task_type,
  AVG(pcs.popularity_score) as avg_popularity,
  SUM(pcs.views_count) as total_views,
  COUNT(*) as item_count
FROM public_content_library pcl
LEFT JOIN public_content_stats pcs ON pcl.id = pcs.task_id
GROUP BY language, level, task_type
ORDER BY avg_popularity DESC;
```

## 🔄 Incremental Updates

### Add More Content

```bash
# Add 50 more German B2 items
npm run generate-library -- --lang=German --count=50 --level=B2
```

### Regenerate Failed Items

1. Check failed generations in bulk generation response
2. Extract failed blueprints
3. Re-run with adjusted parameters

```typescript
// Get failed blueprints from previous run
const failedBlueprints = previousResults.errors.map(e => e.blueprint);

// Retry with smaller batch size
await fetch('/api/bulk-generate-content', {
  method: 'POST',
  body: JSON.stringify({
    blueprints: failedBlueprints,
    batch_size: 2,
    delay_ms: 3000
  })
});
```

## 🐛 Troubleshooting

### Migration Issues

**Problem**: Migration fails with "relation already exists"
```bash
# Check if columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name IN ('is_public', 'language', 'level');

# Drop and recreate if needed
ALTER TABLE tasks DROP COLUMN IF EXISTS is_public;
# Then re-run migration
```

### Generation Failures

**Problem**: Rate limit errors from OpenAI
```bash
# Increase delay between batches
npm run generate-library -- --delay=5000
```

**Problem**: Some content types fail consistently
```bash
# Generate specific types separately
# Edit script to filter blueprints by type
const grammarOnly = blueprints.filter(bp => bp.task_type === 'grammar');
```

### Empty Results

**Problem**: Public library returns no results
```bash
# Check if content is marked as public
SELECT COUNT(*) FROM tasks WHERE is_public = true;

# Manually mark content as public
UPDATE tasks
SET is_public = true, language = 'German', level = 'A2'
WHERE task_type = 'grammar' AND teacher_id = 'system_content_generator';
```

## 📝 Next Steps

After successful generation:

1. **Review Content** - Go through pending reviews
2. **Test Discovery** - Try search and browse features
3. **Student UI** - Build frontend for content library
4. **Analytics** - Track which content is most popular
5. **Expansion** - Add more languages or advanced levels
6. **AI Tuning** - Adjust prompts based on quality feedback

## 🔗 Related Files

- Migration: `/supabase/migrations/20250205_add_public_content_library.sql`
- Blueprint Generator: `/app/(teaching)/api/generate-content-blueprints/route.ts`
- Bulk Generator: `/app/(teaching)/api/bulk-generate-content/route.ts`
- Public Library API: `/app/(learning)/api/public-library/route.ts`
- Review System: `/app/(teaching)/api/content-review/route.ts`
- Execution Script: `/scripts/generate-content-library.ts`
