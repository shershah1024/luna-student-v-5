/**
 * Unified Reading Test Scoring System
 * 
 * This module provides standardized scoring logic that works with all existing
 * reading test data formats across all courses without requiring database changes.
 * 
 * Supports:
 * - True/False questions (Richtig/Falsch)
 * - Simple multiple choice questions
 * - Advanced multiple choice with detailed options
 * - All course variations (Goethe A1-C1, TELC A1-B2)
 */

// Base interfaces for all question types
export interface BaseQuestion {
  question_number: number;
  is_example?: boolean;
  explanation?: string;
}

// Pattern A: True/False Questions (Goethe A1, A2 Section 1, B1 Section 1)
export interface TrueFalseQuestion extends BaseQuestion {
  statement_text: string;
  correct_answer: "Richtig" | "Falsch";
}

// Pattern B: Simple Multiple Choice (Goethe A2 Section 2)
export interface SimpleMultipleChoiceQuestion extends BaseQuestion {
  scenario_text: string;
  options: string[];
  correct_answer: string;
}

// Pattern C: Advanced Multiple Choice (Goethe B2, C1)
export interface AdvancedOption {
  text: string;
  is_correct: boolean;
  explanation: string;
  option_letter: string;
}

export interface AdvancedMultipleChoiceQuestion extends BaseQuestion {
  question_text: string;
  options: AdvancedOption[];
  correct_answer_letter: string;
}

// Pattern D: Headline Matching (TELC B1, B2 Section 1)
export interface HeadlineMatchingText extends BaseQuestion {
  text_number: number;
  text_content: string;
  correct_headline: string;
  is_example?: boolean;
  explanation?: string;
}

// Union type for all question types
export type ReadingQuestion = 
  | TrueFalseQuestion 
  | SimpleMultipleChoiceQuestion 
  | AdvancedMultipleChoiceQuestion
  | HeadlineMatchingText;

