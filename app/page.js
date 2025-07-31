"use client";

import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/Navigation'), {
  ssr: false,
  loading: () => <div>Loading....</div>
});

export default function Page() {
  return <Navigation />;
}