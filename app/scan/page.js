"use client";

import dynamic from 'next/dynamic';

const Scan = dynamic(() => import('../sbo/home/page.js'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

export default function ScanPage() {
    return <Scan />;
} 