"use client";

import dynamic from 'next/dynamic';

const Faculty = dynamic(() => import('../pages/Faculty.jsx'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

export default function FacultyPage() {
    return <Faculty />;
} 