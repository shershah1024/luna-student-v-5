import { Suspense } from 'react';
import ExamProvider from '@/components/exam/ExamProvider';
import ExamNavigation from '@/components/exam/ExamNavigation';
import ExamHeader from '@/components/exam/ExamHeader';

interface ExamLayoutProps {
  children: React.ReactNode;
  params: {
    exam_id: string;
  };
}

export default function ExamLayout({ children, params }: ExamLayoutProps) {
  return (
    <ExamProvider examId={params.exam_id}>
      <div className="min-h-screen bg-gray-50">
        {/* Exam Header */}
        <Suspense fallback={
          <div className="bg-white border-b px-6 py-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          </div>
        }>
          <ExamHeader />
        </Suspense>

        <div className="flex">
          {/* Navigation Sidebar */}
          <aside className="w-80 bg-white border-r min-h-screen">
            <Suspense fallback={
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            }>
              <ExamNavigation />
            </Suspense>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Suspense fallback={
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </ExamProvider>
  );
}