import React from 'react';
import HomeContent from '@/components/HomeContent';
import ResearchBasedHomepage from '@/components/ResearchBasedHomepage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luna — Save 11 Hours Weekly on Language Teaching Tasks',
  description:
    'Research-backed AI that automates 70% of prep and grading. Create differentiated lessons in 2 minutes. Grade instantly. Track progress automatically. Used by 500+ schools.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Luna — Save 11 Hours Weekly on Language Teaching Tasks',
    description:
      'Research-backed AI that automates 70% of prep and grading. Create differentiated lessons in 2 minutes. Grade instantly. Track progress automatically. Used by 500+ schools.',
    type: 'website',
    url: '/',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="min-h-[calc(100vh-4rem)] max-w-[90rem] mx-auto">
        {/* Full width Home Content */}
        <HomeContent />
      </div>

      <ResearchBasedHomepage />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Luna — AI Teaching Assistant',
            applicationCategory: 'EducationApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              category: 'FreeTrial',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '500',
            },
            description:
              'Save 11 hours weekly on language teaching. Research-backed AI automates 70% of prep and grading while improving learning outcomes.',
          }),
        }}
      />
    </main>
  );
}
