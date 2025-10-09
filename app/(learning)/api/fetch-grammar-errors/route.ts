import { NextRequest, NextResponse } from 'next/server';
import { withPooledSupabase } from '@/lib/supabase-pool';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

interface GrammarError {
  error: string;
  correction: string;
  grammar_category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  source: 'lesson';
  date: string;
  task_id?: string;
}

interface CategoryData {
  count: number;
  errors: GrammarError[];
  severityBreakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
}

interface GrammarErrorsResponse {
  categories: Record<string, CategoryData>;
  totalErrors: number;
  recentErrors: GrammarError[];
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course') || 'goethe-a1';
    
    return await withPooledSupabase(async (supabase) => {
      // Query lesson writing scores for grammar errors
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson_writing_scores')
        .select('evaluation_data, task_id, created_at')
        .eq('user_id', userId)
        .not('evaluation_data', 'is', null)
        .order('created_at', { ascending: false });

      if (lessonError) {
        console.error('Error fetching lesson grammar errors:', lessonError);
      }


      // Process and organize grammar errors
      const categories: Record<string, CategoryData> = {};
      const allErrors: GrammarError[] = [];

      // Process lesson writing errors
      if (lessonData) {
        lessonData.forEach((record) => {
          const evalData = record.evaluation_data;
          if (evalData?.grammar_errors && Array.isArray(evalData.grammar_errors)) {
            evalData.grammar_errors.forEach((grammarError: any) => {
              const error: GrammarError = {
                error: grammarError.error || '',
                correction: grammarError.correction || '',
                grammar_category: grammarError.grammar_category || 'UNKNOWN',
                severity: grammarError.severity || 'MEDIUM',
                explanation: grammarError.explanation || '',
                source: 'lesson',
                date: record.created_at,
                task_id: record.task_id
              };
              
              allErrors.push(error);
            });
          }
        });
      }


      // Group errors by category
      allErrors.forEach((error) => {
        const category = error.grammar_category;
        
        if (!categories[category]) {
          categories[category] = {
            count: 0,
            errors: [],
            severityBreakdown: {
              LOW: 0,
              MEDIUM: 0,
              HIGH: 0
            }
          };
        }
        
        categories[category].count++;
        categories[category].errors.push(error);
        categories[category].severityBreakdown[error.severity]++;
      });

      // Sort errors within each category by date (most recent first)
      Object.values(categories).forEach((categoryData) => {
        categoryData.errors.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      // Get most recent errors across all categories (limit 10)
      const recentErrors = allErrors
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      const response: GrammarErrorsResponse = {
        categories,
        totalErrors: allErrors.length,
        recentErrors
      };

      return NextResponse.json(response);
    });

  } catch (error) {
    console.error('Error in fetch-grammar-errors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}