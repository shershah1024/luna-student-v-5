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

const AudioPlayer: React.FC<{
  src: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}> = ({ src, onPlayStateChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleAudioEnd);
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioEnd);
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
        );
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      if (!audioRef.current.src) {
        audioRef.current.src = src;
      }
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
      <button
        onClick={togglePlayPause}
        className="h-8 w-8 flex items-center justify-center rounded-full border bg-white hover:bg-gray-100 transition-colors"
      >
        {isPlaying ? (
          <Square className="h-3 w-3 text-gray-700" />
        ) : (
          <Play className="h-3 w-3 text-gray-700" />
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
  const [wordAudios, setWordAudios] = useState<Record<string, string>>({});
  const [loadingWordAudio, setLoadingWordAudio] = useState<
    Record<string, boolean>
  >({});
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

  // Audio conversion now handled by materials backend API
  // No more FFmpeg initialization needed!

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    // Convert audio using materials backend API to WAV format (better for Azure Speech API)
    const audioFile = new File([audioBlob], "recording.webm", {
      type: audioBlob.type || "audio/webm",
    });

    console.log('[PronunciationExercise] Converting WebM to WAV for pronunciation assessment:', {
      originalType: audioBlob.type,
      originalSize: audioBlob.size
    });

    // Use the conversion API but request WAV format instead of OGG
    try {
      const convertedBlob = await convertAudioForPronunciation(audioFile);
      console.log('[PronunciationExercise] Conversion completed:', {
        newType: convertedBlob.type,
        newSize: convertedBlob.size
      });
      return convertedBlob;
    } catch (error) {
      console.error('[PronunciationExercise] Audio conversion failed:', error);
      throw error;
    }
  };

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
        audioBitsPerSecond: 16000,
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
          type: options.mimeType,
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingComplete(true);
        await assessPronunciation(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
      setError("");
    } catch (err) {
      setError(
        "Failed to setup recording. Please check your microphone access.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const resetRecording = () => {
    setRecordingComplete(false);
    setFeedback(null);
    setError("");
    setAudioUrl("");
    audioChunks.current = [];
  };

  const submitRecording = () => {
    setSubmitted(true);
    if (feedback && onComplete) {
      const isGood = feedback.PronScore >= 80;
      onComplete(feedback.PronScore, isGood);
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const savePronunciationScore = async (result: any) => {
    try {
      // Extract word details for database storage
      const wordDetails = result.Words || [];

      const scoreData = {
        word,
        language,
        pronunciation_score: result.PronScore,
        accuracy_score: result.AccuracyScore,
        word_details: wordDetails,
        audio_duration: null, // Could add this if needed
        course: "chat", // Indicate this is from chat system
        exercise_type: "pronunciation",
      };

      const response = await fetch("/api/pronunciation-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scoreData),
      });

      if (!response.ok) {
        console.warn("Failed to save pronunciation score:", response.status);
      } else {
        console.log("Pronunciation score saved successfully");
      }
    } catch (error) {
      console.warn("Error saving pronunciation score:", error);
      // Don't throw error - saving scores shouldn't break the user experience
    }
  };

  const assessPronunciation = async (audioBlob: Blob) => {
    setLoading(true);

    try {
      let processedBlob: Blob;
      if (audioBlob.type.includes("webm")) {
        try {
          processedBlob = await convertToWav(audioBlob);
        } catch (conversionError) {
          console.error(
            "[PronunciationExercise] Conversion failed:",
            conversionError,
          );
          throw new Error("Failed to convert audio to WAV format");
        }
      } else {
        processedBlob = audioBlob;
      }

      const file = new File([processedBlob], `recording-${Date.now()}.wav`, {
        type: "audio/wav",
      });

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("referenceText", word);
      const detailedLanguageCode = getDetailedLanguageCode(language);
      formData.append("language", detailedLanguageCode);

      const response = await fetch("/api/assess-pronunciation", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Assessment failed with status:",
          response.status,
          "Error:",
          errorText,
        );
        throw new Error("Assessment failed");
      }

      const result = await response.json();
      console.log("Raw API response:", result);

      if (!result || typeof result.PronScore !== "number") {
        console.error("Invalid response format:", result);
        throw new Error("Invalid response format");
      }

      setFeedback(result);

      // Save pronunciation score to database
      await savePronunciationScore(result);

      // Call onComplete if provided
      // Only call onComplete if we're in auto-submit mode or if the submit button has been clicked
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

  const getWordAudio = async (word: string) => {
    if (wordAudios[word]) {
      // Play existing audio if already fetched
      const audio = new Audio(wordAudios[word]);
      audio.play();
      return;
    }

    setLoadingWordAudio((prev) => ({ ...prev, [word]: true }));
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
        throw new Error("Failed to generate word audio");
      }

      const { audioUrl } = await response.json();
      setWordAudios((prev) => ({ ...prev, [word]: audioUrl }));

      // Play the audio
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error(`Error getting audio for word '${word}':`, error);
    } finally {
      setLoadingWordAudio((prev) => ({ ...prev, [word]: false }));
    }
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioUrl);
      }
      if (referenceAudioUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(referenceAudioUrl);
      }
      // Clean up any word audio blob URLs
      Object.values(wordAudios).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [audioUrl, referenceAudioUrl, wordAudios]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-yellow-600";
    return "text-red-700";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <Volume2 className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">Pronunciation Practice</h3>
          <div className="text-xl font-bold text-gray-800 mb-2">{word}</div>
          {explanation && (
            <p className="text-sm text-gray-600 mb-3">{explanation}</p>
          )}
        </div>

        {!referenceAudioUrl && !loadingReference && (
          <button
            onClick={getReferencePronunciation}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 bg-white px-2 py-1 rounded border"
          >
            <Volume2 className="h-3 w-3" />
            Listen
          </button>
        )}

        {loadingReference && (
          <span className="text-sm font-medium text-gray-500">
            Loading...
          </span>
        )}
      </div>

      {showReference && referenceAudioUrl && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2 text-gray-700">Reference Pronunciation:</p>
          <AudioPlayer src={referenceAudioUrl} />
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading || loadingReference}
          className={`rounded-full w-12 h-12 flex items-center justify-center transition-all border-2 ${
            isRecording
              ? "bg-red-100 border-red-300 text-red-600 animate-pulse"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
          } ${(loading || loadingReference) && "opacity-50 cursor-not-allowed"}`}
        >
          {isRecording ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            {isRecording
              ? "Recording... Click to stop"
              : audioUrl
                ? "Recording ready"
                : "Click to start recording"}
          </div>
          {recordingComplete && audioUrl && !isRecording && (
            <div className="mt-2">
              <AudioPlayer src={audioUrl} />
            </div>
          )}
        </div>

        {audioUrl && !isRecording && !loading && !submitted && (
          <div className="flex items-center gap-2">
            <button
              onClick={resetRecording}
              className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={submitRecording}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Submit
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center text-gray-600">
            <div className="animate-pulse">Analyzing pronunciation...</div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-800">Your Score</div>
            <div className={`text-lg font-bold ${getScoreColor(feedback.PronScore)}`}>
              {feedback.PronScore.toFixed(1)}%
            </div>
          </div>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all ${getScoreBg(feedback.PronScore)}`}
              style={{ width: `${feedback.PronScore}%` }}
            />
          </div>

          {feedback.Words &&
            feedback.Words.map((wordFeedback: any, i: number) => (
              <div
                key={`feedback-${i}`}
                className="p-3 rounded-lg mb-3 bg-gray-50 border"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium text-gray-800">{wordFeedback.Word}</div>
                  <div className="text-sm font-medium text-gray-600">
                    {wordFeedback.AccuracyScore.toFixed(1)}%
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBg(wordFeedback.AccuracyScore)}`}
                    style={{ width: `${wordFeedback.AccuracyScore}%` }}
                  />
                </div>
              </div>
            ))}

          <div className="mt-4">
            <div className="text-sm font-semibold text-gray-800 mb-2">Feedback</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {feedback.PronScore >= 80
                ? "Excellent pronunciation! Your speech is clear and accurate."
                : feedback.PronScore >= 60
                  ? "Good pronunciation overall. Keep practicing to improve further."
                  : "Continue practicing this word to improve your pronunciation."}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default PronunciationExercise;
