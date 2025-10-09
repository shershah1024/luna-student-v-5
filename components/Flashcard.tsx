import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FlashcardProps = {
  frontContent: string;
  backContent: string;
  frontHeader?: string;
  backHeader?: string;
  id: string;
  onFlip?: (isFrontVisible: boolean) => void;
};

export const Flashcard: React.FC<FlashcardProps> = ({
  frontContent,
  backContent,
  frontHeader,
  backHeader,
  id,
  onFlip
}) => {
  const [isFrontVisible, setIsFrontVisible] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setIsFrontVisible(!isFrontVisible);
    
    if (onFlip) {
      onFlip(!isFrontVisible);
    }
    
    // Reset flipping animation after it completes
    setTimeout(() => {
      setIsFlipping(false);
    }, 500); // Match this to the animation duration
  };

  return (
    <div className="w-full max-w-md mx-auto my-4">
      <div 
        className={cn(
          "relative w-full aspect-[3/2] perspective-1000 cursor-pointer",
          isFlipping && "pointer-events-none"
        )}
        onClick={handleFlip}
      >
        <div 
          className={cn(
            "absolute w-full h-full transition-all duration-500 transform-style-3d",
            isFlipping && (isFrontVisible ? "rotate-y-180" : "rotate-y-0"),
            !isFlipping && (isFrontVisible ? "rotate-y-0" : "rotate-y-180")
          )}
        >
          {/* Front side */}
          <div 
            className={cn(
              "absolute w-full h-full bg-[#f5f2e8] border-2 border-black rounded-xl p-6 flex flex-col backface-hidden",
              !isFrontVisible && "rotate-y-180"
            )}
          >
            {frontHeader && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-black flex items-center justify-center text-lg font-bold">F</div>
                <h3 className="text-xl font-bold">{frontHeader}</h3>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center text-center text-lg font-medium">
              {frontContent}
            </div>
            <div className="mt-4 flex justify-center">
              <button 
                className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
              >
                <RotateCw className="h-4 w-4" />
                <span>Flip card</span>
              </button>
            </div>
          </div>
          
          {/* Back side */}
          <div 
            className={cn(
              "absolute w-full h-full bg-[#f5f2e8] border-2 border-black rounded-xl p-6 flex flex-col backface-hidden rotate-y-180",
              isFrontVisible && "rotate-y-180"
            )}
          >
            {backHeader && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-black flex items-center justify-center text-lg font-bold">B</div>
                <h3 className="text-xl font-bold">{backHeader}</h3>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center text-center text-lg font-medium">
              {backContent}
            </div>
            <div className="mt-4 flex justify-center">
              <button 
                className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
              >
                <RotateCw className="h-4 w-4" />
                <span>Flip card</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
