// TELC A1 Section 2 Specific Scoring Logic
// This section uses true/false (boolean) questions

interface TelcA1Section2Question {
  question_number: number;
  statement: string;
  answer: {
    is_true: boolean;
    explanation: string;
  };
}

interface TelcA1Section2DatabaseData {
  main_title: string;
  questions: TelcA1Section2Question[];
  m1_audio_introduction?: string;
  on_paper_instructions?: string[];
  dialogue_context_setting_m1?: string;
  dialogue_transcript?: string;
  dialogue_speakers?: string[];
  m1_audio_outro?: string;
}

interface ValidationResult {
  question_number: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

interface ScoreResult {
  score: number;
  totalScore: number;
  percentage: number;
  results: ValidationResult[];
}

export function scoreTelcA1Section2(
  questionData: TelcA1Section2DatabaseData,
  userAnswers: Record<number, string>
): ScoreResult {
  // Extract questions
  const allQuestions: TelcA1Section2Question[] = questionData.questions || [];
  
  // Calculate score by comparing answers with correct answers
  let correctCount = 0;
  const totalQuestions = allQuestions.length;
  const results: ValidationResult[] = [];

  allQuestions.forEach((question) => {
    const questionNumber = question.question_number;
    const userAnswer = userAnswers[questionNumber] || '';
    
    // Convert boolean to string for comparison
    const correctAnswer = question.answer.is_true ? 'true' : 'false';
    
    const isCorrect = userAnswer === correctAnswer;
    
    if (isCorrect) {
      correctCount++;
    }

    // Get explanation from the question's answer object
    const explanation = question.answer.explanation || '';

    results.push({
      question_number: questionNumber,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      explanation: explanation,
    });
  });

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    score: correctCount,
    totalScore: totalQuestions,
    percentage: percentage,
    results: results
  };
}