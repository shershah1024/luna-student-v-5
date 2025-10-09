# Assignment Creation API Routes

This document summarizes the request payloads and JSON responses for API routes that create teacher assignments.

## POST `/api/assignment-instructions/chatbot`
- **Purpose:** Stores a conversational chatbot assignment without additional AI generation.
- **Request Body Fields:**
  - `topic` (string, optional) – Conversation theme; defaults to "General conversation" if omitted.
  - `difficulty_level` (string, optional) – CEFR level; defaults to `"A1"` when absent.
  - `language` (string, optional) – Target language; defaults to `"English"`.
  - `assignment_title` (string, optional) – Custom title for the saved assignment.
- **Response JSON:**
  - `task_id` (string|null) – UUID of the saved assignment, or `null` if persistence failed.
  - `lesson_url` (string|null) – Generated lesson link using the task id, otherwise `null`.
  - On failure: `{ "error": string, "details": string }` with HTTP 500.

## POST `/api/assignment-instructions/writing`
- **Purpose:** Generates and optionally saves writing assignments with evaluation rubrics.
- **Request Body Fields:**
  - Required: `topic` (string), `difficulty_level` (string).
  - Optional writing setup: `task_type`, `word_count`, `writing_focus`, `assessment_criteria`, `specific_requirements`, `text_format`, `time_limit`, `language` (defaults to `"German"`).
  - Saving & metadata: `save_assignment` (boolean, default `true`), `assignment_title` (string), `preview` (boolean), `instructions_override` (string).
  - Scoring configuration: `ratingParameters` (array of rubric objects), `rating_parameters_text` (string instructions for rubric generation).
- **Response JSON:**
  - When `preview` is true or `save_assignment` is false: `{ "preview": { "content": object, "rating_parameters": array, "evaluation_schema": object } }`.
  - Otherwise: `{ "task_id": string|null, "lesson_url": string|null }`.
  - Validation errors return `{ "error": "Missing required fields: topic, difficulty_level" }` with HTTP 400; unexpected errors return HTTP 500 with `error` and `details`.

## POST `/api/assignment-instructions/speaking`
- **Purpose:** Creates speaking or pronunciation practice assignments and optional preview data.
- **Request Body Fields:**
  - Required: `topic` (string), `difficulty_level` (string).
  - Optional configuration: `task_type`, `duration`, `speaking_focus`, `evaluation_criteria`, `preparation_time`, `interaction_type`, `visual_support`, `specific_requirements`, `language`.
  - Rubric fields: `ratingParameters` (array), `rating_parameters_text` (string), `assessment_rubric` (string).
  - Control flags: `save_assignment` (boolean, default `true`), `preview` (boolean), `assignment_title` (string), `instructions_override` (string).
- **Response JSON:**
  - Preview mode (`preview` true or `save_assignment` false): `{ "preview": { "content": object, "rating_parameters": array, "evaluation_schema": object } }`.
  - Saved assignment: `{ "task_id": string|null, "lesson_url": string|null }`.
  - Missing required fields return HTTP 400 with an `error` message; other failures return HTTP 500 with `error` and `details`.

## POST `/api/assignment-instructions/debate`
- **Purpose:** Saves debate exercises for writing or speaking modes without AI-generated instructions.
- **Request Body Fields:**
  - Required: `debate_topic` (string), `difficulty_level` (string).
  - Optional: `language` (string, default `"English"`), `additional_instructions` (string), `exercise_mode` (string, default `"writing"`), `save_assignment` (boolean, default `true`), `assignment_title` (string).
- **Response JSON:** `{ "task_id": string|null, "lesson_url": string|null }`.
  - Validation failures return HTTP 400 with an `error`; other errors return HTTP 500 with `error` and `details`.

## POST `/api/assignment-instructions/pronunciation`
- **Purpose:** Generates pronunciation word lists and saves them as assignments.
- **Request Body Fields:**
  - Required: `theme` (string), `difficulty_level` (string), `word_count` (number).
  - Optional: `focus_sounds`, `specific_vocabulary`, `include_definitions`, `pronunciation_focus`, `target_learners`, `language`, `save_assignment` (boolean, default `true`), `assignment_title` (string).
- **Response JSON:** `{ "task_id": string|null, "lesson_url": string|null }`.
  - Validation errors return HTTP 400 with an `error` message; database errors respond with HTTP 500 `{ "error": string }`; unhandled exceptions include an `error` and `details` with HTTP 500.

