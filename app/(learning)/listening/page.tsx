'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ListeningPageClient from './ListeningPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListeningPageClient />
    </Suspense>
  );
}