// Validation result interface
export interface ValidationResult {
  question_number: number;
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

// Score result interface
export interface ScoreResult {
  score: number;
  total_score: number;
  percentage: number;
  validation_results: ValidationResult[];
}

/**
 * Type guards to identify question types
 */
export function isTrueFalseQuestion(question: any): question is TrueFalseQuestion {
  return question.statement_text !== undefined && 
         (question.correct_answer === "Richtig" || question.correct_answer === "Falsch" ||
          question.correct_answer === "richtig" || question.correct_answer === "falsch");
}

export function isSimpleMultipleChoiceQuestion(question: any): question is SimpleMultipleChoiceQuestion {
  return question.scenario_text !== undefined && 
         question.options !== undefined && 
         Array.isArray(question.options) &&
         typeof question.options[0] === 'string' &&
         question.correct_answer !== undefined;
}

// TELC B2 format: has question_text, option_a/b/c fields, and correct_answer as letter
export function isTelcB2MultipleChoiceQuestion(question: any): boolean {
  return question.question_text !== undefined &&
         question.option_a !== undefined &&
         question.option_b !== undefined &&
         question.correct_answer !== undefined &&
         (question.correct_answer === 'a' || question.correct_answer === 'b' || question.correct_answer === 'c');
}

// Goethe B2 Section 3 format: has question_text, options array, and correct_answer as letter
export function isGoetheB2Section3Question(question: any): boolean {
  return question.question_text !== undefined &&
         question.options !== undefined &&
         Array.isArray(question.options) &&
         question.correct_answer !== undefined &&
         typeof question.correct_answer === 'string';
}

// Goethe B2 Section 4 format: has statement_text and correct_opinion_letter
export function isGoetheB2Section4Question(question: any): boolean {
  return question.statement_text !== undefined &&
         question.correct_opinion_letter !== undefined &&
         typeof question.correct_opinion_letter === 'string';
}

export function isAdvancedMultipleChoiceQuestion(question: any): question is AdvancedMultipleChoiceQuestion {
  return question.question_text !== undefined && 
         question.options !== undefined && 
         Array.isArray(question.options) &&
         question.options[0]?.text !== undefined &&
         question.correct_answer_letter !== undefined;
}

// TELC A1 Section 2 format: has scenario_text and options with objects
export function isScenarioBasedQuestion(question: any): boolean {
  return question.scenario_text !== undefined && 
         question.options !== undefined && 
         Array.isArray(question.options) &&
         typeof question.options[0] === 'object' &&
         question.options[0]?.option_letter !== undefined &&
         question.correct_answer !== undefined;
}

export function isHeadlineMatchingText(text: any): text is HeadlineMatchingText {
  return text.text_number !== undefined && 
         text.text_content !== undefined && 
         text.correct_headline !== undefined;
}

/**
 * Extract correct answer from any question type
 */
export function getCorrectAnswer(question: ReadingQuestion): string {
  if (isTrueFalseQuestion(question)) {
    // Normalize the correct answer to lowercase for consistency
    return question.correct_answer.toLowerCase();
  } else if (isSimpleMultipleChoiceQuestion(question)) {
    return question.correct_answer;
  } else if (isScenarioBasedQuestion(question)) {
    // For scenario-based questions, return the option letter
    return question.correct_answer;
  } else if (isTelcB2MultipleChoiceQuestion(question)) {
    // For TELC B2 questions, return the correct answer letter
    return (question as any).correct_answer;
  } else if (isGoetheB2Section3Question(question)) {
    // For Goethe B2 Section 3 questions, return the correct answer letter
    return (question as any).correct_answer;
  } else if (isGoetheB2Section4Question(question)) {
    // For Goethe B2 Section 4 questions, return the correct opinion letter
    return (question as any).correct_opinion_letter;
  } else if (isAdvancedMultipleChoiceQuestion(question)) {
    // For advanced questions, return the text of the correct option
    const correctOption = question.options.find(
      opt => opt.option_letter === question.correct_answer_letter
    );
    return correctOption?.text || question.correct_answer_letter;
  } else if (isHeadlineMatchingText(question)) {
    return question.correct_headline;
  }
  return "";
}

/**
 * Get explanation for a question
 */
export function getExplanation(question: ReadingQuestion, userAnswer?: string): string {
  if (isTrueFalseQuestion(question) || isSimpleMultipleChoiceQuestion(question)) {
    return question.explanation || "";
  } else if (isTelcB2MultipleChoiceQuestion(question)) {
    // TELC B2 questions have explanation directly on the question
    return (question as any).explanation || "";
  } else if (isGoetheB2Section3Question(question)) {
    // Goethe B2 Section 3 questions have explanation directly on the question
    return (question as any).explanation || "";
  } else if (isGoetheB2Section4Question(question)) {
    // Goethe B2 Section 4 questions have explanation directly on the question
    return (question as any).explanation || "";
  } else if (isScenarioBasedQuestion(question)) {
    // For scenario-based questions (TELC A1 Section 2), get explanation from the selected option
    if (userAnswer) {
      const userOption = (question as any).options.find((opt: any) => 
        opt.option_letter === userAnswer
      );
      if (userOption?.explanation) {
        return userOption.explanation;
      }
    }
    
    // Fallback to correct answer explanation
    const correctOption = (question as any).options.find(
      (opt: any) => opt.option_letter === question.correct_answer
    );
    return correctOption?.explanation || question.explanation || "";
  } else if (isAdvancedMultipleChoiceQuestion(question)) {
    // For advanced questions, try to find explanation for the user's answer
    if (userAnswer) {
      const userOption = question.options.find(opt => 
        opt.text === userAnswer || opt.option_letter === userAnswer
      );
      if (userOption?.explanation) {
        return userOption.explanation;
      }
    }
    
    // Fallback to correct answer explanation
    const correctOption = question.options.find(
      opt => opt.option_letter === question.correct_answer_letter
    );
    return correctOption?.explanation || question.explanation || "";
  } else if (isHeadlineMatchingText(question)) {
    return question.explanation || "";
  }
  return "";
}

/**
 * Check if user answer is correct
 */
export function isAnswerCorrect(question: ReadingQuestion, userAnswer: string): boolean {
  if (isTrueFalseQuestion(question)) {
    // Handle case-insensitive comparison for true/false questions
    return userAnswer.toLowerCase() === question.correct_answer.toLowerCase();
  } else if (isSimpleMultipleChoiceQuestion(question)) {
    return userAnswer === question.correct_answer;
  } else if (isScenarioBasedQuestion(question)) {
    // For scenario-based questions, check by option letter
    return userAnswer === question.correct_answer;
  } else if (isTelcB2MultipleChoiceQuestion(question)) {
    // For TELC B2 questions, compare with the correct answer letter
    return userAnswer === (question as any).correct_answer;
  } else if (isGoetheB2Section3Question(question)) {
    // For Goethe B2 Section 3 questions, compare with the correct answer letter
    return userAnswer === (question as any).correct_answer;
  } else if (isGoetheB2Section4Question(question)) {
    // For Goethe B2 Section 4 questions, compare with the correct opinion letter
    return userAnswer === (question as any).correct_opinion_letter;
  } else if (isAdvancedMultipleChoiceQuestion(question)) {
    // Check both by letter and by text
    return userAnswer === question.correct_answer_letter ||
           userAnswer === getCorrectAnswer(question);
  } else if (isHeadlineMatchingText(question)) {
    return userAnswer === question.correct_headline;
  }
  return false;
}

/**
 * Extract all questions from any data structure
 */
export function extractAllQuestions(data: any): ReadingQuestion[] {
  const questions: ReadingQuestion[] = [];
  
  console.log('[SCORING] Extracting questions from data:', {
    hasQuestions: !!data.questions,
    hasTextContents: !!data.text_contents,
    hasTexts: !!data.texts,
    hasTextContent: !!data.text_content,
    dataKeys: Object.keys(data)
  });
  
  // Handle different data structures
  if (data.questions && Array.isArray(data.questions)) {
    // Direct questions array (most common)
    console.log('[SCORING] Found direct questions array:', data.questions.length);
    questions.push(...data.questions);
  } else if (data.text_contents && Array.isArray(data.text_contents)) {
    // Text contents with nested questions (Goethe A1 pattern)
    console.log('[SCORING] Found text_contents array:', data.text_contents.length);
    data.text_contents.forEach((content: any) => {
      if (content.questions && Array.isArray(content.questions)) {
        questions.push(...content.questions);
      }
    });
  } else if (data.text_content && data.text_content.questions && Array.isArray(data.text_content.questions)) {
    // TELC A2 pattern - text_content.questions
    console.log('[SCORING] Found text_content.questions array:', data.text_content.questions.length);
    questions.push(...data.text_content.questions);
  } else if (data.texts && Array.isArray(data.texts)) {
    // Texts array for headline matching (TELC B1/B2 Section 1)
    console.log('[SCORING] Found texts array:', data.texts.length);
    questions.push(...data.texts);
  }
  
  console.log('[SCORING] Extracted questions:', questions.length);
  return questions;
}

/**
 * Main scoring function that works with all data formats
 */
export function calculateScore(
  data: any, 
  userAnswers: Record<number, string>
): ScoreResult {
  const allQuestions = extractAllQuestions(data);
  
  let correctCount = 0;
  let totalQuestions = 0;
  const validationResults: ValidationResult[] = [];
  
  allQuestions.forEach((question) => {
    // Skip example questions from scoring
    if (question.is_example) {
      return;
    }
    
    totalQuestions++;
    // Handle different question number properties
    const questionNumber = isHeadlineMatchingText(question) 
      ? question.text_number 
      : question.question_number;
    const userAnswer = userAnswers[questionNumber] || null;
    const correctAnswer = getCorrectAnswer(question);
    const isCorrect = userAnswer ? isAnswerCorrect(question, userAnswer) : false;
    
    if (isCorrect) {
      correctCount++;
    }
    
    validationResults.push({
      question_number: questionNumber,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      explanation: getExplanation(question, userAnswer || undefined),
    });
  });
  
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  
  return {
    score: correctCount,
    total_score: totalQuestions,
    percentage,
    validation_results: validationResults,
  };
}

/**
 * Validate that all non-example questions are answered
 */
export function validateAllQuestionsAnswered(
  data: any, 
  userAnswers: Record<number, string>
): { allAnswered: boolean; unansweredQuestions: number[] } {
  const allQuestions = extractAllQuestions(data);
  const nonExampleQuestions = allQuestions.filter(q => !q.is_example);
  
  const unansweredQuestions = nonExampleQuestions
    .filter(q => {
      const questionNumber = isHeadlineMatchingText(q) ? q.text_number : q.question_number;
      return !userAnswers[questionNumber];
    })
    .map(q => isHeadlineMatchingText(q) ? q.text_number : q.question_number);
  
  return {
    allAnswered: unansweredQuestions.length === 0,
    unansweredQuestions,
  };
}

/**
 * Get question display text for UI components
 */
export function getQuestionDisplayText(question: ReadingQuestion): string {
  if (isTrueFalseQuestion(question)) {
    return question.statement_text;
  } else if (isSimpleMultipleChoiceQuestion(question)) {
    return question.scenario_text;
  } else if (isAdvancedMultipleChoiceQuestion(question)) {
    return question.question_text;
  } else if (isHeadlineMatchingText(question)) {
    return question.text_content;
  }
  return "";
}

/**
 * Get question options for UI components
 */
export function getQuestionOptions(question: ReadingQuestion): string[] {
  if (isTrueFalseQuestion(question)) {
    return ["Richtig", "Falsch"];
  } else if (isSimpleMultipleChoiceQuestion(question)) {
    return question.options;
  } else if (isAdvancedMultipleChoiceQuestion(question)) {
    return question.options.map(opt => opt.text);
  }
  return [];
}

/**
 * Get course-specific styling theme
 */
export function getCourseTheme(course: string): {
  primary: string;
  secondary: string;
  gradient: string;
  border: string;
} {
  const courseThemes: Record<string, any> = {
    goethe_a1: {
      primary: "red-500",
      secondary: "yellow-500", 
      gradient: "from-red-500 to-yellow-500",
      border: "red-100",
    },
    goethe_a2: {
      primary: "green-500",
      secondary: "emerald-500",
      gradient: "from-green-500 to-emerald-500", 
      border: "green-100",
    },
    goethe_b1: {
      primary: "blue-500",
      secondary: "indigo-500",
      gradient: "from-blue-500 to-indigo-500",
      border: "blue-100",
    },
    goethe_b2: {
      primary: "purple-500", 
      secondary: "violet-500",
      gradient: "from-purple-500 to-violet-500",
      border: "purple-100",
    },
    goethe_c1: {
      primary: "gray-700",
      secondary: "slate-700",
      gradient: "from-gray-700 to-slate-700",
      border: "gray-200",
    },
    telc_a1: {
      primary: "orange-500",
      secondary: "amber-500", 
      gradient: "from-orange-500 to-amber-500",
      border: "orange-100",
    },
    telc_a2: {
      primary: "teal-500",
      secondary: "cyan-500",
      gradient: "from-teal-500 to-cyan-500", 
      border: "teal-100",
    },
    telc_b1: {
      primary: "pink-500",
      secondary: "rose-500",
      gradient: "from-pink-500 to-rose-500",
      border: "pink-100", 
    },
    telc_b2: {
      primary: "indigo-600",
      secondary: "purple-600",
      gradient: "from-indigo-600 to-purple-600",
      border: "indigo-100",
    },
  };
  
  return courseThemes[course] || courseThemes.goethe_a1;
}