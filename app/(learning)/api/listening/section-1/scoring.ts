// TELC A1 Section 1 Specific Scoring Logic

interface TelcA1Section1Option {
  letter: string;
  image_url: string;
  is_correct: boolean;
  explanation: string;
  text_caption: string;
  image_description: string;
}

interface TelcA1Section1Question {
  question_number: number;
  question_stem: string;
  options: TelcA1Section1Option[];
  speaker_code?: string;
  audio_transcript: string;
}

interface TelcA1Section1DatabaseData {
  main_title: string;
  question_items: TelcA1Section1Question[];
  overall_instructions_text: string;
  audio_introduction_M1?: string;
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

export function scoreTelcA1Section1(
  questionData: TelcA1Section1DatabaseData,
  userAnswers: Record<number, string>
): ScoreResult {
  // Extract questions from question_items
  const allQuestions: TelcA1Section1Question[] = questionData.question_items || [];
  
  // Calculate score by comparing answers with correct answers
  let correctCount = 0;
  const totalQuestions = allQuestions.length;
  const results: ValidationResult[] = [];

  allQuestions.forEach((question) => {
    const questionNumber = question.question_number;
    const userAnswer = userAnswers[questionNumber] || '';
    
    // Find the correct option
    const correctOption = question.options.find(opt => opt.is_correct === true);
    const correctAnswer = correctOption?.letter || '';
    
    const isCorrect = userAnswer === correctAnswer;
    
    if (isCorrect) {
      correctCount++;
    }

    // Get explanation for the user's answer
    const selectedOption = question.options.find(opt => opt.letter === userAnswer);
    const explanation = selectedOption?.explanation || correctOption?.explanation || '';

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