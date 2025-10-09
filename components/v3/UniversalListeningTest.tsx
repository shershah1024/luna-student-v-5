'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Headphones, Play, Pause, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface ListeningQuestion {
  id: string;
  question_code: string;
  question_number: number;
  question_type: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  points: number;
}

interface ListeningSection {
  id: string;
  section_code: string;
  section_number: number;
  title: string;
  instructions: string;
  duration_minutes: number;
  max_score: number;
  section_order: number;
  audio_url: string;
  audio_duration_seconds: number;
  playback_limit: number;
  section_type: string;
  questions: ListeningQuestion[];
}

interface UniversalListeningTestProps {
  examCode: string;
  userId?: string;
  onComplete?: (results: any) => void;
  onSectionComplete?: (sectionId: string, responses: any) => void;
}

export default function UniversalListeningTest({ 
  examCode, 
  userId = 'test_user', 
  onComplete,
  onSectionComplete 
}: UniversalListeningTestProps) {
  const [sections, setSections] = useState<ListeningSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [sectionStartTime, setSectionStartTime] = useState(Date.now());
  
  // Audio controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchListeningSections();
  }, [examCode]);

  useEffect(() => {
    // Reset audio when section changes
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayCount(0);
  }, [currentSectionIndex]);

  const fetchListeningSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v3/exams/${examCode}/listening`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch listening sections');
      }

      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching listening sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getCurrentSection = () => sections[currentSectionIndex];
  
  const getSectionResponses = (section: ListeningSection) => {
    return section.questions.filter(q => responses[q.id]).length;
  };

  const getTotalSectionQuestions = (section: ListeningSection) => {
    return section.questions.length;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentSection = getCurrentSection();
    if (playCount >= currentSection.playback_limit) {
      return; // Reached playback limit
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      if (currentTime === 0) {
        setPlayCount(prev => prev + 1);
      }
    }
  };

  const resetAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextSection = async () => {
    const currentSection = getCurrentSection();
    if (currentSection && onSectionComplete) {
      const sectionResponses = currentSection.questions.map(q => ({
        question_id: q.id,
        response: responses[q.id] || '',
        time_spent: Math.floor((Date.now() - sectionStartTime) / 1000)
      }));
      onSectionComplete(currentSection.id, sectionResponses);
    }

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setSectionStartTime(Date.now());
    } else {
      await submitTest();
    }
  };

  const submitTest = async () => {
    const allResponses = sections.flatMap(section => 
      section.questions.map(question => ({
        question_id: question.id,
        response: responses[question.id] || '',
        time_spent: Math.floor((Date.now() - startTime) / 1000)
      }))
    );

    try {
      const response = await fetch(`/api/v3/exams/${examCode}/listening/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          exam_code: examCode,
          responses: allResponses,
          total_time_spent: Math.floor((Date.now() - startTime) / 1000)
        })
      });

      if (!response.ok) throw new Error('Failed to submit test');
      
      const scoreResults = await response.json();
      setResults(scoreResults);
      setSubmitted(true);
      onComplete?.(scoreResults);
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  const renderQuestion = (question: ListeningQuestion) => {
    const isAnswered = !!responses[question.id];
    const userAnswer = responses[question.id];
    const isCorrect = submitted && userAnswer === question.correct_option;
    const isIncorrect = submitted && userAnswer && userAnswer !== question.correct_option;

    return (
      <Card key={question.id} className={`mb-4 ${isAnswered ? 'border-blue-300' : ''} ${submitted ? (isCorrect ? 'border-green-300 bg-green-50' : isIncorrect ? 'border-red-300 bg-red-50' : '') : ''}`}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-600 min-w-0">
              {question.question_number}.
            </span>
            <div className="flex-1">
              <p className="font-medium mb-3">{question.question_text}</p>
              
              {/* Multiple choice options */}
              <div className="space-y-2">
                {['a', 'b', 'c'].map(option => {
                  const optionText = question[`option_${option}` as keyof ListeningQuestion] as string;
                  const isSelected = userAnswer === option;
                  const isCorrectOption = question.correct_option === option;
                  
                  return (
                    <label 
                      key={option}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        submitted 
                          ? isCorrectOption 
                            ? 'border-green-500 bg-green-100' 
                            : isSelected && !isCorrectOption 
                              ? 'border-red-500 bg-red-100' 
                              : 'border-gray-200'
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={isSelected}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        disabled={submitted}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="font-medium text-gray-700">
                        {option.toUpperCase()})
                      </span>
                      <span className="flex-1">{optionText}</span>
                      {submitted && isCorrectOption && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {submitted && isSelected && !isCorrectOption && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading listening test...</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">No listening sections found for this exam</p>
      </div>
    );
  }

  const currentSection = getCurrentSection();
  if (!currentSection) return null;

  if (submitted && results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Listening Test Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{results.score}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{results.correct}/{results.total}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  <Clock className="h-5 w-5 inline mr-1" />
                  {Math.floor((Date.now() - startTime) / 1000)}s
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Section Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Headphones className="h-6 w-6 text-blue-600" />
            {currentSection.title}
            <span className="text-sm text-gray-500">
              ({currentSectionIndex + 1} of {sections.length})
            </span>
          </CardTitle>
          <p className="text-gray-600">{currentSection.instructions}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Duration: {currentSection.duration_minutes} min</span>
            <span>Max Score: {currentSection.max_score} points</span>
            <span>Progress: {getSectionResponses(currentSection)}/{getTotalSectionQuestions(currentSection)}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Audio Player */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={togglePlay}
              disabled={playCount >= currentSection.playback_limit}
              variant={isPlaying ? "destructive" : "default"}
              size="lg"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={resetAudio}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>

            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                {formatTime(currentTime)} / {formatTime(currentSection.audio_duration_seconds)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(currentTime / currentSection.audio_duration_seconds) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Plays left: {currentSection.playback_limit - playCount}
            </div>
          </div>

          <audio
            ref={audioRef}
            src={currentSection.audio_url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleAudioEnded}
            preload="metadata"
          />

          {playCount >= currentSection.playback_limit && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mt-3">
              <p className="text-yellow-800 text-sm">
                ⚠️ You have reached the maximum number of plays for this audio.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {currentSection.questions.map(question => renderQuestion(question))}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Section {currentSectionIndex + 1} of {sections.length} • 
          {getSectionResponses(currentSection)}/{getTotalSectionQuestions(currentSection)} questions answered
        </div>
        
        <Button 
          onClick={nextSection}
          disabled={getSectionResponses(currentSection) === 0}
          className="px-8 py-3"
        >
          {currentSectionIndex < sections.length - 1 ? 'Next Section' : 'Submit Test'}
          {currentSectionIndex < sections.length - 1 && (
            <span className="ml-2">→</span>
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${((currentSectionIndex + (getSectionResponses(currentSection) / getTotalSectionQuestions(currentSection))) / sections.length) * 100}%` 
          }}
        ></div>
      </div>
    </div>
  );
}