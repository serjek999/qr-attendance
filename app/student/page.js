"use client";

import dynamic from 'next/dynamic';

const Student = dynamic(() => import('../pages/Student'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

export default function StudentPage() {
    return <Student />;
} 