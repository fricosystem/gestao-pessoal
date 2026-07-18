'use client';

// Force dynamic rendering - Firebase Auth requires browser APIs
// This prevents SSG/SSR from evaluating Firebase at build time

import dynamic from 'next/dynamic';

// Dynamic import with no SSR to avoid Firebase being evaluated server-side
const HomeContent = dynamic(() => import('@/components/HomeContent'), { ssr: false });

export default function Home() {
  return <HomeContent />;
}
