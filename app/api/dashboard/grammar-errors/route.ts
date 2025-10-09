/**
 * Grammar Errors Dashboard API
 * Fetches all grammar errors across writing, speaking, and grammar exercises
 * Provides cross-skill error analysis and pattern identification
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all grammar errors
    const { data: grammarErrors, error: errorsError } = await supabase
      .from('grammar_errors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (errorsError) {
      console.error('Error fetching grammar errors:', errorsError)
      return NextResponse.json(
        { error: 'Failed to fetch grammar errors' },
        { status: 500 }
      )
    }

    if (!grammarErrors || grammarErrors.length === 0) {
      return NextResponse.json({
        stats: {
          totalErrors: 0,
          byCategoryCount: 0,
          bySourceCount: 0,
          bySeverityCount: 0,
          lastErrorDate: null
        },
        recentErrors: [],
        categoryStats: [],
        sourceTypeStats: [],
        severityStats: [],
        success: true
      })
    }

    // Calculate statistics
    const totalErrors = grammarErrors.length

    // Group by grammar category
    const categoryMap: Record<string, any> = {}
    grammarErrors.forEach(error => {
      const category = error.grammar_category || 'uncategorized'
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          count: 0,
          errors: []
        }
      }
      categoryMap[category].count += 1
      categoryMap[category].errors.push(error)
    })

    const categoryStats = Object.values(categoryMap)
      .sort((a: any, b: any) => b.count - a.count)

    // Group by source type
    const sourceTypeMap: Record<string, any> = {}
    grammarErrors.forEach(error => {
      const sourceType = error.source_type || 'unknown'
      if (!sourceTypeMap[sourceType]) {
        sourceTypeMap[sourceType] = {
          source_type: sourceType,
          count: 0,
          errors: []
        }
      }
      sourceTypeMap[sourceType].count += 1
      sourceTypeMap[sourceType].errors.push(error)
    })

    const sourceTypeStats = Object.values(sourceTypeMap)
      .sort((a: any, b: any) => b.count - a.count)

    // Group by severity
    const severityMap: Record<string, any> = {}
    grammarErrors.forEach(error => {
      const severity = error.severity || 'unknown'
      if (!severityMap[severity]) {
        severityMap[severity] = {
          severity,
          count: 0,
          errors: []
        }
      }
      severityMap[severity].count += 1
      severityMap[severity].errors.push(error)
    })

    // Sort severity by importance (critical > major > moderate > minor)
    const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3, unknown: 4 }
    const severityStats = Object.values(severityMap)
      .sort((a: any, b: any) => {
        return (severityOrder[a.severity as keyof typeof severityOrder] || 99) -
               (severityOrder[b.severity as keyof typeof severityOrder] || 99)
      })

    // Get recent errors (last 20)
    const recentErrors = grammarErrors.slice(0, 20)

    const lastErrorDate = grammarErrors.length > 0 ? grammarErrors[0].created_at : null

    return NextResponse.json({
      stats: {
        totalErrors,
        byCategoryCount: Object.keys(categoryMap).length,
        bySourceCount: Object.keys(sourceTypeMap).length,
        bySeverityCount: Object.keys(severityMap).length,
        lastErrorDate
      },
      recentErrors,
      categoryStats,
      sourceTypeStats,
      severityStats,
      success: true
    })
  } catch (error) {
    console.error('Error in grammar errors dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
