#!/bin/bash

# Script to remove unnecessary markdown documentation files
# Keeping only essential documentation
# Generated on 2025-10-02

set -e

echo "Removing unnecessary markdown files..."

# Remove all files from scripts/ directory (analysis reports, plans, etc.)
rm -f "scripts/validation_issues.md"
rm -f "scripts/comprehensive-achievements.md"
rm -f "scripts/validation_plan.md"
rm -f "scripts/listening_components_comparison.md"
rm -f "scripts/component_validation_prioritized_fixes.md"
rm -f "scripts/achievement-system-v2-complete.md"
rm -f "scripts/final_validation_report.md"
rm -f "scripts/database_optimization_complete.md"
rm -f "scripts/tracking_plan.md"
rm -f "scripts/aisdk.md"
rm -f "scripts/continue_from_this_point.md"
rm -f "scripts/azure-gpt5-mini-ai-sdk-guide.md"
rm -f "scripts/database_optimization_plan.md"
rm -f "scripts/continue_reviewing_from_here.md"
rm -f "scripts/continue_markdown_gen_from_here.md"
rm -f "scripts/achievement-implementation-strategy.md"
rm -f "scripts/german_exam_test_formats.md"
rm -f "scripts/achievements.md"
rm -f "scripts/sticking_plan.md"
rm -f "scripts/SCALABILITY_ASSESSMENT_POST_OPTIMIZATION_2025.md"
rm -f "scripts/database-schema-vocab.md"
rm -f "scripts/comprehensive_validation_plan.md"
rm -f "scripts/component_validation_checklist.md"
rm -f "scripts/dashboard_improvements_summary.md"
rm -f "scripts/features2add.md"
rm -f "scripts/AI_SDK_V5_TOOL_MIGRATION_GUIDE.md"
rm -f "scripts/user_progress_optimization_implementation.md"
rm -f "scripts/comprehensive_courses_analysis_report.md"
rm -f "scripts/v2_scalability_report.md"
rm -f "scripts/reading_tests_structure.md"
rm -f "scripts/READING_SCORING_STANDARDIZATION.md"
rm -f "scripts/data_structure_audit.md"
rm -f "scripts/comprehensive_german_exam_assessment_report.md"
rm -f "scripts/dashboard_cache_scalability.md"
rm -f "scripts/listening_sections_list.md"
rm -f "scripts/dashboard_cache_optimization.md"
rm -f "scripts/user_progress_dashboard_optimization_assessment.md"
rm -f "scripts/COMPREHENSIVE_READING_TEST_ASSESSMENT_REPORT.md"
rm -f "scripts/first_time_user_detection.md"
rm -f "scripts/streaks_achievements_implementation.md"
rm -f "scripts/complete_german_courses_analysis_report.md"
rm -f "scripts/SCALABILITY_ASSESSMENT_2025.md"
rm -f "scripts/database_optimization_implementation.md"
rm -f "scripts/achievement-system-v2.md"
rm -f "scripts/continue_from_here.md"

# Remove temporary/old root-level markdown files
rm -f "examplan.md"
rm -f "INTEGRATION_TEST.md"
rm -f "generated_images_urls.md"
rm -f "LESSON_API_MIGRATION_PLAN.md"
rm -f "worksheet_implementation.md"
rm -f "ASSIGNMENT_INSTRUCTION_GENERATORS.md"
rm -f "luna_teachezee_schema.md"
rm -f "LESSON_API_ARCHITECTURE.md"

# Remove specific docs that may be outdated
rm -f "docs/react-score-rendering-error-fix.md"

# Remove the scripts directory if empty
rmdir scripts 2>/dev/null || true

echo "Markdown file cleanup complete!"
echo ""
echo "Kept documentation files:"
echo "  - CLERK_SETUP.md (setup guide)"
echo "  - AGENTS.md (agent configuration)"
echo "  - docs/API_DOCUMENTATION.md (API docs)"
echo "  - docs/QUESTION_TYPES_STANDARD.md (standards)"
echo "  - docs/assignment-creation-apis.md (API reference)"
echo "  - docs/teacher-assignment-assistant-guide.md (guide)"
echo "  - .claude/agents/*.md (agent definitions)"
