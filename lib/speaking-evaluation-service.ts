/**
 * Service for handling speaking evaluation
 * Evaluates each section immediately after completion in the background
 * Retrieves all evaluations at the end for display
 */

interface SpeakingSectionResult {
  section: string;
  total_score: number;
  max_score: number;
  evaluation_data: any;
  evaluated_at?: string;
}

/**
 * Evaluate a single speaking section immediately after completion
 * Called in the background when moving to next section
 */
export async function evaluateSpeakingSection(
  testId: string,
  userId: string,
  sectionNumber: 1 | 2 | 3,
  taskId?: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const endpoints = [
    '/api/speaking-evaluations/telc-a2-part1',
    '/api/speaking-evaluations/telc-a2-part2',
    '/api/speaking-evaluations/telc-a2-part3'
  ];

  try {
    const response = await fetch(endpoints[sectionNumber - 1], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_id: testId,
        task_id: taskId || `${testId}_speaking_${sectionNumber}`,
        user_id: userId,
        course: 'telc-a2',
        section: sectionNumber
      })
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.log(`Speaking section ${sectionNumber} already evaluated`);
        // Try to fetch existing score from database
        const existingScore = await fetchExistingSpeakingScore(testId, userId, sectionNumber);
        return { success: true, score: existingScore };
      }
      throw new Error(`Failed to evaluate speaking section ${sectionNumber}`);
    }

    const result = await response.json();
    console.log(`Speaking section ${sectionNumber} evaluated:`, {
      score: result.total_score,
      max: result.max_score || 5
    });

    return {
      success: true,
      score: result.total_score
    };
  } catch (error) {
    console.error(`Error evaluating speaking section ${sectionNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch existing speaking score from database
 * Used when section was already evaluated
 */
async function fetchExistingSpeakingScore(
  testId: string,
  userId: string,
  section: number
): Promise<number> {
  try {
    // This would normally query the speaking_scores table
    // For now, return 0 as placeholder
    // TODO: Implement actual database query
    const response = await fetch(`/api/get-speaking-score?test_id=${testId}&user_id=${userId}&section=${section}`);
    if (response.ok) {
      const data = await response.json();
      return data.score || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Retrieve all speaking evaluation results after module completion
 * Called at the end to display final scores
 */
export async function getSpeakingModuleResults(
  testId: string,
  userId: string
): Promise<{
  success: boolean;
  moduleTotal: number;
  moduleMaxScore: number;
  modulePercentage: number;
  modulePassed: boolean;
  sectionResults: SpeakingSectionResult[];
  error?: string;
}> {
  try {
    // Fetch all speaking scores from the database
    const response = await fetch(`/api/get-speaking-module-scores?test_id=${testId}&user_id=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch speaking module scores');
    }

    const scores = await response.json();

    // If scores not found, try to evaluate any missing sections
    if (!scores || scores.length === 0) {
      console.warn('No speaking scores found, attempting to evaluate sections');

      // Try to evaluate each section
      const evaluationPromises = [1, 2, 3].map(section =>
        evaluateSpeakingSection(testId, userId, section as 1 | 2 | 3)
      );

      await Promise.all(evaluationPromises);

      // Try fetching again
      const retryResponse = await fetch(`/api/get-speaking-module-scores?test_id=${testId}&user_id=${userId}`);
      if (retryResponse.ok) {
        const retryScores = await retryResponse.json();
        if (retryScores && retryScores.length > 0) {
          return processScores(retryScores);
        }
      }
    }

    return processScores(scores);
  } catch (error) {
    console.error('Error getting speaking module results:', error);
    return {
      success: false,
      moduleTotal: 0,
      moduleMaxScore: 15,
      modulePercentage: 0,
      modulePassed: false,
      sectionResults: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process raw scores into module results
 */
function processScores(scores: any[]): {
  success: boolean;
  moduleTotal: number;
  moduleMaxScore: number;
  modulePercentage: number;
  modulePassed: boolean;
  sectionResults: SpeakingSectionResult[];
} {
  const sectionResults: SpeakingSectionResult[] = [];
  let totalScore = 0;
  const maxScore = 15; // 5 points per section × 3 sections

  // Process each section's score
  for (let i = 1; i <= 3; i++) {
    const sectionScore = scores.find(s => s.section === i);
    if (sectionScore) {
      sectionResults.push({
        section: `speaking_${i}`,
        total_score: sectionScore.score || 0,
        max_score: sectionScore.max_score || 5,
        evaluation_data: sectionScore.evaluation_data || {},
        evaluated_at: sectionScore.created_at
      });
      totalScore += sectionScore.score || 0;
    } else {
      // Section not evaluated yet
      sectionResults.push({
        section: `speaking_${i}`,
        total_score: 0,
        max_score: 5,
        evaluation_data: { status: 'not_evaluated' }
      });
    }
  }

  const modulePercentage = (totalScore / maxScore) * 100;
  const modulePassed = modulePercentage >= 60;

  return {
    success: true,
    moduleTotal: totalScore,
    moduleMaxScore: maxScore,
    modulePercentage: Math.round(modulePercentage * 100) / 100,
    modulePassed,
    sectionResults
  };
}

/**
 * Trigger background evaluation when transitioning between speaking sections
 * This should be called when user clicks "Next" or completes a section
 */
export function triggerBackgroundEvaluation(
  testId: string,
  userId: string,
  completedSection: 1 | 2 | 3,
  taskId?: string
): void {
  // Fire and forget - don't await
  evaluateSpeakingSection(testId, userId, completedSection, taskId)
    .then(result => {
      if (result.success) {
        console.log(`Background evaluation completed for speaking section ${completedSection}`);
      } else {
        console.warn(`Background evaluation failed for speaking section ${completedSection}:`, result.error);
      }
    })
    .catch(error => {
      console.error(`Error in background evaluation for speaking section ${completedSection}:`, error);
    });
}