"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Admin = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new admin home page
        router.push("/admin/home");
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Redirecting to Admin Dashboard...</p>
            </div>
        </div>
    );
};

export default Admin;