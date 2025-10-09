'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Headphones, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonAudioPlayerProps {
  audioUrl: string;
  sectionId: string;
  userId: string;
  maxPlays?: number;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onPlayCountUpdate?: (playCount: number) => void;
}

export default function LessonAudioPlayer({
  audioUrl,
  sectionId,
  userId,
  maxPlays = 3,
  onPlayStateChange,
  onPlayCountUpdate,
}: LessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (onPlayStateChange) onPlayStateChange(false);
      
      // Track listening completion
      trackListeningComplete();
    };

    const handlePlay = () => {
      // Increment play count when audio starts playing
      const newCount = playCount + 1;
      setPlayCount(newCount);
      if (onPlayCountUpdate) onPlayCountUpdate(newCount);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
    };
  }, [playCount, onPlayStateChange, onPlayCountUpdate]);

  const trackListeningComplete = async () => {
    try {
      await supabase
        .from('lesson_user_responses')
        .insert({
          user_id: userId,
          section_id: sectionId,
          response_type: 'listening',
          response_text: `Audio completed - Duration: ${Math.floor(duration)}s`,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error tracking listening completion:', error);
    }
  };

  const [showMaxPlaysAlert, setShowMaxPlaysAlert] = useState(false);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check if max plays reached
    if (!isPlaying && playCount >= maxPlays) {
      setShowMaxPlaysAlert(true);
      setTimeout(() => setShowMaxPlaysAlert(false), 3000);
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
    if (onPlayStateChange) onPlayStateChange(!isPlaying);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check if max plays reached
    if (playCount >= maxPlays) {
      setShowMaxPlaysAlert(true);
      setTimeout(() => setShowMaxPlaysAlert(false), 3000);
      return;
    }

    audio.currentTime = 0;
    setProgress(0);

    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    audio.currentTime = (newProgress / 100) * audio.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(utilityClasses.premiumCard, utilityClasses.glassMorphism, "p-8 max-w-2xl mx-auto relative overflow-hidden")}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Premium Header */}
      <div className="text-center mb-8">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <span className={cn(utilityClasses.headingText)}>Audio Player</span>
        </div>
        <p className="text-slate-600">Listen carefully to the audio</p>
      </div>

      {/* Play Count & Status Bar */}
      <div className={cn(
        utilityClasses.premiumCard,
        "p-4 mb-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-800">
                Plays: {playCount} / {maxPlays}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: maxPlays }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index < playCount 
                        ? "bg-blue-600 scale-110" 
                        : "bg-blue-200"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          {playCount >= maxPlays && (
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-xl border border-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Limit reached</span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <motion.button
          onClick={togglePlayPause}
          className={cn(
            "w-20 h-20 rounded-3xl shadow-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden group",
            playCount >= maxPlays && !isPlaying
              ? "bg-slate-300 cursor-not-allowed shadow-slate-200/50"
              : "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-xl hover:scale-105 active:scale-95"
          )}
          disabled={playCount >= maxPlays && !isPlaying}
          whileHover={{ scale: playCount >= maxPlays && !isPlaying ? 1 : 1.05 }}
          whileTap={{ scale: playCount >= maxPlays && !isPlaying ? 1 : 0.95 }}
        >
          {!(playCount >= maxPlays && !isPlaying) && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          )}
          <div className="relative">
            {isPlaying ? 
              <Pause className="h-8 w-8 text-white" /> : 
              <Play className="h-8 w-8 text-white ml-1" />
            }
          </div>
        </motion.button>

        <motion.button
          onClick={restart}
          className={cn(
            "w-14 h-14 rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center",
            playCount >= maxPlays
              ? "bg-slate-200 cursor-not-allowed shadow-slate-200/50"
              : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:scale-105 active:scale-95"
          )}
          disabled={playCount >= maxPlays}
          whileHover={{ scale: playCount >= maxPlays ? 1 : 1.05 }}
          whileTap={{ scale: playCount >= maxPlays ? 1 : 0.95 }}
        >
          <RotateCcw className={cn(
            "h-5 w-5 transition-colors duration-200",
            playCount >= maxPlays ? "text-slate-400" : "text-slate-600"
          )} />
        </motion.button>
      </div>

      {/* Premium Progress Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className={cn(
              "w-full h-3 rounded-full appearance-none cursor-pointer transition-all duration-200",
              "bg-slate-200 hover:bg-slate-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${progress}%, rgb(226 232 240) ${progress}%, rgb(226 232 240) 100%)`,
            }}
          />
          
          {/* Progress indicator dot */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-blue-600 rounded-full shadow-lg transition-all duration-200 pointer-events-none border-2 border-white"
            style={{ left: `calc(${progress}% - 10px)` }}
          />
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">{formatTime(currentTime)}</span>
          </div>
          <span className="font-mono text-sm text-slate-600">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className={cn(
        utilityClasses.premiumCard,
        "p-4 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-200/50 text-center"
      )}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Volume2 className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium text-amber-800">Listening Instructions</span>
        </div>
        <p className="text-amber-700 text-sm">
          Listen carefully to the audio. You can play it up to {maxPlays} times.
        </p>
      </div>

      {/* Max Plays Alert */}
      <AnimatePresence>
        {showMaxPlaysAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute inset-x-4 bottom-4 p-4 bg-red-100/90 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-lg"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Maximum plays reached</p>
                <p className="text-sm text-red-700">You have used all {maxPlays} available plays for this audio.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
