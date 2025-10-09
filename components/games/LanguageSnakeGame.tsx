"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Trophy, RotateCcw, Pause, Play } from 'lucide-react'

interface Position {
  x: number
  y: number
}

interface LanguageSnakeGameProps {
  isVisible: boolean
  language?: string
}

// Different writing systems and their characters
const WRITING_SYSTEMS = {
  English: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
  Spanish: ['Ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G'],
  French: ['À', 'É', 'È', 'Ê', 'Ç', 'A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  German: ['Ä', 'Ö', 'Ü', 'ß', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  Japanese: ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'が', 'ざ', 'だ', 'ば', 'ぱ', 'ん'],
  Korean: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㅏ', 'ㅓ'],
  Arabic: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط'],
  Russian: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О'],
  Chinese: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '人', '大', '小', '中', '国', '文'],
  Greek: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π'],
}

export default function LanguageSnakeGame({ isVisible, language = 'English' }: LanguageSnakeGameProps) {
  const GRID_SIZE = 15
  const INITIAL_SNAKE = [{ x: 7, y: 7 }]
  
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>({ x: 5, y: 5 })
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 })
  const [gameRunning, setGameRunning] = useState(true)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)
  
  // Get characters for the current language
  const characters = WRITING_SYSTEMS[language as keyof typeof WRITING_SYSTEMS] || WRITING_SYSTEMS.English
  
  const generateFood = useCallback(() => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [snake])
  
  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(generateFood())
    setDirection({ x: 1, y: 0 })
    setScore(0)
    setGameOver(false)
    setGameRunning(true)
    setIsPaused(false)
  }
  
  const moveSnake = useCallback(() => {
    if (!gameRunning || gameOver || isPaused) return
    
    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }
      
      head.x += direction.x
      head.y += direction.y
      
      // Wrap around boundaries
      if (head.x < 0) head.x = GRID_SIZE - 1
      if (head.x >= GRID_SIZE) head.x = 0
      if (head.y < 0) head.y = GRID_SIZE - 1
      if (head.y >= GRID_SIZE) head.y = 0
      
      // Check collision with self
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true)
        setGameRunning(false)
        if (score > highScore) setHighScore(score)
        return currentSnake
      }
      
      newSnake.unshift(head)
      
      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1)
        setFood(generateFood())
      } else {
        newSnake.pop()
      }
      
      return newSnake
    })
  }, [direction, food, gameRunning, gameOver, isPaused, score, highScore, generateFood])
  
  // Game loop
  useEffect(() => {
    if (!isVisible) return
    
    const gameInterval = setInterval(moveSnake, 150)
    return () => clearInterval(gameInterval)
  }, [moveSnake, isVisible])
  
  // Keyboard controls
  useEffect(() => {
    if (!isVisible) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 })
          break
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 })
          break
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 })
          break
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 })
          break
        case ' ':
          e.preventDefault()
          setIsPaused(!isPaused)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction, gameOver, isPaused, isVisible])
  
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
            <Gamepad2 className="h-8 w-8 text-violet-600" />
            <h2 className="text-2xl font-bold text-gray-900">Language Snake</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Collect {language} characters while we create your assignment!
          </p>
          
          {/* Score */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{score}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{highScore}</div>
              <div className="text-xs text-gray-500">Best</div>
            </div>
          </div>
        </div>
        
        {/* Game Board */}
        <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border-2 border-violet-100">
          <div 
            className="grid gap-1 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: '300px',
              height: '300px'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
              const x = index % GRID_SIZE
              const y = Math.floor(index / GRID_SIZE)
              
              const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
              const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
              const isFood = food.x === x && food.y === y
              
              return (
                <motion.div
                  key={index}
                  className={`
                    aspect-square rounded-sm flex items-center justify-center text-xs font-bold
                    ${isSnakeHead ? 'bg-violet-500 text-white shadow-lg' : ''}
                    ${isSnakeBody ? 'bg-violet-400 text-white' : ''}
                    ${isFood ? 'bg-amber-400 text-white shadow-lg animate-pulse' : ''}
                    ${!isSnakeHead && !isSnakeBody && !isFood ? 'bg-white/30' : ''}
                  `}
                  animate={isFood ? { scale: [1, 1.2, 1] } : {}}
                  transition={isFood ? { duration: 0.8, repeat: Infinity } : {}}
                >
                  {isFood && characters[score % characters.length]}
                  {isSnakeHead && '●'}
                </motion.div>
              )
            })}
          </div>
          
          {/* Game Over Overlay */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <div className="text-center text-white">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-amber-400" />
                  <h3 className="text-xl font-bold mb-2">Game Over!</h3>
                  <p className="text-sm opacity-90 mb-4">You collected {score} characters</p>
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && !gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <div className="text-center text-white">
                  <Pause className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">Paused</p>
                  <p className="text-sm opacity-75">Press space to continue</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Controls */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={gameOver}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            Use arrow keys to move • Space to pause • Eat {language} letters to grow!
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}