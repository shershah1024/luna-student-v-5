import { useCallback, useEffect, useState, useRef } from 'react';
import { decodeJwt } from 'jose';

interface ConnectionDetails {
  serverUrl: string;
  participantToken: string;
  participantName: string;
  roomName: string;
}

const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;

// Hook to manage LiveKit connection details
// Now supports sending lesson data directly to LiveKit via POST request
// Handles both task_id and test_id for different speaking scenarios
export default function useConnectionDetails(taskId?: string, lessonData?: any, testId?: string) {
  // Use useRef to track if initial fetch has been triggered
  const hasFetchedRef = useRef(false);
  const fetchCountRef = useRef(0);

  console.log('[useConnectionDetails] Hook initialized with:', {
    taskId,
    testId,
    hasLessonData: !!lessonData,
    timestamp: new Date().toISOString()
  });

  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(async () => {
    fetchCountRef.current += 1;
    console.log('[useConnectionDetails] fetchConnectionDetails called, count:', fetchCountRef.current);

    setConnectionDetails(null);
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
      window.location.origin
    );

    console.log('[useConnectionDetails] Connection endpoint URL:', url.toString());

    let data: ConnectionDetails;
    try {
      // Use POST method if lesson data is provided, otherwise fall back to GET
      if (lessonData) {
        console.log('[useConnectionDetails] Making POST request with lesson data...');

        // Build request body for tests vs tasks
        // ONLY send the appropriate ID type, never both
        console.log('[useConnectionDetails] Building request with:', {
          taskId_param: taskId,
          testId_param: testId,
          lessonData_test_id: lessonData?.test_id,
          lessonData_task_id: lessonData?.task_id
        });

        let requestBody: any = {};

        // Only add lesson_data if it exists
        if (lessonData) {
          // Remove any task_id from lessonData for test requests
          const cleanLessonData = { ...lessonData };
          if (cleanLessonData.test_id && cleanLessonData.task_id) {
            delete cleanLessonData.task_id; // Remove task_id if test_id exists
          }
          requestBody.lesson_data = cleanLessonData;
        }

        // Determine which ID to send based on what's available
        if (lessonData?.test_id || testId) {
          // This is a test request - ONLY send test_id
          requestBody.test_id = lessonData?.test_id || testId;
          // DO NOT add task_id
        } else if (lessonData?.task_id || taskId) {
          // This is a task request - ONLY send task_id
          requestBody.task_id = lessonData?.task_id || taskId;
          // DO NOT add test_id
        }

        console.log('[useConnectionDetails] Request body being sent:', {
          task_id: requestBody.task_id || 'NOT_SENT',
          test_id: requestBody.test_id || 'NOT_SENT',
          is_test_request: !!(lessonData?.test_id || testId),
          is_task_request: !!(lessonData?.task_id || taskId),
          has_lesson_data: !!requestBody.lesson_data,
          sending_instructions: !!requestBody.lesson_data?.bot_instruction,
          section_id: requestBody.lesson_data?.section_id
        });

        console.log('[useConnectionDetails] Actual request body:', JSON.stringify(requestBody, null, 2));

        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('[useConnectionDetails] Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('[useConnectionDetails] API Error:', {
            status: res.status,
            statusText: res.statusText,
            body: errorText
          });
          throw new Error(`Connection details API failed: ${res.status} - ${errorText}`);
        }

        const apiResponse = await res.json();
        console.log('[useConnectionDetails] API response received:', {
          hasUrl: !!apiResponse.url,
          hasToken: !!apiResponse.accessToken,
          error: apiResponse.error
        });

        if (apiResponse.error) {
          throw new Error(`API Error: ${apiResponse.error}`);
        }

        data = {
          serverUrl: apiResponse.url,
          participantToken: apiResponse.accessToken,
          participantName: apiResponse.userEmail || "user",
          roomName: "current-session"
        };
      } else {
        // Fallback to GET method for backward compatibility
        console.log('[useConnectionDetails] Making GET request (backward compatibility)...');

        if (taskId) {
          url.searchParams.set('task_id', taskId);
        }

        const res = await fetch(url.toString());
        const apiResponse = await res.json();

        data = {
          serverUrl: apiResponse.url,
          participantToken: apiResponse.accessToken,
          participantName: apiResponse.userEmail || "user",
          roomName: "current-session"
        };
      }

      console.log('[useConnectionDetails] Connection details successfully retrieved');
    } catch (error) {
      console.error('[useConnectionDetails] Error fetching connection details:', error);
      throw new Error('Error fetching connection details!');
    }

    setConnectionDetails(data);
    return data;
  }, [taskId, lessonData, testId]);

  // Removed auto-fetch useEffect to prevent session from starting automatically
  // Connection details are now only fetched when explicitly requested via fetchConnectionDetails

  const isConnectionDetailsExpired = useCallback(() => {
    const token = connectionDetails?.participantToken;
    if (!token) {
      return true;
    }

    const jwtPayload = decodeJwt(token);
    if (!jwtPayload.exp) {
      return true;
    }
    const expiresAt = new Date(jwtPayload.exp - ONE_MINUTE_IN_MILLISECONDS);

    const now = new Date();
    return expiresAt >= now;
  }, [connectionDetails?.participantToken]);

  const existingOrRefreshConnectionDetails = useCallback(async () => {
    if (isConnectionDetailsExpired() || !connectionDetails) {
      return fetchConnectionDetails();
    } else {
      return connectionDetails;
    }
  }, [connectionDetails, fetchConnectionDetails, isConnectionDetailsExpired]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
    existingOrRefreshConnectionDetails,
  };
}
