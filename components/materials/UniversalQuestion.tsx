'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, HelpCircle, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Question data types based on materials backend structure
interface QuestionOption {
  text: string;
  is_correct: boolean;
}

interface QuestionData {
  // Multiple Choice / Checkbox
  options?: QuestionOption[];
  // True/False
  correct_answer?: boolean;
  // Fill in blanks / Short answer / Open ended
  answers?: string[];
  // Matching
  pairs?: Array<{ left: string; right: string; }>;
  // Sequence
  sequence?: string[];
}

interface UniversalQuestionProps {
  id: string;
  questionNumber: number;
  questionType: 'multiple_choice' | 'true_false' | 'fill_in_blanks' | 'checkbox' | 'matching' | 'short_answer' | 'sequence' | 'vocabulary' | 'open_ended';
  questionText: string;
  points: number;
  explanation?: string;
  answerData: QuestionData;
  onAnswer: (questionId: string, answer: any, isCorrect: boolean) => void;
  showResult?: boolean;
  disabled?: boolean;
}

export default function UniversalQuestion({
  id,
  questionNumber,
  questionType,
  questionText,
  points,
  explanation,
  answerData,
  onAnswer,
  showResult = false,
  disabled = false
}: UniversalQuestionProps) {
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Question-specific state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<{[key: string]: string}>({});
  const [sequenceOrder, setSequenceOrder] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');

  // Initialize state based on question type
  useEffect(() => {
    switch (questionType) {
      case 'fill_in_blanks':
        // Count blanks in the question text
        const blankCount = (questionText.match(/_+/g) || []).length;
        setFillInAnswers(new Array(blankCount).fill(''));
        break;
      case 'sequence':
        if (answerData.sequence) {
          // Shuffle the sequence for display
          const shuffled = [...answerData.sequence].sort(() => Math.random() - 0.5);
          setSequenceOrder(shuffled);
        }
        break;
    }
  }, [questionType, questionText, answerData]);

  // Check answer based on question type
  const checkAnswer = (answer: any) => {
    let correct = false;

    switch (questionType) {
      case 'multiple_choice':
        if (answerData.options) {
          const selectedOption = answerData.options.find(opt => opt.text === answer);
          correct = selectedOption?.is_correct || false;
        }
        break;

      case 'true_false':
        correct = answer === answerData.correct_answer;
        break;

      case 'checkbox':
        if (answerData.options && Array.isArray(answer)) {
          const correctOptions = answerData.options.filter(opt => opt.is_correct).map(opt => opt.text);
          correct = correctOptions.length === answer.length && 
                    correctOptions.every(opt => answer.includes(opt));
        }
        break;

      case 'fill_in_blanks':
      case 'short_answer':
      case 'vocabulary':
        if (answerData.answers && Array.isArray(answer)) {
          // Check if all blanks are filled correctly (case insensitive)
          correct = answer.every((userAns: string, index: number) => {
            if (!userAns.trim()) return false;
            return answerData.answers!.some(correctAns => 
              correctAns.toLowerCase().trim() === userAns.toLowerCase().trim()
            );
          });
        }
        break;

      case 'matching':
        if (answerData.pairs && typeof answer === 'object') {
          const correctPairs = answerData.pairs;
          correct = correctPairs.every(pair => 
            answer[pair.left] === pair.right
          );
        }
        break;

      case 'sequence':
        if (answerData.sequence && Array.isArray(answer)) {
          correct = JSON.stringify(answer) === JSON.stringify(answerData.sequence);
        }
        break;

      case 'open_ended':
        // Open ended questions need manual grading, for now mark as correct if not empty
        correct = typeof answer === 'string' && answer.trim().length > 10;
        break;
    }

    setIsCorrect(correct);
    setUserAnswer(answer);
    onAnswer(id, answer, correct);
  };

  // Handle answer submission
  const handleSubmit = () => {
    let finalAnswer: any;

    switch (questionType) {
      case 'multiple_choice':
      case 'true_false':
        finalAnswer = userAnswer;
        break;
      case 'checkbox':
        finalAnswer = selectedOptions;
        break;
      case 'fill_in_blanks':
      case 'short_answer':
      case 'vocabulary':
        finalAnswer = fillInAnswers;
        break;
      case 'matching':
        finalAnswer = matchingPairs;
        break;
      case 'sequence':
        finalAnswer = sequenceOrder;
        break;
      case 'open_ended':
        finalAnswer = textAnswer;
        break;
      default:
        finalAnswer = userAnswer;
    }

    checkAnswer(finalAnswer);
    setShowExplanation(true);
  };

  // Render question content based on type
  const renderQuestionContent = () => {
    switch (questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={userAnswer || ''}
            onValueChange={setUserAnswer}
            disabled={disabled || showResult}
            className="space-y-3"
          >
            {answerData.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.text} id={`${id}-option-${index}`} />
                <Label 
                  htmlFor={`${id}-option-${index}`}
                  className={cn(
                    "flex-1 cursor-pointer",
                    showResult && option.is_correct && "text-green-600 font-medium",
                    showResult && userAnswer === option.text && !option.is_correct && "text-red-600"
                  )}
                >
                  {String.fromCharCode(97 + index)}. {option.text}
                </Label>
                {showResult && option.is_correct && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {showResult && userAnswer === option.text && !option.is_correct && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={userAnswer !== null ? String(userAnswer) : ''}
            onValueChange={(value) => setUserAnswer(value === 'true')}
            disabled={disabled || showResult}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${id}-true`} />
              <Label 
                htmlFor={`${id}-true`}
                className={cn(
                  "cursor-pointer",
                  showResult && answerData.correct_answer === true && "text-green-600 font-medium",
                  showResult && userAnswer === true && answerData.correct_answer !== true && "text-red-600"
                )}
              >
                True
              </Label>
              {showResult && answerData.correct_answer === true && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${id}-false`} />
              <Label 
                htmlFor={`${id}-false`}
                className={cn(
                  "cursor-pointer",
                  showResult && answerData.correct_answer === false && "text-green-600 font-medium",
                  showResult && userAnswer === false && answerData.correct_answer !== false && "text-red-600"
                )}
              >
                False
              </Label>
              {showResult && answerData.correct_answer === false && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {answerData.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${id}-checkbox-${index}`}
                  checked={selectedOptions.includes(option.text)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOptions(prev => [...prev, option.text]);
                    } else {
                      setSelectedOptions(prev => prev.filter(opt => opt !== option.text));
                    }
                  }}
                  disabled={disabled || showResult}
                />
                <Label 
                  htmlFor={`${id}-checkbox-${index}`}
                  className={cn(
                    "flex-1 cursor-pointer",
                    showResult && option.is_correct && "text-green-600 font-medium",
                    showResult && selectedOptions.includes(option.text) && !option.is_correct && "text-red-600"
                  )}
                >
                  {String.fromCharCode(97 + index)}. {option.text}
                </Label>
                {showResult && option.is_correct && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {showResult && selectedOptions.includes(option.text) && !option.is_correct && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            ))}
          </div>
        );

      case 'fill_in_blanks':
        // Replace blanks in question text with input fields
        const parts = questionText.split(/(_+)/);
        let blankIndex = 0;
        
        return (
          <div className="space-y-4">
            <div className="text-lg leading-relaxed">
              {parts.map((part, index) => {
                if (part.match(/^_+$/)) {
                  const currentBlankIndex = blankIndex++;
                  return (
                    <Input
                      key={index}
                      className={cn(
                        "inline-block w-24 mx-1 text-center",
                        showResult && isCorrect === false && "border-red-500",
                        showResult && isCorrect === true && "border-green-500"
                      )}
                      value={fillInAnswers[currentBlankIndex] || ''}
                      onChange={(e) => {
                        const newAnswers = [...fillInAnswers];
                        newAnswers[currentBlankIndex] = e.target.value;
                        setFillInAnswers(newAnswers);
                      }}
                      disabled={disabled || showResult}
                      placeholder="___"
                    />
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </div>
            {showResult && answerData.answers && (
              <div className="text-sm text-gray-600">
                <strong>Correct answers:</strong> {answerData.answers.join(', ')}
              </div>
            )}
          </div>
        );

      case 'short_answer':
      case 'vocabulary':
        return (
          <div className="space-y-4">
            <Input
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={disabled || showResult}
              placeholder="Type your answer..."
              className={cn(
                showResult && isCorrect === false && "border-red-500",
                showResult && isCorrect === true && "border-green-500"
              )}
            />
            {showResult && answerData.answers && (
              <div className="text-sm text-gray-600">
                <strong>Possible answers:</strong> {answerData.answers.join(', ')}
              </div>
            )}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">Match the items on the left with the correct items on the right:</p>
            {answerData.pairs?.map((pair, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-1 font-medium">{pair.left}</div>
                <div className="text-gray-500">→</div>
                <div className="flex-1">
                  <select
                    value={matchingPairs[pair.left] || ''}
                    onChange={(e) => setMatchingPairs(prev => ({
                      ...prev,
                      [pair.left]: e.target.value
                    }))}
                    disabled={disabled || showResult}
                    className={cn(
                      "w-full p-2 border rounded",
                      showResult && matchingPairs[pair.left] === pair.right && "border-green-500 bg-green-50",
                      showResult && matchingPairs[pair.left] !== pair.right && "border-red-500 bg-red-50"
                    )}
                  >
                    <option value="">Select...</option>
                    {answerData.pairs?.map((p, i) => (
                      <option key={i} value={p.right}>{p.right}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        );

      case 'sequence':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">Arrange the following items in the correct order:</p>
            <div className="space-y-2">
              {sequenceOrder.map((item, index) => (
                <div key={item} className="flex items-center space-x-2 p-2 border rounded">
                  <span className="font-bold text-gray-500 w-8">{index + 1}.</span>
                  <span className="flex-1">{item}</span>
                  <div className="space-x-1">
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newOrder = [...sequenceOrder];
                          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                          setSequenceOrder(newOrder);
                        }}
                        disabled={disabled || showResult}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'open_ended':
        return (
          <div className="space-y-4">
            <Textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={disabled || showResult}
              placeholder="Write your detailed answer here..."
              className="min-h-[120px]"
              rows={5}
            />
            <div className="text-sm text-gray-500">
              Minimum 10 characters required
            </div>
          </div>
        );

      default:
        return <div>Unsupported question type: {questionType}</div>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Question {questionNumber}
              <Badge variant="secondary" className="text-xs">
                {points} point{points !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {questionType.replace('_', ' ')}
              </Badge>
            </CardTitle>
            <CardDescription>
              {questionText}
            </CardDescription>
          </div>
          {showResult && (
            <div className="flex items-center gap-1">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderQuestionContent()}
        
        {!showResult && (
          <Button 
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}

        {showExplanation && explanation && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Explanation:</strong> {explanation}
            </AlertDescription>
          </Alert>
        )}

        {showResult && (
          <div className={cn(
            "p-3 rounded-lg border",
            isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}>
            <div className="font-medium">
              {isCorrect ? "Correct!" : "Incorrect"}
            </div>
            <div className="text-sm text-gray-600">
              You scored {isCorrect ? points : 0} out of {points} points
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}