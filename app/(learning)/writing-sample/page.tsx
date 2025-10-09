'use client';

import WritingTutorChat from '@/components/chat/WritingTutorChat';

export default function SampleWritingPage() {
  const sampleAssignmentId = "sample-daily-routine-001"; // This ID will trigger default instructions if not in DB

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 dark:from-slate-900 dark:to-stone-950 py-8 px-4 flex flex-col items-center">
      <header className="mb-8 text-center w-full px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-primary-dark font-display">
          Übungsseite zum Schreiben
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground dark:text-muted-foreground-dark mt-2">
          Practice your German writing skills with Luna, your personal tutor.
        </p>
      </header>
      
      <main className="w-full flex justify-center px-2 sm:px-4">
        {/* WritingTutorChat component will be made mobile responsive in the next step */}
        <WritingTutorChat 
          assignmentId={sampleAssignmentId} 
          height="h-[70vh] sm:h-[75vh] max-h-[600px] sm:max-h-[700px]" // Adjusted height for mobile and desktop, added max-h
          className="shadow-2xl rounded-2xl overflow-hidden w-full max-w-2xl" // Ensures it takes width but has a max
        />
      </main>

      <footer className="mt-12 text-center text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground-dark px-4">
        <p>&copy; {new Date().getFullYear()} Goethe A1 Lernplattform. All rights reserved.</p>
        <p>Viel Erfolg beim Üben!</p>
      </footer>
    </div>
  );
}
