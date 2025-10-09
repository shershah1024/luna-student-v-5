'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from './alert-toast';
import { SessionView } from './session-view';
import { Toaster } from './ui/sonner';
import { Welcome } from './welcome';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import type { AppConfig } from '@/lib/livekit-types';
import { cn } from '@/lib/utils';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
  onComplete?: () => void;
  onSessionStart?: () => void;
  onMessageCountChange?: (count: number) => void;
  onRoomReady?: (room: Room) => void;
  lessonData?: {
    chapter_title?: string;
    exercise_objective?: string;
    chapter_theme?: string;
    lesson_name?: string;
    bot_instruction?: string;
    test_id?: string;
    topic?: string;
    level?: string;
    title?: string;
    instructions?: string;
    context?: any;
    section_id?: string;
  };
  taskId?: string;
  testId?: string;
}

export function App({ appConfig, onComplete, onSessionStart, onMessageCountChange, onRoomReady, lessonData, taskId, testId }: AppProps) {
  const room = useMemo(() => {
    const roomInstance = new Room();
    // Pass room instance to parent component when it's ready
    onRoomReady?.(roomInstance);
    return roomInstance;
  }, []);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Auto-start session if configured
  useEffect(() => {
    console.log('[App] Auto-start check:', {
      autoStart: appConfig.autoStart,
      sessionStarted,
      shouldAutoStart: appConfig.autoStart === true && !sessionStarted
    });

    if (appConfig.autoStart === true && !sessionStarted) {
      console.log('[App] Auto-starting session due to autoStart config');
      console.log('[App] Config:', {
        autoStart: appConfig.autoStart,
        showWelcome: appConfig.showWelcome,
        testId,
        taskId,
        hasLessonData: !!lessonData
      });
      setSessionStarted(true);
      onSessionStart?.();
    }
  }, [appConfig.autoStart]); // Re-run when autoStart changes

  // Pass lessonData to useConnectionDetails hook for sending to LiveKit
  // Pass taskId and testId separately so the hook can determine which type of request to make
  const { refreshConnectionDetails, existingOrRefreshConnectionDetails } = useConnectionDetails(taskId, lessonData, testId);

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
      // Don't automatically call onComplete when session ends
      // onComplete should only be called when user explicitly ends the conversation
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    let aborted = false;
    console.log('[App] Connection useEffect running:', {
      sessionStarted,
      roomState: room.state,
      shouldConnect: sessionStarted && room.state === 'disconnected'
    });

    // Only connect when session is explicitly started by user clicking the start button
    if (sessionStarted && room.state === 'disconnected') {
      console.log('[App] Session started - connecting to LiveKit room...');
      console.log('[App] Connection details:', {
        sessionStarted,
        roomState: room.state,
        testId,
        taskId,
        hasLessonData: !!lessonData,
        lessonDataTestId: lessonData?.test_id,
        lessonDataSectionId: lessonData?.section_id
      });

      console.log('[App] Fetching connection details and connecting...');

      // Get fresh connection details for this session
      const getConnectionAndConnect = async () => {
        try {
          const connectionDetails = await existingOrRefreshConnectionDetails();
          console.log('[App] Got connection details, connecting to:', connectionDetails.serverUrl);

          await Promise.all([
            room.localParticipant.setMicrophoneEnabled(true, undefined, {
              preConnectBuffer: appConfig.isPreConnectBufferEnabled,
            }),
            room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
          ]);
        } catch (error: any) {
          if (aborted) {
            // Once the effect has cleaned up after itself, drop any errors
            //
            // These errors are likely caused by this effect rerunning rapidly,
            // resulting in a previous run `disconnect` running in parallel with
            // a current run `connect`
            return;
          }

          toastAlert({
            title: 'There was an error connecting to the agent',
            description: `${error.name}: ${error.message}`,
          });
        }
      };

      getConnectionAndConnect();
    }
    return () => {
      console.log('[App] Connection useEffect cleanup - disconnecting if needed');
      aborted = true;
      // Only disconnect if we're actually connected/connecting
      if (room.state !== 'disconnected') {
        console.log('[App] Disconnecting from room (state was:', room.state, ')');
        room.disconnect();
      }
    };
  }, [room, sessionStarted, appConfig.isPreConnectBufferEnabled]);

  const { startButtonText } = appConfig;

  console.log('[App] Render state:', {
    showWelcome: appConfig.showWelcome !== false && !appConfig.autoStart,
    showWelcomeValue: appConfig.showWelcome,
    autoStartValue: appConfig.autoStart,
    sessionStarted,
  });

  return (
    <div className="relative w-full h-full min-h-[700px]">
      {/* Only render Welcome screen if showWelcome is not false and autoStart is not true */}
      {appConfig.showWelcome !== false && !appConfig.autoStart && (
        <div className="absolute inset-0 z-10">
          <MotionWelcome
            key="welcome"
            startButtonText={startButtonText}
            onStartCall={() => {
              setSessionStarted(true);
              onSessionStart?.();
            }}
            disabled={sessionStarted}
            lessonData={lessonData}
            taskId={taskId}
            testId={testId}
            initial={{ opacity: 1 }}
            animate={{ opacity: sessionStarted ? 0 : 1 }}
            transition={{ duration: 0.5, ease: 'linear', delay: 0 }}
          />
        </div>
      )}

      <div className={cn(
        "absolute inset-0 z-20",
        !sessionStarted && "pointer-events-none"
      )}>
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label="Start Audio" />
          {/* --- */}
          <MotionSessionView
            key="session-view"
            appConfig={appConfig}
            disabled={!sessionStarted}
            sessionStarted={sessionStarted}
            onMessageCountChange={onMessageCountChange}
            onComplete={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: sessionStarted ? 1 : 0 }}
            transition={{
              duration: 0.5,
              ease: 'linear',
              delay: sessionStarted ? 0.5 : 0,
            }}
          />
        </RoomContext.Provider>
      </div>

      <Toaster />
    </div>
  );
}
