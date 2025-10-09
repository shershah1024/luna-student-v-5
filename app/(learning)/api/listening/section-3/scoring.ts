// TELC A1 Section 3 Specific Scoring Logic

interface TelcA1Section3Option {
  text: string;
  letter: string;
  is_correct: boolean;
}

interface TelcA1Section3Question {
  question_number: number;
  question_text: string;
  options: TelcA1Section3Option[];
  message_type: string;
  speaker_code?: string;
  audio_transcript: string;
}

interface TelcA1Section3DatabaseData {
  main_title: string;
  questions: TelcA1Section3Question[];
  m1_audio_introduction?: string;
  on_paper_instructions?: string[];
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

export function scoreTelcA1Section3(
  questionData: TelcA1Section3DatabaseData,
  userAnswers: Record<number, string>
): ScoreResult {
  // Extract questions
  const allQuestions: TelcA1Section3Question[] = questionData.questions || [];
  
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

    // For Section 3, we don't have individual explanations per option
    // We can create a generic explanation based on the correct answer
    let explanation = '';
    if (correctOption) {
      explanation = `Die richtige Antwort ist "${correctOption.text}".`;
    }

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