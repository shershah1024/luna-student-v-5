'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderingExerciseProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  instructions: string;
  items: string[];
  correctOrder: number[];
  points?: number;
  explanation?: string;
  onComplete?: (data: {
    isCorrect: boolean;
    timeTaken: number;
    pointsEarned: number;
  }) => void;
}

export default function OrderingExercise({
  exerciseId,
  sectionId,
  lessonId,
  userId,
  instructions,
  items,
  correctOrder,
  points = 1,
  explanation,
  onComplete,
}: OrderingExerciseProps) {
  const [startTime] = useState(Date.now());
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Shuffle items on mount
  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setAvailableItems(shuffled);
  }, [items]);

  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToOrdered = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && !orderedItems.includes(draggedItem)) {
      setOrderedItems([...orderedItems, draggedItem]);
      setAvailableItems(availableItems.filter(item => item !== draggedItem));
    }
    setDraggedItem(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && !availableItems.includes(draggedItem)) {
      setAvailableItems([...availableItems, draggedItem]);
      setOrderedItems(orderedItems.filter(item => item !== draggedItem));
    }
    setDraggedItem(null);
  };

  const handleClick = (item: string, fromOrdered: boolean) => {
    if (submitted) return;
    
    if (fromOrdered) {
      setOrderedItems(orderedItems.filter(i => i !== item));
      setAvailableItems([...availableItems, item]);
    } else {
      setAvailableItems(availableItems.filter(i => i !== item));
      setOrderedItems([...orderedItems, item]);
    }
  };

  const handleSubmit = async () => {
    if (submitted || orderedItems.length !== items.length) return;
    
    setSubmitted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Check if order is correct
    const userOrder = orderedItems.map(item => items.indexOf(item));
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    const pointsEarned = isCorrect ? points : 0;

    // Save response to database
    try {
      const { error } = await supabase
        .from('lesson_exercise_responses')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          response: { 
            user_order: orderedItems,
            user_indices: userOrder,
            correct_order: correctOrder.map(i => items[i]),
            correct_indices: correctOrder
          },
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          hint_used: false,
        });

      if (error) {
        console.error('Error saving response:', error);
      }

      // Show explanation
      if (explanation) {
        setShowExplanation(true);
      }

      // Notify parent component
      if (onComplete) {
        onComplete({
          isCorrect,
          timeTaken,
          pointsEarned,
        });
      }
    } catch (error) {
      console.error('Error saving exercise response:', error);
    }
  };

  const getItemClass = (item: string) => {
    if (!submitted) {
      return 'bg-white hover:bg-gray-50 border-gray-300 cursor-move';
    }
    
    const userIndex = orderedItems.indexOf(item);
    const correctIndex = correctOrder.findIndex(i => items[i] === item);
    
    if (userIndex === correctIndex) {
      return 'bg-green-100 border-green-500';
    } else {
      return 'bg-red-100 border-red-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700">{instructions}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Items */}
        <div>
          <h3 className="font-medium mb-3">Available Items</h3>
          <div
            className="min-h-[200px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            onDragOver={handleDragOver}
            onDrop={handleDropToAvailable}
          >
            {availableItems.map((item, index) => (
              <div
                key={`available-${index}`}
                draggable={!submitted}
                onDragStart={() => handleDragStart(item)}
                onClick={() => handleClick(item, false)}
                className={`mb-2 p-3 rounded-lg border-2 transition-colors ${getItemClass(item)}`}
              >
                {item}
              </div>
            ))}
            {availableItems.length === 0 && (
              <p className="text-gray-500 text-center">All items placed</p>
            )}
          </div>
        </div>

        {/* Ordered Items */}
        <div>
          <h3 className="font-medium mb-3">Your Order</h3>
          <div
            className="min-h-[200px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            onDragOver={handleDragOver}
            onDrop={handleDropToOrdered}
          >
            {orderedItems.map((item, index) => (
              <div
                key={`ordered-${index}`}
                draggable={!submitted}
                onDragStart={() => handleDragStart(item)}
                onClick={() => handleClick(item, true)}
                className={`mb-2 p-3 rounded-lg border-2 transition-colors flex items-center ${getItemClass(item)}`}
              >
                <span className="mr-3 font-bold text-gray-500">{index + 1}.</span>
                {item}
              </div>
            ))}
            {orderedItems.length === 0 && (
              <p className="text-gray-500 text-center">Drag items here</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={submitted || orderedItems.length !== items.length}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            submitted || orderedItems.length !== items.length
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Submit Order
        </button>
      </div>

      {submitted && (
        <div className="text-center">
          {orderedItems.map((item, i) => items.indexOf(item)).join(',') === correctOrder.join(',') ? (
            <p className="text-green-600 font-medium">✓ Correct order!</p>
          ) : (
            <div>
              <p className="text-red-600 font-medium mb-2">✗ Incorrect order</p>
              <p className="text-sm text-gray-600">
                Correct order: {correctOrder.map(i => items[i]).join(' → ')}
              </p>
            </div>
          )}
        </div>
      )}

      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
          <p className="text-blue-800">{explanation}</p>
        </div>
      )}
    </div>
  );
}