// API endpoint to get assignment statistics
// Returns the total count of assignments created across all assignment types

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with anon key for public access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      totalAssignments: count || 0,
      weeklyHoursSaved: 11,
      languagesSupported: 8
    });
    
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    // Return fallback values on error
    return NextResponse.json({ 
      totalAssignments: 24,
      weeklyHoursSaved: 11,
      languagesSupported: 8
    });
  }
}