"use client";

import dynamic from 'next/dynamic';

const Scan = dynamic(() => import('../pages/Scan.jsx'), {
    ssr: false,
    loading: () => <div>Loading. . .</div>
});

export default function ScanPage() {
    return <Scan />;
} 