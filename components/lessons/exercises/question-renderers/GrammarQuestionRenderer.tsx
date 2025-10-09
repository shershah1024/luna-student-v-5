import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import QuestionRenderer, { Question as BaseQuestion, QuestionRendererProps } from './QuestionRenderer';

interface GrammarQuestionRendererProps {
  question: BaseQuestion & {
    [key: string]: any;
  };
  index: number;
  selectedAnswer?: any;
  onAnswerChange: QuestionRendererProps['onAnswerChange'];
  showResults: boolean;
  taskId: string;
  userId: string;
}

const renderQuestionIntro = (question: GrammarQuestionRendererProps['question']): ReactNode => {
  const questionData = question.data || question;

  switch (questionData.type) {
    case 'sentence_transformation':
      return (
        <div>
          <p className="text-gray-700 mb-2">Transform the sentence:</p>
          <p className="font-medium text-gray-800 mb-2">"{questionData.original_sentence}"</p>
          <p className="text-gray-700 italic">{questionData.instruction}</p>
        </div>
      );

    case 'verb_conjugation':
      return (
        <div>
          <p className="text-gray-700 mb-2">
            Conjugate the verb <span className="font-bold">{questionData.verb}</span> in {questionData.tense} for{' '}
            <span className="font-bold">{questionData.subject}</span>
          </p>
          {questionData.sentence_context && (
            <p className="text-gray-600 italic">Context: {questionData.sentence_context}</p>
          )}
        </div>
      );

    case 'error_correction':
      return (
        <div>
          <p className="text-gray-700 mb-2">
            Find and correct {questionData.errors_count} error{questionData.errors_count > 1 ? 's' : ''} in this sentence:
          </p>
          <p className="font-medium text-gray-800">"{questionData.sentence}"</p>
        </div>
      );

    case 'word_order':
      return <p className="text-gray-700">Arrange the words to form a correct sentence:</p>;

    case 'fill_in_the_blanks':
      return null;

    default:
      if (questionData.question) {
        return <p className="text-gray-700">{questionData.question}</p>;
      }
      return null;
  }
};

export default function GrammarQuestionRenderer({
  question,
  index,
  selectedAnswer,
  onAnswerChange,
  showResults,
  taskId,
  userId
}: GrammarQuestionRendererProps) {
  const questionData = question.data || question;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Question {index + 1}</h3>
          {questionData.points !== undefined && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
              {questionData.points} {questionData.points === 1 ? 'point' : 'points'}
            </span>
          )}
        </div>
        {renderQuestionIntro(question)}
        {questionData.sentence_context && questionData.type !== 'verb_conjugation' && (
          <p className="text-gray-600 italic mt-2">Context: {questionData.sentence_context}</p>
        )}
      </div>

      <QuestionRenderer
        question={question}
        selectedAnswer={selectedAnswer}
        onAnswerChange={onAnswerChange}
        showResults={showResults}
        taskId={taskId}
        userId={userId}
      />

      {showResults && questionData.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Explanation: </span>
            {questionData.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
