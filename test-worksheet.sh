#!/bin/bash

# Test worksheet generation API

echo "Testing Worksheet Generation API..."
echo "================================="

# Step 1: Generate worksheet content
echo -e "\n1. Generating worksheet content..."

CONTENT_RESPONSE=$(curl -X POST http://localhost:3002/api/worksheets/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "worksheet_type": "vocabulary",
    "topic": "Animals",
    "grade_level": "A1",
    "num_questions": 10,
    "language": "English",
    "special_requirements": "Include domestic and farm animals"
  }' 2>/dev/null)

echo "Response from content generation:"
echo "$CONTENT_RESPONSE" | jq '.'

# Extract task_id and dalle_prompt from response
TASK_ID=$(echo "$CONTENT_RESPONSE" | jq -r '.task_id')
DALLE_PROMPT=$(echo "$CONTENT_RESPONSE" | jq -r '.dalle_prompt')

if [ "$TASK_ID" = "null" ] || [ -z "$TASK_ID" ]; then
  echo "Error: Failed to get task_id from content generation"
  exit 1
fi

echo -e "\nTask ID: $TASK_ID"

# Step 2: Generate worksheet image
echo -e "\n2. Generating worksheet image..."

IMAGE_RESPONSE=$(curl -X POST http://localhost:3002/api/worksheets/generate-image \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": \"$TASK_ID\",
    \"dalle_prompt\": $(echo "$DALLE_PROMPT" | jq -Rs '.')
  }" 2>/dev/null)

echo "Response from image generation:"
echo "$IMAGE_RESPONSE" | jq '.'

# Check if preview_url exists
PREVIEW_URL=$(echo "$IMAGE_RESPONSE" | jq -r '.preview_url')

if [ "$PREVIEW_URL" != "null" ] && [ -n "$PREVIEW_URL" ]; then
  echo -e "\n✅ Worksheet image generated successfully!"
  echo "Preview URL length: ${#PREVIEW_URL} characters"
  
  # Save preview image if it's base64
  if [[ $PREVIEW_URL == data:image* ]]; then
    echo "Saving preview image to worksheet_preview.png..."
    echo "$PREVIEW_URL" | sed 's/data:image\/png;base64,//' | base64 -d > worksheet_preview.png
    echo "Preview saved to worksheet_preview.png"
  fi
else
  echo -e "\n❌ Failed to generate worksheet image"
fi

# Step 3: Test upload to R2 (optional)
echo -e "\n3. Upload to R2 (optional - press Enter to skip, or type 'yes' to upload):"
read -t 5 UPLOAD_CHOICE

if [ "$UPLOAD_CHOICE" = "yes" ]; then
  echo "Uploading to R2..."
  
  UPLOAD_RESPONSE=$(curl -X POST http://localhost:3002/api/worksheets/upload-r2 \
    -H "Content-Type: application/json" \
    -d "{
      \"task_id\": \"$TASK_ID\"
    }" 2>/dev/null)
  
  echo "Response from R2 upload:"
  echo "$UPLOAD_RESPONSE" | jq '.'
  
  PUBLIC_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.public_url')
  if [ "$PUBLIC_URL" != "null" ] && [ -n "$PUBLIC_URL" ]; then
    echo -e "\n✅ Worksheet uploaded successfully!"
    echo "Public URL: $PUBLIC_URL"
  fi
fi

echo -e "\n================================="
echo "Test completed!"
echo "Task ID: $TASK_ID"
echo "You can view the worksheet at: http://localhost:3002/lessons/worksheet/$TASK_ID"