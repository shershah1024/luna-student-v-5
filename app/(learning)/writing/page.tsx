import { Suspense } from 'react';
import WritingPageClient from './WritingPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WritingPageClient />
    </Suspense>
  );
}