## POST `/api/assignment-instructions/storytelling`
- **Purpose:** Produces collaborative storytelling assignments with configurable audience details.
- **Request Body Fields:**
  - Required: `story_theme` (string), `age_range` (string), `difficulty_level` (string).
  - Optional: `language` (string, default `"English"`), `evaluation_criteria` (string), `save_assignment` (boolean, default `true`), `assignment_title` (string).
- **Response JSON:** `{ "task_id": string|null, "lesson_url": string|null }`.
  - Missing required data yields HTTP 400 with an `error`; other failures respond with HTTP 500 containing `error` and `details`.

## POST `/api/assignment-instructions/vocabulary-tutor`
- **Purpose:** Generates themed vocabulary lists and saves them as assignments.
- **Request Body Fields (validated):**
  - `topic` (string, required)
  - `language` (string, required)
  - `cefr_level` (enum `A1`–`C2`, required)
  - `number_of_words` (integer 1-100, required)
- **Response JSON:** `{ "task_id": string, "lesson_url": string }`.
  - Validation issues throw HTTP 400 with `{ "error": string }`; database errors return HTTP 500 with `{ "error": string }`.

## POST `/api/assignment-instructions/create-listening-quiz`
- **Purpose:** Creates listening dialogue assignments, optionally generating questions and audio.
- **Request Body Fields:**
  - Required: `topic` (string), `language` (string), `level` (string).
  - Optional customization: `additional_instructions` (string), `assignment_title` (string|null), `generate_questions` (boolean, default `false`), `total_points` (number, default `8`), `question_types` (string array, default `['multiple_choice','true_false','short_answer']`), `generate_audio` (boolean, default `false`), `output_format` (string, default `"opus"`), `audio_duration` (number, default `90` seconds), `speaker_count` (string enum `'1'|'2'|'4'`, default `'2'`).
- **Response JSON:** `{ "task_id": string|null, "lesson_url": string|null, "full_transcript": string, "questions": { "inserted": number, "summary": array } | null, "audio": { "public_url": string, "transcript": string } | null }`.
  - Missing required fields return HTTP 400 with `{ "error": string }`; other exceptions return HTTP 500 with `error` and `details`.

## POST `/api/create-grammar-quiz`
- **Purpose:** Generates grammar quizzes and optionally saves them as assignments.
- **Request Body Fields (validated):**
  - Required: `grammar_topics` (string).
  - Optional with defaults: `language` (string, default `"English"`), `level` (enum `A1`–`C2`, default `"B1"`), `total_points` (integer, default `20`), `question_types` (string array, default `['multiple_choice','fill_in_the_blanks','error_correction']`), `num_questions` (integer), `context_theme` (string), `save_assignment` (boolean, default `false`), `title` (string).
- **Response JSON:** `{ "success": true, "task_id": string|null, "data": quizObject, "metadata": { "generated_at": string, "model": string, "reasoning_effort": string, "actual_total_points": number } }`.
  - Validation problems return HTTP 400 with details; save failures respond with `success: true` plus a `warning`; unexpected errors use HTTP 500 and include `error` and `details`.

## POST `/api/create-reading-quiz`
- **Purpose:** Builds reading comprehension passages with questions and optional assignment persistence.
- **Request Body Fields (validated):**
  - Required: `topic` (string).
  - Optional with defaults: `language` (string, default `"English"`), `level` (enum `A1`–`C2`, default `"A2"`), `text_type` (string, default `"article"`), `word_count` (integer, default `150`), `total_points` (integer, default `20`), `question_types` (string array, default `['multiple_choice','true_false','short_answer']`), `num_questions` (integer), `save_assignment` (boolean, default `false`), `title` (string).
- **Response JSON:** `{ "success": true, "task_id": string|null, "data": quizObject, "metadata": { "generated_at": string, "model": string, "reasoning_effort": string } }`.
  - Validation failures yield HTTP 400 with details; save errors respond with `success: true` plus `warning`; unhandled errors return HTTP 500 with `error` and `details`.

## POST `/api/teacher-assignments/[task_id]/duplicate`
- **Purpose:** Duplicates an existing assignment record (and associated per-type content) for the authenticated teacher.
- **Request Parameters:**
  - Path parameter `task_id` (string, required) – ID of the assignment to copy.
  - Header `x-user-id` (string, optional) – Allows overriding the user id when Clerk auth is unavailable.
  - No request body is required.
- **Response JSON:** `{ "new_id": string, "assignment_type": string }` on success.
  - Missing `task_id` returns HTTP 400 with an `error`; unauthorized access yields HTTP 401; unknown assignments return HTTP 404; other errors respond with HTTP 500 and `{ "error": string }`.

