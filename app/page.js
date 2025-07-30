"use client";

import dynamic from 'next/dynamic';

const Index = dynamic(() => import('./pages/Index'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Page() {
  return <Index />;
}