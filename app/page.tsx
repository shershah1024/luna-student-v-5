import React from 'react';
import HomeContent from '@/components/HomeContent';
import ResearchBasedHomepage from '@/components/ResearchBasedHomepage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luna — Your AI Companion for Language Learning',
  description:
    'Complete teacher-assigned tasks with unlimited speaking practice, instant feedback, and personalized support. Practice any language 24/7 with your AI learning companion.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Luna — Your AI Companion for Language Learning',
    description:
      'Complete teacher-assigned tasks with unlimited speaking practice, instant feedback, and personalized support. Practice any language 24/7 with your AI learning companion.',
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
            name: 'Luna — AI Language Learning Companion',
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
              'Your AI companion for language learning. Complete teacher-assigned tasks, practice speaking, and get instant feedback in any language, 24/7.',
          }),
        }}
      />
    </main>
  );
}
