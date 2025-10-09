import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Play,
  Volume2,
  XCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDetailedLanguageCode } from "@/app/components/language-codes";
import { assessPronunciationFast } from "@/lib/fast-pronunciation-helper";

export type PronunciationExerciseProps = {
  word: string;
  explanation?: string;
  id?: string;
  language?: string;
  onComplete?: (score: number, isGood: boolean) => void;
};

// Audio player component for reference pronunciation
const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
      <button
        onClick={togglePlayback}
        className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full hover:bg-gray-800"
      >
        {isPlaying ? (
          <Square className="h-3 w-3 text-white" />
        ) : (
          <Play className="h-3 w-3 text-white" />
        )}
      </button>

      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        />
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export const PronunciationExercise = ({
  word,
  explanation,
  id,
  language = "de",
  onComplete,
}: PronunciationExerciseProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string>("");
  const [showReference, setShowReference] = useState<boolean>(false);
  const [loadingReference, setLoadingReference] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 48000, // Even higher bitrate for Azure compatibility
      };

      const recorder = new MediaRecorder(stream, options);

      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: "audio/webm;codecs=opus",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingComplete(true);

        // Automatically assess pronunciation
        await assessPronunciation(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Add a small delay to ensure microphone is ready
      setTimeout(() => {
        recorder.start();
        setIsRecording(true);
        setError("");
      }, 100);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const assessPronunciation = async (audioBlob: Blob) => {
    setLoading(true);

    try {
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: audioBlob.type,
      });

      const detailedLanguageCode = getDetailedLanguageCode(language);
      
      console.log('[FastPronunciationExercise] 🚀 Starting fast assessment...');
      const fastResult = await assessPronunciationFast(file, word, detailedLanguageCode);
      
      // Convert to old format for compatibility
      const result = {
        PronScore: fastResult.pronunciationScore,
        AccuracyScore: fastResult.accuracyScore,
        FluencyScore: fastResult.fluencyScore,
        CompletenessScore: fastResult.completenessScore,
        recognizedText: fastResult.recognizedText,
        words: fastResult.words,
        processingTime: fastResult.processingTime
      };

      console.log('[FastPronunciationExercise] ✅ Assessment completed in', fastResult.processingTime, 'ms');
      setFeedback(result);

      // Call onComplete if provided
      if (submitted && onComplete) {
        const isGood = result.PronScore >= 80;
        onComplete(result.PronScore, isGood);
        setSubmitted(false);
      }
    } catch (err) {
      console.error("Error in pronunciation assessment:", err);
      setError(err instanceof Error ? err.message : "Assessment failed");
    } finally {
      setLoading(false);
    }
  };

  const getReferencePronunciation = async () => {
    if (showReference) return;

    setLoadingReference(true);
    try {
      const response = await fetch("/api/generate-word-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate pronunciation audio");
      }

      const { audioUrl } = await response.json();
      setReferenceAudioUrl(audioUrl);
      setShowReference(true);
    } catch (error) {
      console.error("Error getting reference pronunciation:", error);
      setError("Failed to load reference pronunciation");
    } finally {
      setLoadingReference(false);
    }
  };

  const reset = () => {
    setRecordingComplete(false);
    setFeedback(null);
    setError("");
    setAudioUrl("");
    setSubmitted(false);
    audioChunks.current = [];
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const submitAssessment = () => {
    setSubmitted(true);
    if (feedback && onComplete) {
      const isGood = feedback.PronScore >= 80;
      onComplete(feedback.PronScore, isGood);
    }
  };

  const getFeedbackColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getFeedbackMessage = (score: number) => {
    if (score >= 85) return "Excellent pronunciation!";
    if (score >= 70) return "Good pronunciation!";
    return "Keep practicing!";
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <Mic className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">Pronunciation Practice</h3>
          <p className="text-sm text-gray-600 mb-2">
            Practice pronouncing: <span className="font-medium text-blue-600">"{word}"</span>
          </p>
          {explanation && (
            <p className="text-xs text-gray-500 italic mb-2">{explanation}</p>
          )}
        </div>
      </div>

      {/* Reference Audio */}
      <div className="mb-4">
        <button
          onClick={getReferencePronunciation}
          disabled={loadingReference}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <Volume2 className="h-4 w-4" />
          {loadingReference ? "Loading..." : "Listen to pronunciation"}
        </button>
        
        {showReference && referenceAudioUrl && (
          <div className="mt-2">
            <AudioPlayer audioUrl={referenceAudioUrl} />
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="mb-4">
        {!recordingComplete ? (
          <div className="text-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-blue-600 text-white hover:bg-blue-700",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </button>
            
            {isRecording && (
              <div className="mt-3 text-center">
                <p className="text-sm text-red-600 animate-pulse font-medium">
                  🔴 Recording... Say "{word}" clearly!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={playRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Play className="h-4 w-4" />
              Play Recording
            </button>
            
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Analyzing pronunciation...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircleIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Feedback Display */}
      {feedback && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="mb-3">
              <div className={cn("text-4xl font-bold", getFeedbackColor(feedback.PronScore))}>
                {Math.round(feedback.PronScore)}%
              </div>
              <p className={cn("text-sm font-medium mt-1", getFeedbackColor(feedback.PronScore))}>
                {getFeedbackMessage(feedback.PronScore)}
              </p>
            </div>
            
            {feedback.processingTime && (
              <p className="text-xs text-gray-400">
                ⚡ {feedback.processingTime}ms
              </p>
            )}
          </div>

          {!submitted && onComplete && (
            <button
              onClick={submitAssessment}
              className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PronunciationExercise;