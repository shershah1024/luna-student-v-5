import React, { useState } from 'react';

interface SimpleMultipleChoiceProps {
  question: string;
  options: string[];
  correctIndex: number;
  id: string;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}

export const SimpleMultipleChoice: React.FC<SimpleMultipleChoiceProps> = ({
  question,
  options,
  correctIndex,
  id,
  onAnswer
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleClick = (index: number) => {
    console.log('Option clicked:', index);
    if (!submitted) {
      setSelectedIndex(index);
    }
  };

  const handleSubmit = () => {
    if (selectedIndex !== null) {
      const isCorrect = selectedIndex === correctIndex;
      setSubmitted(true);
      console.log('Submitting answer:', options[selectedIndex], 'isCorrect:', isCorrect);
      onAnswer(options[selectedIndex], isCorrect);
    }
  };

  return (
    <div className="p-4 bg-white">
      <h3 className="mb-3 text-lg font-medium">{question}</h3>
      
      <div className="space-y-2 mb-4">
        {options.map((option, index) => (
          <button
            key={`${id}-option-${index}`}
            onClick={() => handleClick(index)}
            className={`
              block w-full text-left p-2 border rounded 
              ${selectedIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${submitted && index === correctIndex ? 'border-green-500 bg-green-50' : ''}
              ${submitted && selectedIndex === index && index !== correctIndex ? 'border-red-500 bg-red-50' : ''}
            `}
          >
            {option}
          </button>
        ))}
      </div>
      
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedIndex === null}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Submit
        </button>
      )}
    </div>
  );
};

export default SimpleMultipleChoice;
