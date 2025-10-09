import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  Mic,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDetailedLanguageCode } from "@/app/components/language-codes";
import { assessPronunciationDirect, convertMaterialsResultToFrontend } from "@/lib/materials-pronunciation";

interface SimplifiedTwoStepPronunciationProps {
  word: string;
  id: string;
  language?: string;
  explanation?: string;
  onComplete?: (score: number, isGood: boolean) => void;
}

const SimpleAudioPlayer: React.FC<{
  src: string;
  word: string;
  label?: string;
}> = ({ src, word, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioRef.current && src) {
      const audio = audioRef.current;
      console.log('[SimpleAudioPlayer] Loading audio:', src);

      const handleCanPlay = () => {
        console.log('[SimpleAudioPlayer] Audio can play:', src);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false);
      };
      const handleLoadedData = () => {
        console.log('[SimpleAudioPlayer] Audio loaded data:', src);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false);
      };
      const handleError = (event) => {
        console.error('[SimpleAudioPlayer] Audio load error:', event, src);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false);
      };
      const handleEnded = () => setIsPlaying(false);
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);

      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("loadeddata", handleLoadedData);
      audio.addEventListener("error", handleError);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);

      audio.src = src;
      audio.load();

      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      return () => {
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("loadeddata", handleLoadedData);
        audio.removeEventListener("error", handleError);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      };
    }
  }, [src]);

  const togglePlayPause = () => {
    if (!audioRef.current || isLoading) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    }
  };

  return (
    <div className={cn(
      "bg-white p-3 rounded-lg border-2 shadow-sm transition-all duration-200",
      isPlaying ? "border-blue-500 bg-blue-50" : "border-black"
    )}>
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className={cn(
            "h-4 w-4 transition-colors",
            isPlaying ? "text-blue-600" : "text-black"
          )} />
          <span className={cn(
            "text-sm font-medium transition-colors",
            isPlaying ? "text-blue-800" : "text-black"
          )}>{label}</span>
          {isPlaying && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              ♪ Playing
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-full border-2 transition-all disabled:opacity-50",
            isPlaying 
              ? "border-blue-500 bg-blue-100 hover:bg-blue-200 text-blue-700" 
              : "border-black bg-[#f5f2e8] hover:bg-gray-100 text-black"
          )}
        >
          {isLoading ? (
            <div className={cn(
              "h-3 w-3 border-2 border-t-transparent rounded-full animate-spin",
              isPlaying ? "border-blue-700" : "border-black"
            )} />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <div className={cn(
          "flex-1 h-2 bg-gray-200 rounded-full overflow-hidden border transition-colors",
          isPlaying ? "border-blue-500" : "border-black"
        )}>
          <div
            className={cn(
              "h-full transition-all",
              isPlaying ? "bg-blue-500" : "bg-black"
            )}
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <span className={cn(
          "text-xs font-medium min-w-[40px] transition-colors",
          isPlaying ? "text-blue-700" : "text-black"
        )}>
          {isLoading ? "..." : `${Math.floor(currentTime)}s`}
        </span>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export const SimplifiedTwoStepPronunciation: React.FC<
  SimplifiedTwoStepPronunciationProps
> = ({ word, id, language = "de", explanation, onComplete }) => {
  console.log('[SimplifiedTwoStepPronunciation] Component initialized with props:', {
    word,
    wordLength: word?.length,
    id,
    language,
    explanation
  });
  
  const [step, setStep] = useState<"audio" | "practice">("audio");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [currentWord, setCurrentWord] = useState<string>("");

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [userAudioUrl, setUserAudioUrl] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Add debouncing to prevent multiple rapid API calls
  useEffect(() => {
    console.log('[SimplifiedTwoStepPronunciation] useEffect triggered - word changed to:', word);
    
    // Clear any existing timeout
    const timeoutId = setTimeout(() => {
      if (word && word.trim().length > 0) {
        const trimmedWord = word.trim();
        // Check if we're already loading this word or have already loaded it
        if (trimmedWord === currentWord && (loadingAudio || audioUrl)) {
          console.log('[SimplifiedTwoStepPronunciation] Skipping duplicate request for same word:', trimmedWord);
          return;
        }
        
        console.log('[SimplifiedTwoStepPronunciation] Debounced generateAudio call for word:', trimmedWord);
        setCurrentWord(trimmedWord);
        generateAudio();
      } else {
        console.warn('[SimplifiedTwoStepPronunciation] Skipping generateAudio - invalid word:', word);
      }
    }, 300); // 300ms debounce delay
    
    return () => {
      console.log('[SimplifiedTwoStepPronunciation] Clearing timeout for word:', word);
      clearTimeout(timeoutId);
    };
  }, [word, language]);

  // Audio conversion now handled by Supabase Edge Function
  // No more FFmpeg initialization needed!

  const generateAudio = async () => {
    console.log('[SimplifiedTwoStepPronunciation] generateAudio called with word:', {
      word,
      wordLength: word?.length,
      trimmedWord: word?.trim(),
      trimmedLength: word?.trim()?.length
    });
    
    if (!word || word.trim().length === 0) {
      console.warn("Cannot generate audio: word is empty");
      setLoadingAudio(false);
      return;
    }
    
    setLoadingAudio(true);
    try {
      const response = await fetch("/api/generate-word-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word.trim(),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const { audioUrl } = await response.json();
      console.log('[SimplifiedTwoStepPronunciation] Received audio URL:', audioUrl);
      
      // Test if the URL is accessible
      if (audioUrl && audioUrl.startsWith('http')) {
        fetch(audioUrl, { method: 'HEAD' })
          .then(response => {
            console.log('[SimplifiedTwoStepPronunciation] Audio URL accessibility check:', {
              url: audioUrl,
              status: response.status,
              accessible: response.ok
            });
          })
          .catch(error => {
            console.error('[SimplifiedTwoStepPronunciation] Audio URL not accessible:', error);
          });
      }
      
      setAudioUrl(audioUrl);
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setLoadingAudio(false);
    }
  };

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    // Convert audio using materials backend API to WAV format (better for Azure Speech API)
    const audioFile = new File([audioBlob], "recording.webm", {
      type: audioBlob.type || "audio/webm",
    });

    console.log('[SimplifiedTwoStepPronunciation] Converting WebM to WAV for pronunciation assessment:', {
      originalType: audioBlob.type,
      originalSize: audioBlob.size
    });

    // Use the conversion API but request WAV format instead of OGG
    try {
      const convertedBlob = await convertAudioForPronunciation(audioFile);
      console.log('[SimplifiedTwoStepPronunciation] Conversion completed:', {
        newType: convertedBlob.type,
        newSize: convertedBlob.size
      });
      return convertedBlob;
    } catch (error) {
      console.error('[SimplifiedTwoStepPronunciation] Audio conversion failed:', error);
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
        setUserAudioUrl(url);
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
    setUserAudioUrl("");
    setSubmitted(false);
    audioChunks.current = [];
  };

  const submitRecording = () => {
    setSubmitted(true);
    if (feedback && onComplete) {
      const isGood = feedback.PronScore >= 80;
      onComplete(feedback.PronScore, isGood);
    }
  };

  const savePronunciationScore = async (result: any, audioUrl: string) => {
    try {
      const wordDetails = result.Words || [];

      const scoreData = {
        word,
        language,
        pronunciation_score: result.PronScore,
        accuracy_score: result.AccuracyScore,
        word_details: wordDetails,
        user_audio_url: audioUrl,
        audio_duration: null, // Could add this if needed
        course: "vocabulary-tutor",
        exercise_type: "pronunciation",
        task_id: id || `pronunciation_${word}_${Date.now()}`,
        attempt_id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      }
    } catch (error) {
      console.warn("Error saving pronunciation score:", error);
    }
  };

  const assessPronunciation = async (audioBlob: Blob) => {
    setLoading(true);

    try {
      let processedBlob: Blob;
      let fileName: string;
      let mimeType: string;
      
      if (audioBlob.type.includes("webm")) {
        console.log('[SimplifiedTwoStepPronunciation] Converting WebM audio for Azure Speech API');
        processedBlob = await convertToWav(audioBlob);
        fileName = `recording-${Date.now()}.wav`;
        mimeType = "audio/wav";
      } else {
        processedBlob = audioBlob;
        fileName = `recording-${Date.now()}.wav`;
        mimeType = audioBlob.type || "audio/wav";
      }

      const file = new File([processedBlob], fileName, {
        type: mimeType,
      });
      
      console.log('[SimplifiedTwoStepPronunciation] Prepared audio file for assessment:', {
        fileName,
        mimeType,
        size: file.size,
        blobSize: processedBlob.size
      });

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("referenceText", word);
      formData.append("language", "de-DE");

      const response = await fetch("/api/assess-pronunciation", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Assessment failed");
      }

      const result = await response.json();
      setFeedback(result);

      // Save pronunciation score with user audio URL to database
      await savePronunciationScore(result, userAudioUrl);

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

  const moveToStep2 = () => {
    setStep("practice");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-yellow-600";
    return "text-red-700";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-[#f5f2e8] p-6 rounded-xl border-2 border-black">
      {step === "audio" && (
        <div>
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold text-black">
                🔊 Listen to the pronunciation
              </h3>
            </div>
            <p className="text-gray-700 mb-1">
              First, listen to how "<strong>{word}</strong>" is pronounced:
            </p>
          </div>

          {loadingAudio ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-black font-medium">
                Generating audio...
              </span>
            </div>
          ) : audioUrl ? (
            <>
              <SimpleAudioPlayer
                src={audioUrl}
                word={word}
                label={`Pronunciation of "${word}"`}
              />

              {explanation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">💡</span>
                    </div>
                    <span className="text-blue-800 font-medium text-sm">
                      Pronunciation Tip
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 ml-8">{explanation}</p>
                </div>
              )}

              <button
                onClick={moveToStep2}
                className="mt-4 w-full bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-base font-bold transition-all border-2 border-black flex items-center justify-center gap-2"
              >
                <Mic className="h-5 w-5" />
                Now try pronouncing it yourself!
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-red-600">
              Failed to load audio. Please try again.
            </div>
          )}
        </div>
      )}

      {step === "practice" && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-black mb-2">
              🎤 Your turn to practice
            </h3>
            <p className="text-gray-700">
              Now record yourself saying "<strong>{word}</strong>":
            </p>

            {/* Show original audio for comparison */}
            {audioUrl && (
              <div className="mt-3">
                <SimpleAudioPlayer
                  src={audioUrl}
                  word={word}
                  label={`Reference: "${word}"`}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              className={cn(
                "rounded-full w-16 h-16 flex items-center justify-center transition-all border-2 border-black shadow-md",
                isRecording
                  ? "bg-red-100 text-red-500 hover:bg-red-200 animate-pulse"
                  : "bg-white text-black hover:bg-gray-100 hover:scale-105 hover:shadow-lg",
                !isRecording &&
                  !loading &&
                  !userAudioUrl &&
                  "animate-[pulse_2s_infinite_ease-in-out] hover:animate-none",
                loading && "opacity-50 cursor-not-allowed",
              )}
            >
              {isRecording ? (
                <Square className="h-7 w-7" />
              ) : (
                <Mic
                  className={cn(
                    "h-7 w-7",
                    !userAudioUrl &&
                      !loading &&
                      !isRecording &&
                      "animate-[bounce_1s_infinite_ease-in-out_alternate]",
                  )}
                />
              )}
            </button>

            <div className="flex-1">
              <div className="text-base font-medium">
                {isRecording
                  ? "Recording... Click the button to stop"
                  : userAudioUrl
                    ? "Ready to submit your pronunciation"
                    : "Click the mic button to start recording"}
              </div>
              {recordingComplete && userAudioUrl && !isRecording && (
                <div className="mt-2">
                  <SimpleAudioPlayer
                    src={userAudioUrl}
                    word={word}
                    label="Your pronunciation"
                  />
                </div>
              )}
            </div>

            {userAudioUrl && !isRecording && !loading && !submitted && (
              <div className="flex items-center gap-3">
                <button
                  onClick={resetRecording}
                  className="rounded-full w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-100 transition-all border-2 border-black hover:scale-105 shadow-md"
                >
                  <RotateCcw className="h-5 w-5 text-black" />
                </button>
                <button
                  onClick={submitRecording}
                  className="bg-black hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-base font-bold transition-all border-2 border-black hover:scale-105 shadow-md"
                >
                  Submit
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse text-black font-bold text-lg">
                Analyzing pronunciation...
              </div>
            </div>
          )}

          {feedback && (
            <div className="mt-4 pt-4 border-t-2 border-black">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-black text-lg">
                  Your Pronunciation Score
                </div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getScoreColor(feedback.PronScore),
                  )}
                >
                  {feedback.PronScore.toFixed(1)}%
                </div>
              </div>

              <div className="h-4 bg-white rounded-full overflow-hidden mb-4 border-2 border-black">
                <div
                  className={cn(
                    "h-full transition-all",
                    getScoreBg(feedback.PronScore),
                  )}
                  style={{ width: `${feedback.PronScore}%` }}
                />
              </div>

              <div className="mt-4">
                <div className="text-base font-bold text-black mb-2">
                  Feedback
                </div>
                <p className="text-base bg-white p-4 rounded-lg border-2 border-black leading-relaxed">
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
            <div className="bg-white border-2 border-red-500 text-black p-4 rounded-lg mt-4 text-base font-medium">
              {error}
            </div>
          )}

          <button
            onClick={() => setStep("audio")}
            className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Listen to pronunciation again
          </button>
        </div>
      )}
    </div>
  );
};

export default SimplifiedTwoStepPronunciation;
