import { Button } from '@/components/ui/button'

interface MobileNavigationBarProps {
  currentSection: number
  totalSections: number
  canGoBack: boolean
  canGoForward: boolean
  onPrevious: () => void
  onNext: () => void
}

export function MobileNavigationBar({
  currentSection,
  totalSections,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext
}: MobileNavigationBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4">
            {/* Previous Button */}
            <Button
              onClick={onPrevious}
              disabled={!canGoBack}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:from-gray-400 disabled:to-gray-400"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            
            {/* Section Indicator */}
            <div className="flex items-center justify-center bg-gray-50 border border-gray-200 px-4 py-2 rounded-full min-w-[80px]">
              <span className="text-lg font-bold text-blue-600">{currentSection}</span>
              <span className="text-base font-medium text-gray-500 mx-1">/</span>
              <span className="text-lg font-semibold text-gray-700">{totalSections}</span>
            </div>
            
            {/* Next Button */}
            <Button
              onClick={onNext}
              disabled={!canGoForward}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:from-gray-400 disabled:to-gray-400"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 