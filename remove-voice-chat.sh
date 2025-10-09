#!/bin/bash

# Script to remove all voice chat and LiveKit setup
# This includes LiveKit components, hooks, APIs, and dependencies
# Generated on 2025-10-02

set -e

echo "Removing voice chat and LiveKit setup..."

# Remove LiveKit components
rm -rf "components/livekit"
rm -f "components/livekit-ui/index.ts"
rm -f "components/livekit-ui/livekit-select.tsx"
rm -f "components/livekit-ui/livekit-button.tsx"
rm -f "components/livekit-ui/livekit-toggle.tsx"
rm -f "components/livekit-validation.tsx"
rm -f "components/LivekitFillInBlank.tsx"
rm -f "components/LivekitMultipleChoice.tsx"
rm -f "components/DynamicLiveKitRoom.tsx"
rm -f "components/DynamicAudioChatVisualizer.tsx"
rmdir "components/livekit-ui" 2>/dev/null || true

# Remove realtime/voice chat lesson components
rm -f "components/lessons/chatbots/PipelineSpeakingLesson.tsx"
rm -f "components/lessons/chatbots/PipelineSpeakingLessonVAD.tsx"
rm -f "components/lessons/chatbots/AudioChatLessonV2.tsx"
rm -f "components/lessons/chatbots/RealtimeSpeakingLesson.tsx"
rm -f "components/lessons/chatbots/RealtimeSpeakingLessonStyled.tsx"

# Remove voice chat hooks
rm -f "hooks/useRealtimeAPI.ts"

# Remove LiveKit API routes
rm -f "app/(communication)/api/livekit/token/route.ts"
rmdir "app/(communication)/api/livekit" 2>/dev/null || true

# Remove test pages for realtime
rm -f "app/(testing)/test-realtime/page.tsx"
rmdir "app/(testing)/test-realtime" 2>/dev/null || true

# Remove connection details API (if it's livekit specific)
# Commenting out for safety - review if needed
# rm -f "app/(operations)/api/connection-details/route.ts"

# Remove backup page if not needed
rm -f "app/page.backup.tsx"

echo ""
echo "Voice chat and LiveKit files removed!"
echo ""
echo "Next steps:"
echo "1. Uninstall LiveKit dependencies:"
echo "   npm uninstall @livekit/components-react @livekit/components-styles livekit-client livekit-server-sdk"
echo ""
echo "2. Review these files manually:"
echo "   - app/(operations)/api/connection-details/route.ts (might be livekit specific)"
echo "   - app/(learning)/lessons/speaking/[task_id]/page.tsx (may need updates)"
echo ""
echo "3. Clean up any livekit imports in remaining files"
echo "4. Update speaking lesson page to use new voice chat implementation"
