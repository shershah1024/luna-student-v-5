// Utility functions for listening exercises

export type CourseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export function detectCourseLevel(courseName: string): CourseLevel {
  const normalizedCourse = courseName.toLowerCase();
  
  if (normalizedCourse.includes('a1')) return 'A1';
  if (normalizedCourse.includes('a2')) return 'A2';
  if (normalizedCourse.includes('b1')) return 'B1';
  if (normalizedCourse.includes('b2')) return 'B2';
  if (normalizedCourse.includes('c1')) return 'C1';
  if (normalizedCourse.includes('c2')) return 'C2';
  
  // Default to A1 for beginners
  return 'A1';
}

export function shouldUseEnglishInstructions(level: CourseLevel): boolean {
  return level === 'A1' || level === 'A2';
}

export function getListeningInstructions(level: CourseLevel, theme?: string) {
  const isBeginnerLevel = shouldUseEnglishInstructions(level);
  
  if (isBeginnerLevel) {
    return {
      title: level === 'A1' ? '🎧 Simple Listening Exercise' : '🎧 Listening Comprehension',
      description: level === 'A1' 
        ? 'Listen to the audio and answer easy questions. Take your time!'
        : 'Listen to the audio and answer comprehension questions.',
      audioInstruction: level === 'A1'
        ? 'Click the play button below to listen to the audio. You can play it several times.'
        : 'Play the audio below and listen carefully. You can replay it if needed.',
      questionsInstruction: level === 'A1'
        ? 'Answer each question by clicking on your choice. Don\'t worry if you make mistakes!'
        : 'Choose the best answer for each question based on what you heard.',
      transcriptNote: level === 'A1'
        ? 'The written text will be available after you listen to the audio.'
        : 'Transcript available after listening to help you check your understanding.',
      completionMessage: level === 'A1'
        ? 'Great job! You completed the listening exercise!'
        : 'Excellent work! You\'ve completed this listening task.',
      encouragement: level === 'A1'
        ? 'Remember: It\'s okay to listen multiple times. That\'s how you learn!'
        : 'Good listening skills take practice. Keep it up!'
    };
  }
  
  // For B1+ levels, use concise neutral instructions
  return {
    title: '🎧 Listening Comprehension',
    description: 'Listen to the audio and answer the questions.',
    audioInstruction: 'Click play to listen to the audio.',
    questionsInstruction: 'Answer the questions based on what you heard.',
    transcriptNote: 'Transcript available after listening.',
    completionMessage: 'Excellent! You completed the listening task.',
    encouragement: 'Good listening skills take practice. Keep going!'
  };
}

export function getMaxAudioPlays(level: CourseLevel): number {
  switch (level) {
    case 'A1': return 4; // Beginners need more chances
    case 'A2': return 3;
    case 'B1': return 2;
    case 'B2': 
    case 'C1':
    case 'C2': return 1; // Advanced learners get fewer plays
    default: return 3;
  }
}

export function getTranscriptThreshold(level: CourseLevel): number {
  switch (level) {
    case 'A1': return 2; // Show transcript after 2 plays for beginners
    case 'A2': return 1; // Show after 1 play
    case 'B1':
    case 'B2':
    case 'C1':
    case 'C2': return 1; // Advanced learners get transcript after 1 play
    default: return 2;
  }
}

export function getExerciseTypeInstructions(exerciseType: string, level: CourseLevel) {
  const isBeginnerLevel = shouldUseEnglishInstructions(level);
  
  if (!isBeginnerLevel) {
    // German instructions for B1+ levels
    switch (exerciseType) {
      case 'multiple_choice':
        return 'Wählen Sie die richtige Antwort aus.';
      case 'true_false':
        return 'Entscheiden Sie, ob die Aussage richtig oder falsch ist.';
      case 'fill_in_blank':
        return 'Ergänzen Sie die fehlenden Wörter.';
      default:
        return 'Folgen Sie den Anweisungen.';
    }
  }
  
  // English instructions for A1/A2 levels
  switch (exerciseType) {
    case 'multiple_choice':
      return level === 'A1' 
        ? 'Choose the correct answer by clicking on it.'
        : 'Select the best answer from the options below.';
    case 'true_false':
      return level === 'A1'
        ? 'Click "True" if the statement is correct, or "False" if it is wrong.'
        : 'Decide if the statement is true or false based on the audio.';
    case 'fill_in_blank':
      return level === 'A1'
        ? 'Type the missing words in the blank spaces.'
        : 'Fill in the missing words based on what you heard.';
    default:
      return 'Follow the instructions for this exercise.';
  }
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

export function calculateDifficulty(
  exerciseCount: number, 
  audioLength: number, 
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' = 'basic'
): 'easy' | 'medium' | 'hard' {
  let difficultyScore = 0;
  
  // Factor in number of exercises
  if (exerciseCount <= 3) difficultyScore += 1;
  else if (exerciseCount <= 6) difficultyScore += 2;
  else difficultyScore += 3;
  
  // Factor in audio length (in seconds)
  if (audioLength <= 60) difficultyScore += 1;
  else if (audioLength <= 180) difficultyScore += 2;
  else difficultyScore += 3;
  
  // Factor in vocabulary level
  if (vocabularyLevel === 'basic') difficultyScore += 1;
  else if (vocabularyLevel === 'intermediate') difficultyScore += 2;
  else difficultyScore += 3;
  
  // Determine overall difficulty
  if (difficultyScore <= 4) return 'easy';
  else if (difficultyScore <= 7) return 'medium';
  else return 'hard';
}
