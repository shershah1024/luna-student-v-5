"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Trophy, RotateCcw } from 'lucide-react'

interface Card {
  id: number
  character: string
  isFlipped: boolean
  isMatched: boolean
}

interface LanguageMemoryGameProps {
  isVisible: boolean
  language?: string
}

// Different writing systems and their characters
const WRITING_SYSTEMS = {
  English: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  Spanish: ['Ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', '¡', '¿'],
  French: ['À', 'É', 'È', 'Ê', 'Ç', 'Œ', 'Ù', 'Î'],
  German: ['Ä', 'Ö', 'Ü', 'ß', 'ẞ', 'Ë', 'Ï', 'Ÿ'],
  Japanese: ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や'],
  Korean: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'],
  Arabic: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'],
  Russian: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'],
  Chinese: ['一', '二', '三', '四', '五', '六', '七', '八'],
  Greek: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ'],
}

export default function LanguageMemoryGame({ isVisible, language = 'English' }: LanguageMemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)

  // Get characters for the current language
  const characters = WRITING_SYSTEMS[language as keyof typeof WRITING_SYSTEMS] || WRITING_SYSTEMS.English

  const initializeGame = useCallback(() => {
    // Create pairs of cards
    const cardPairs = characters.map((char, index) => [
      { id: index * 2, character: char, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, character: char, isFlipped: false, isMatched: false },
    ]).flat()

    // Shuffle cards
    const shuffled = cardPairs.sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setGameComplete(false)
  }, [characters])

  useEffect(() => {
    if (isVisible) {
      initializeGame()
    }
  }, [isVisible, initializeGame])

  const handleCardClick = (id: number) => {
    // Don't allow more than 2 cards to be flipped
    if (flippedCards.length >= 2) return

    // Don't flip already matched or flipped cards
    const card = cards.find(c => c.id === id)
    if (!card || card.isFlipped || card.isMatched) return

    // Flip the card
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    setCards(cards.map(c =>
      c.id === id ? { ...c, isFlipped: true } : c
    ))

    // Check for match if 2 cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)

      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find(c => c.id === firstId)
      const secondCard = cards.find(c => c.id === secondId)

      if (firstCard && secondCard && firstCard.character === secondCard.character) {
        // Match found!
        setTimeout(() => {
          setCards(cards.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true }
              : c
          ))
          setFlippedCards([])

          const newMatches = matches + 1
          setMatches(newMatches)

          // Check if game is complete
          if (newMatches === characters.length) {
            setGameComplete(true)
            if (bestScore === null || moves + 1 < bestScore) {
              setBestScore(moves + 1)
            }
          }
        }, 500)
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards(cards.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isFlipped: false }
              : c
          ))
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="h-8 w-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Memory Match</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Match pairs of {language} characters while we create your assignment!
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{moves}</div>
              <div className="text-xs text-gray-500">Moves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{matches}/{characters.length}</div>
              <div className="text-xs text-gray-500">Matches</div>
            </div>
            {bestScore !== null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{bestScore}</div>
                <div className="text-xs text-gray-500">Best</div>
              </div>
            )}
          </div>
        </div>

        {/* Game Board */}
        <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-100">
          <div className="grid grid-cols-4 gap-3 mx-auto" style={{ maxWidth: '320px' }}>
            {cards.map((card) => (
              <motion.button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || flippedCards.length >= 2}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-2xl font-bold
                  transition-all duration-300 shadow-md
                  ${card.isMatched
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                    : card.isFlipped
                    ? 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
                    : 'bg-gradient-to-br from-white to-gray-100 text-transparent hover:shadow-lg'
                  }
                  ${!card.isMatched && !card.isFlipped ? 'cursor-pointer active:scale-95' : ''}
                  disabled:cursor-not-allowed
                `}
                whileTap={!card.isMatched && !card.isFlipped ? { scale: 0.95 } : {}}
                animate={{
                  rotateY: card.isFlipped || card.isMatched ? 0 : 180,
                }}
                transition={{ duration: 0.3 }}
              >
                {(card.isFlipped || card.isMatched) && card.character}
                {!card.isFlipped && !card.isMatched && '?'}
              </motion.button>
            ))}
          </div>

          {/* Game Complete Overlay */}
          <AnimatePresence>
            {gameComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <div className="text-center text-white">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-amber-400" />
                  <h3 className="text-xl font-bold mb-2">Perfect Match!</h3>
                  <p className="text-sm opacity-90 mb-4">Completed in {moves} moves</p>
                  <button
                    onClick={initializeGame}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center">
            <button
              onClick={initializeGame}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New Game
            </button>
          </div>

          <div className="text-center text-xs text-gray-500">
            Click cards to flip them • Find matching pairs • Complete all matches!
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
