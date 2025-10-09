'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from './alert-toast';
import { AgentControlBar } from './livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from './livekit/chat/chat-entry';
import { ChatMessageView } from './livekit/chat/chat-message-view';
import { MediaTiles } from './livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/livekit-types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  onMessageCountChange?: (count: number) => void;
  onComplete?: () => void;
}

export const SessionView = React.forwardRef<
  HTMLElement,
  SessionViewProps
>(({ appConfig, disabled, sessionStarted, onMessageCountChange, onComplete }, ref) => {
  const { state: agentState } = useVoiceAssistant();
  // Set chatOpen based on supportsChatInput - if chat is not supported, keep it closed
  const [chatOpen, setChatOpen] = useState(appConfig.supportsChatInput);
  const { messages, send } = useChatAndTranscription();
  const room = useRoomContext();
  
  // Notify parent component of message count changes
  useEffect(() => {
    onMessageCountChange?.(messages.length);
  }, [messages.length, onMessageCountChange]);

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  async function handleSendMessage(message: string) {
    await send(message);
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason = 'Could not connect, please try again later.';

          toastAlert({
            title: 'Session ended',
            description: reason,
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput: false, // Hidden for now
    supportsScreenShare: false, // Hidden for now
  };


  return (
    <section
      ref={ref}
      inert={disabled ? "" : undefined}
      className={cn(
        'relative w-full h-full',
        // prevent page scrollbar when !chatOpen due to 'translate-y-20'
        !chatOpen && 'overflow-hidden'
      )}
    >
      {/* Only show chat/transcripts if supportsChatInput is enabled */}
      {supportsChatInput && (
        <ChatMessageView
          className={cn(
            'mx-auto w-full max-w-2xl px-3 transition-[opacity,translate] duration-300 ease-out md:px-0',
            'h-[40vh] overflow-y-auto pt-4 pb-4',
            'absolute bottom-32 left-0 right-0 md:bottom-40 z-20',
            chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
          )}
        >
          <div className="space-y-3 whitespace-pre-wrap">
            <AnimatePresence>
              {messages.map((message: ReceivedChatMessage) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <ChatEntry hideName key={message.id} entry={message} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ChatMessageView>
      )}

      <div className="absolute top-0 right-0 left-0 h-32 md:h-36 z-10 bg-transparent">
        {/* skrim */}
        <div className="absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b from-white to-transparent" />
      </div>

      <MediaTiles chatOpen={chatOpen} />

      <div className="absolute right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12 bg-white">
        <motion.div
          key="control-bar"
          initial={supportsChatInput ? { opacity: 0, translateY: '100%' } : { opacity: 1, translateY: '0%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{
            duration: supportsChatInput ? 0.3 : 0.1,
            delay: sessionStarted ? (supportsChatInput ? 0.2 : 0.1) : 0,
            ease: 'easeOut'
          }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                  Say "Hallo" to start
                </p>
              </motion.div>
            )}

            <AgentControlBar
              controls={{
                microphone: true,
                chat: supportsChatInput,
                leave: true,
                camera: false,
                screenShare: false,
              }}
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
              onDisconnect={onComplete}
            />
          </div>
          {/* skrim */}
          <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
        </motion.div>
      </div>
    </section>
  );
});

SessionView.displayName = 'SessionView';
