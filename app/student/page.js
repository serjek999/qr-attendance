"use client";

import dynamic from 'next/dynamic';

const Student = dynamic(() => import('../pages/Student.jsx'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

export default function StudentPage() {
    return <Student />;
} 