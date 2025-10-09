# 🚀 Content Library Execution Plan

## ✅ Status: Migration Complete, Ready for Generation

### What's Done

1. ✅ **Database Migration Applied**
   - New columns added: `is_public`, `language`, `level`
   - Indexes created for performance
   - View `public_content_library` ready
   - Search function `search_public_content()` available
   - Stats table created

2. ✅ **APIs Built**
   - Blueprint generator: `/api/generate-content-blueprints`
   - Bulk generator: `/api/bulk-generate-content`
   - Public library: `/api/public-library`
   - Review system: `/api/content-review`

### ⚠️ Current Limitation

The generation APIs are in the `(teaching)` folder which requires **teacher authentication** via Clerk. This means:
- ❌ Cannot run via `curl` without auth token
- ❌ Cannot run the Node script without being logged in as a teacher
- ✅ CAN run through the browser when logged in as a teacher

## 📋 How to Execute (Choose One)

### Option A: Browser-Based (Easiest)

1. **Login as a teacher** at http://localhost:3001
2. **Open browser console** (F12 → Console tab)
3. **Run this JavaScript:**

```javascript
// Step 1: Generate Blueprints
const blueprintsResponse = await fetch('/api/generate-content-blueprints', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    languages: ['German', 'Spanish', 'French', 'English'],
    levels: ['A1', 'A2', 'B1', 'B2'],
    count_per_language: 125
  })
});
const blueprintsData = await blueprintsResponse.json();
console.log('Blueprints generated:', blueprintsData.statistics);

// Step 2: Bulk Generate Content
const generateResponse = await fetch('/api/bulk-generate-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blueprints: blueprintsData.blueprints,
    batch_size: 5,
    delay_ms: 2000,
    mark_as_public: true
  })
});
const generateData = await generateResponse.json();
console.log('Generation complete:', generateData.statistics);

// Step 3: Check Stats
const statsResponse = await fetch('/api/public-library/stats');
const statsData = await statsResponse.json();
console.log('Library stats:', statsData.statistics);
```

### Option B: API Testing Tool (Postman/Insomnia)

1. Login to your app in the browser
2. Open DevTools → Network tab
3. Find any API request and copy the `Cookie` header
4. Use that cookie in Postman/Insomnia for authenticated requests

**Request 1: Generate Blueprints**
```
POST http://localhost:3001/api/generate-content-blueprints
Headers:
  Content-Type: application/json
  Cookie: [copy from browser]
Body:
{
  "languages": ["German", "Spanish", "French", "English"],
  "levels": ["A1", "A2", "B1", "B2"],
  "count_per_language": 125
}
```

**Request 2: Bulk Generate**
```
POST http://localhost:3001/api/bulk-generate-content
Headers:
  Content-Type: application/json
  Cookie: [copy from browser]
Body:
{
  "blueprints": [/* paste from step 1 response */],
  "batch_size": 5,
  "delay_ms": 2000,
  "mark_as_public": true
}
```

### Option C: Make APIs Public (Temporary)

If you want to run without auth (NOT recommended for production):

1. Edit `/app/(teaching)/api/generate-content-blueprints/route.ts`
2. Move it to `/app/api/generate-content-blueprints/route.ts` (remove `(teaching)` folder)
3. Same for `bulk-generate-content`
4. Run the Node script: `npm run generate-library`

**Note:** Remember to move them back after generation!

### Option D: Admin UI (Build It)

Create a simple admin page at `/app/platform/generate-library/page.tsx`:

```tsx
'use client';

import { useState } from 'react';

export default function GenerateLibrary() {
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(null);

  async function generateLibrary() {
    setStatus('Generating blueprints...');

    const blueprintsRes = await fetch('/api/generate-content-blueprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        languages: ['German', 'Spanish', 'French', 'English'],
        levels: ['A1', 'A2', 'B1', 'B2'],
        count_per_language: 125
      })
    });

    const blueprintsData = await blueprintsRes.json();
    setProgress({ blueprints: blueprintsData.statistics });

    setStatus('Generating content...');
    const generateRes = await fetch('/api/bulk-generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprints: blueprintsData.blueprints,
        batch_size: 5,
        delay_ms: 2000,
        mark_as_public: true
      })
    });

    const generateData = await generateRes.json();
    setProgress({ ...progress, generated: generateData.statistics });
    setStatus('Complete!');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Generate Content Library</h1>
      <button
        onClick={generateLibrary}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Start Generation
      </button>
      <div className="mt-4">
        <p>{status}</p>
        {progress && <pre>{JSON.stringify(progress, null, 2)}</pre>}
      </div>
    </div>
  );
}
```

Then navigate to `http://localhost:3001/platform/generate-library` when logged in as admin.

## 🎯 Recommended Approach

**For now: Option A (Browser Console)**
- Fastest to execute
- No code changes needed
- Just login and paste JavaScript

**For production: Option D (Admin UI)**
- Build a proper UI later
- Add progress tracking
- Better UX for content managers

## 📊 What Will Happen

When you run the generation:

1. **Blueprint Generation (~2-3 min)**
   - AI generates 500 content blueprints
   - Distribution: 40% grammar, 30% reading, 15% speaking, 15% listening
   - 125 items per language (German, Spanish, French, English)

2. **Content Generation (~30-45 min)**
   - Processes blueprints in batches of 5
   - 2-second delay between batches
   - Calls appropriate API for each type (grammar, reading, etc.)
   - Marks all as public automatically

3. **Verification**
   - Check stats: `GET /api/public-library/stats`
   - Browse: `GET /api/public-library?language=German&level=A2`
   - Search: `GET /api/public-library?q=grammar`

## 🔍 Monitoring Progress

While it runs, check progress:

```sql
-- In Supabase SQL Editor
SELECT
  language,
  level,
  task_type,
  COUNT(*) as count,
  SUM(CASE WHEN is_public THEN 1 ELSE 0 END) as public_count
FROM tasks
WHERE language IS NOT NULL
GROUP BY language, level, task_type
ORDER BY language, level, task_type;
```

Or via API:
```bash
curl http://localhost:3001/api/public-library/stats
```

## ⚡ Quick Test (Small Batch)

Test with just 10 items first:

```javascript
// In browser console (logged in as teacher)
const test = await fetch('/api/generate-content-blueprints', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    languages: ['German'],
    levels: ['A1'],
    count_per_language: 10
  })
}).then(r => r.json());

await fetch('/api/bulk-generate-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blueprints: test.blueprints,
    batch_size: 2,
    delay_ms: 1000,
    mark_as_public: true
  })
}).then(r => r.json()).then(console.log);
```

## 📝 Next Steps After Generation

1. **Review Content**
   - `GET /api/content-review?status=pending`
   - Approve/reject exercises

2. **Build Student UI**
   - Content browser
   - Search functionality
   - Random exercise picker

3. **Analytics**
   - Track popular content
   - Monitor completion rates
   - Adjust based on feedback

---

## 🚀 Ready to Execute?

Choose your method above and start generating! The entire system is ready - just needs authentication to run the APIs.

**Recommended:** Use browser console (Option A) - it's the fastest way to get started right now.
