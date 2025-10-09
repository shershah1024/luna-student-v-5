import MultipleChoiceRenderer from './MultipleChoiceRenderer';
import CheckboxRenderer from './CheckboxRenderer';
import TrueFalseRenderer from './TrueFalseRenderer';
import ShortAnswerRenderer from './ShortAnswerRenderer';
import EssayRenderer from './EssayRenderer';
import MatchingRenderer from './MatchingRenderer';
import SentenceOrderingRenderer from './SentenceOrderingRenderer';
import FillInBlanksRenderer from './FillInBlanksRenderer';
import ErrorCorrectionRenderer from './ErrorCorrectionRenderer';
import SentenceTransformationRenderer from './SentenceTransformationRenderer';
import VerbConjugationRenderer from './VerbConjugationRenderer';
import WordOrderRenderer from './WordOrderRenderer';

export interface Question {
  id: number | string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  sample_answer: string;
  points: number;
  // Additional fields for complex question types
  pairs?: Array<{ left: string; right: string }>;
  sentences?: string[];
  blanks?: Array<{ text: string; options: string[] }>;
}

export interface QuestionRendererProps {
  question: Question;
  selectedAnswer?: string;
  onAnswerChange: (questionId: string | number, answer: string) => void;
  showResults: boolean;
  taskId: string;
  userId: string;
  onEvaluationComplete?: (questionId: string | number, score?: number, maxScore?: number) => void;
}

/**
 * Main question renderer that dispatches to specific renderers based on question type
 * Handles all supported listening exercise question types
 */
export default function QuestionRenderer(props: QuestionRendererProps) {
  const { question } = props;

  switch (question.type) {
    case 'multiple_choice':
      return <MultipleChoiceRenderer {...props} />;

    case 'checkbox':
      return <CheckboxRenderer {...props} />;

    case 'true_false':
      return <TrueFalseRenderer {...props} />;

    case 'short_answer':
      return <ShortAnswerRenderer {...props} />;

    case 'essay':
      return <EssayRenderer {...props} />;

    case 'match_the_following':
      return <MatchingRenderer {...props} />;

    case 'sentence_reordering':
      return <SentenceOrderingRenderer {...props} />;

    case 'fill_in_the_blanks':
      return <FillInBlanksRenderer {...props} />;

    case 'error_correction':
      return <ErrorCorrectionRenderer {...props} />;

    case 'sentence_transformation':
      return <SentenceTransformationRenderer {...props} />;

    case 'verb_conjugation':
      return <VerbConjugationRenderer {...props} />;

    case 'word_order':
      return <WordOrderRenderer {...props} />;

    default:
      return (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700">
            <strong>Unsupported question type:</strong> {question.type}
          </p>
          <p className="text-sm text-red-600 mt-1">
            This question type is not yet implemented. Please contact support.
          </p>
        </div>
      );
  }
}