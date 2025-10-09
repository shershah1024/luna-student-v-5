// Mapping of sections per test for each course and test type
// Based on actual database structure

interface SectionsPerTest {
  [course: string]: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
  };
}

const SECTIONS_PER_TEST: SectionsPerTest = {
  'goethe-a1': {
    reading: 3,
    listening: 3,
    writing: 2,
    speaking: 3
  },
  'goethe-a2': {
    reading: 4,
    listening: 4,
    writing: 2,
    speaking: 3 // Default, not in data
  },
  'goethe-b1': {
    reading: 5,
    listening: 4,
    writing: 3,
    speaking: 3 // Default, not in data
  },
  'goethe-b2': {
    reading: 5,
    listening: 4,
    writing: 2,
    speaking: 3 // Default, not in data
  },
  'goethe-c1': {
    reading: 5,
    listening: 4, // Default, not in data
    writing: 2,
    speaking: 3 // Default, not in data
  },
  'ielts': {
    reading: 3, // Default
    listening: 4,
    writing: 2,
    speaking: 3 // Default
  }
};

/**
 * Calculates the number of complete tests based on sections completed
 * @param courseId - The course ID (e.g., 'goethe-a1')
 * @param testType - The type of test ('reading', 'listening', 'writing', 'speaking')
 * @param sectionsCompleted - The number of sections completed
 * @returns The number of complete tests
 */
export function calculateTestsFromSections(
  courseId: string,
  testType: 'reading' | 'listening' | 'writing' | 'speaking',
  sectionsCompleted: number
): number {
  const courseMapping = SECTIONS_PER_TEST[courseId];
  
  if (!courseMapping) {
    // Default fallback if course not found
    console.warn(`Course ${courseId} not found in mapping, using defaults`);
    return Math.floor(sectionsCompleted / 3);
  }
  
  const sectionsPerTest = courseMapping[testType];
  
  if (!sectionsPerTest || sectionsPerTest === 0) {
    console.warn(`Invalid sections per test for ${courseId} ${testType}`);
    return 0;
  }
  
  return Math.floor(sectionsCompleted / sectionsPerTest);
}

/**
 * Gets the sections per test for a specific course and test type
 * @param courseId - The course ID (e.g., 'goethe-a1')
 * @param testType - The type of test ('reading', 'listening', 'writing', 'speaking')
 * @returns The number of sections per test
 */
export function getSectionsPerTest(
  courseId: string,
  testType: 'reading' | 'listening' | 'writing' | 'speaking'
): number {
  const courseMapping = SECTIONS_PER_TEST[courseId];
  
  if (!courseMapping) {
    return 3; // Default fallback
  }
  
  return courseMapping[testType] || 3;
}

/**
 * Calculates remaining sections to complete current test
 * @param courseId - The course ID (e.g., 'goethe-a1')
 * @param testType - The type of test ('reading', 'listening', 'writing', 'speaking')
 * @param sectionsCompleted - The number of sections completed
 * @returns The number of sections remaining to complete current test
 */
export function getRemainingSections(
  courseId: string,
  testType: 'reading' | 'listening' | 'writing' | 'speaking',
  sectionsCompleted: number
): number {
  const sectionsPerTest = getSectionsPerTest(courseId, testType);
  const remainder = sectionsCompleted % sectionsPerTest;
  
  if (remainder === 0) {
    return 0; // All complete tests, no partial test
  }
  
  return sectionsPerTest - remainder;
}