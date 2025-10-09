'use client';

import { useUser } from '@clerk/nextjs';
import { VocabPractice } from '@/components/VocabPractice';

export default function VocabularyPracticeChat() {
  const { user, isLoaded } = useUser();

  // Don't render until user is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if no user
  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">Please sign in to practice vocabulary</div>
          <a href="/sign-in" className="text-blue-600 hover:underline">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="h-screen">
        <VocabPractice 
          userId={user.id}
          className="h-full"
        />
      </div>
    </div>
  );
}