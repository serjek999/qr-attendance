"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

const Auth = () => {
    const router = useRouter();

    const handleAuth = (user) => {
        // Store user data (in real app, use proper state management)
        localStorage.setItem("currentUser", JSON.stringify(user));

        // Add a small delay to ensure localStorage is updated
        setTimeout(() => {
            // Redirect based on role with new modular routes
            switch (user.role) {
                case "admin":
                    router.push("/admin/dashboard");
                    break;
                case "faculty":
                    router.push("/faculty/dashboard");
                    break;
                case "sbo":
                    router.push("/sbo/home");
                    break;
                case "student":
                    router.push("/student/dashboard");
                    break;
                default:
                    router.push("/");
            }
        }, 100);
    };

    return <AuthForm onAuth={handleAuth} />;
};

export default Auth;