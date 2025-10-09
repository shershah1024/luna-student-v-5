import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    // Fetch test section with content blocks and questions
    const { data: sectionData, error: sectionError } = await supabase
      .from('reading_test_sections_v3')
      .select(`
        id,
        test_id,
        title,
        instructions,
        section_type
      `)
      .eq('test_id', testId)
      .single();

    if (sectionError || !sectionData) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Fetch content blocks
    const { data: contentBlocks, error: blocksError } = await supabase
      .from('reading_content_blocks')
      .select(`
        id,
        block_type,
        order_number,
        title,
        content
      `)
      .eq('section_id', sectionData.id)
      .order('order_number');

    if (blocksError) {
      console.error('Error fetching content blocks:', blocksError);
      return NextResponse.json(
        { error: 'Failed to fetch test content' },
        { status: 500 }
      );
    }

    // Fetch questions for all content blocks
    const contentBlockIds = contentBlocks?.map(block => block.id) || [];
    let questions: any[] = [];
    
    if (contentBlockIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('reading_questions_v3')
        .select(`
          id,
          content_block_id,
          question_number,
          question_text,
          correct_answer,
          explanation,
          question_type,
          is_example,
          order_number,
          metadata
        `)
        .in('content_block_id', contentBlockIds)
        .order('order_number');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return NextResponse.json(
          { error: 'Failed to fetch questions' },
          { status: 500 }
        );
      }
      
      questions = questionsData || [];
    }

    // Group questions by content block
    const questionsByBlock = questions?.reduce((acc, question) => {
      if (!acc[question.content_block_id]) {
        acc[question.content_block_id] = [];
      }
      acc[question.content_block_id].push(question);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Transform the data to match our interface
    const testSection = {
      ...sectionData,
      content_blocks: contentBlocks?.map(block => ({
        ...block,
        questions: (questionsByBlock[block.id] || []).sort((a, b) => a.order_number - b.order_number)
      })).sort((a, b) => a.order_number - b.order_number) || []
    };

    return NextResponse.json(testSection);

  } catch (error) {
    console.error('Error in normalized test API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}