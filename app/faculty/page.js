"use client";

import dynamic from 'next/dynamic';

const Faculty = dynamic(() => import('../pages/Faculty'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

export default function FacultyPage() {
    return <Faculty />;
} 