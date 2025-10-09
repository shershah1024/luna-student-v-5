# 🚀 Content Library Quick Start

## TL;DR - Get 500+ Exercises in 3 Commands

```bash
# 1. Apply database migration
npx supabase db push

# 2. Preview what will be generated (optional)
npm run generate-library:dry-run

# 3. Generate full library (500+ items, 4 languages)
npm run generate-library
```

**Time:** ~30-45 minutes | **Cost:** ~$60 in API calls

---

## What You Get

✅ **500+ AI-generated exercises**
- 🇩🇪 German: 125 items
- 🇪🇸 Spanish: 125 items
- 🇫🇷 French: 125 items
- 🇬🇧 English: 125 items

✅ **Exercise Types** (per language)
- Grammar: 40% (~50 items)
- Reading: 30% (~38 items)
- Speaking: 15% (~19 items)
- Listening: 15% (~18 items)

✅ **CEFR Levels**
- A1, A2, B1, B2 (distributed appropriately)

---

## Quick Commands

### Generate Content
```bash
# Full library (500+ items, ~45 min)
npm run generate-library

# Preview only (no generation)
npm run generate-library:dry-run

# Single language (faster testing)
npm run generate-library -- --lang=German --count=50
```

### Browse Library
```bash
# Get German A2 grammar exercises
curl "http://localhost:3000/api/public-library?language=German&level=A2&type=grammar"

# Search for "past tense"
curl "http://localhost:3000/api/public-library?q=past+tense"

# Random Spanish content
curl "http://localhost:3000/api/public-library/random?language=Spanish&count=5"

# Library stats
curl "http://localhost:3000/api/public-library/stats"
```

### Review Content
```bash
# Get review queue
curl "http://localhost:3000/api/content-review?status=pending"

# Approve content
curl -X POST http://localhost:3000/api/content-review \
  -H "Content-Type: application/json" \
  -d '{"task_id":"uuid","review_status":"approved","quality_score":4}'
```

---

## Files You Need to Know

| File | What It Does |
|------|--------------|
| `supabase/migrations/20250205_add_public_content_library.sql` | Database schema |
| `scripts/generate-content-library.ts` | Main generation script |
| `app/(teaching)/api/generate-content-blueprints/route.ts` | AI blueprint generator |
| `app/(teaching)/api/bulk-generate-content/route.ts` | Bulk content creator |
| `app/(learning)/api/public-library/route.ts` | Public library API |
| `docs/CONTENT_LIBRARY_SETUP.md` | Full documentation |

---

## Common Issues

### ❌ Migration fails
```bash
# Check if columns already exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name IN ('is_public', 'language', 'level');
```

### ❌ Rate limit errors
```bash
# Increase delay between batches
npm run generate-library -- --delay=5000
```

### ❌ No public content
```bash
# Check if content is marked public
SELECT COUNT(*) FROM tasks WHERE is_public = true;

# Manually mark as public
UPDATE tasks SET is_public = true, language = 'German', level = 'A2'
WHERE task_type = 'grammar';
```

---

## API Endpoints

### Generation (Admin/Teacher Only)
- `POST /api/generate-content-blueprints` - Generate blueprints
- `POST /api/bulk-generate-content` - Create content

### Public Library (Anyone)
- `GET /api/public-library` - Browse/search
- `GET /api/public-library/random` - Random discovery
- `GET /api/public-library/stats` - Statistics

### Review (Authenticated)
- `GET /api/content-review?status=pending` - Review queue
- `POST /api/content-review` - Submit review
- `PATCH /api/content-review` - Update review

---

## Next Steps

1. ✅ Run migration
2. ✅ Generate content
3. ⏳ Review generated content
4. ⏳ Build student UI
5. ⏳ Add analytics tracking
6. ⏳ Expand to more languages

---

## Need Help?

📖 **Full docs:** [CONTENT_LIBRARY_SETUP.md](docs/CONTENT_LIBRARY_SETUP.md)
📋 **Implementation details:** [CONTENT_LIBRARY_IMPLEMENTATION.md](CONTENT_LIBRARY_IMPLEMENTATION.md)

---

## Summary

You now have a complete system to:
- ✅ Generate 500+ exercises automatically
- ✅ Store them in a searchable public library
- ✅ Browse by language, level, and type
- ✅ Review and approve content quality
- ✅ Track popularity and analytics

**Just run the commands above and you're live! 🎉**
