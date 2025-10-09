'use client';

import { SimpleConjugator } from '@/components/SimpleConjugator';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';

export default function ConjugatorTestPage() {
  return (
    <ExerciseLayout taskId="conjugator-test">
      <div className="h-full overflow-auto">
        <SimpleConjugator />
      </div>
    </ExerciseLayout>
  );
}