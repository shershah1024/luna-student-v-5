'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Clock, Home, MessageSquare, Search } from 'lucide-react';

// Wrapper component that uses useSearchParams
function ComingSoonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [courseName, setCourseName] = useState('This Course');
  const [courseId, setCourseId] = useState('');
  const [courseGradient, setCourseGradient] = useState('from-green-500 to-green-600');
  
  useEffect(() => {
    // Get course ID from URL query parameter
    const id = searchParams?.get('course') || '';
    
    if (id) {
      setCourseId(id);
      
      // Set gradient based on course ID
      if (id in courseGradients) {
        setCourseGradient(courseGradients[id]);
      }
    }
    
    // Map course IDs to course names
    const courseNames: Record<string, string> = {
      'a11': 'German A1.1',
      'a12': 'German A1.2',
      'a2': 'German A2',
      'ga1': 'Goethe A1 Prep',
      'ga2': 'Goethe A2 Prep',
      'ta1': 'Telc A1 Prep',
      'ta2': 'Telc A2 Prep', 
      'tb1': 'Telc B1 Prep',
      'tb2': 'Telc B2 Prep',
      'conv': 'Conversation'
    };
    
    // Set the course name if ID exists
    if (id && id in courseNames) {
      setCourseName(courseNames[id]);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <header className="px-4 pt-6 mb-8">
        <Link 
          href="/mobile" 
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Home
        </Link>
      </header>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="max-w-md w-full">
          {/* Course Card */}
          <div className="rounded-xl overflow-hidden shadow-xl bg-gray-800">
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${courseGradient} p-8 flex flex-col items-center justify-center`}>
              <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                <Clock className="h-14 w-14 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">{courseName}</h1>
              <div className="mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs font-medium">{courseId.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-4">Coming Soon!</h2>
              
              <p className="text-gray-300 text-center mb-8">
                Our team is creating this course for you. Check back soon or subscribe to get notified when it launches.
              </p>
              
              <div className="flex flex-col space-y-3">
                <Link 
                  href="/mobile" 
                  className={`w-full py-3 rounded-full bg-gradient-to-r ${courseGradient} text-white font-medium text-center transform transition hover:scale-[0.98]`}
                >
                  Explore Other Courses
                </Link>
                <button 
                  className="w-full py-3 rounded-full bg-gray-700 text-white font-medium text-center transform transition hover:scale-[0.98]"
                >
                  Get Notified
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-2">
        <div className="flex justify-around items-center">
          <Link href="/mobile" className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition-colors">
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="#" className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition-colors">
            <Search className="h-6 w-6 mb-1" />
            <span className="text-xs">Search</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition-colors">
            <MessageSquare className="h-6 w-6 mb-1" />
            <span className="text-xs">Chat</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function ComingSoon() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ComingSoonContent />
    </Suspense>
  );
}

// Define course gradients mapping
const courseGradients: Record<string, string> = {
  'a11': 'from-purple-500 to-indigo-600',
  'a12': 'from-blue-500 to-indigo-600',
  'a2': 'from-cyan-500 to-blue-600',
  'ga1': 'from-green-500 to-emerald-600',
  'ga2': 'from-emerald-500 to-green-600',
  'ta1': 'from-pink-500 to-rose-600',
  'ta2': 'from-red-500 to-pink-600',
  'tb1': 'from-amber-500 to-orange-600',
  'tb2': 'from-orange-500 to-amber-600',
  'conv': 'from-violet-500 to-purple-600'
};
