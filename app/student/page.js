"use client";

import dynamic from 'next/dynamic';

const StudentDashboard = dynamic(() => import('./dashboard/page'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

export default function StudentPage() {
    return <StudentDashboard />;
} 