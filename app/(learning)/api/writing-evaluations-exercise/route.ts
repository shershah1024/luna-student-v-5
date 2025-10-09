import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';


export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/writing-evaluations: fetch all evaluations for the authenticated user
export async function GET(req: NextRequest) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user email from Clerk
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return NextResponse.json({ error: 'User email not found' }, { status: 400 });
  }
  const userEmail = user.emailAddresses[0].emailAddress;

  // Query evaluations for this user
  let query = supabase
    .from('igcse_writing_task_3_evaluation')
    .select('*')
    .eq('student_email', userEmail)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
