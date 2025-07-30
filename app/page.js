"use client";

import dynamic from 'next/dynamic';

const ClientApp = dynamic(() => import('./ClientApp'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Page() {
  return <ClientApp />;
}