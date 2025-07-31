"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

const Auth = () => {
    const router = useRouter();

    const handleAuth = (user) => {
        // Store user data (in real app, use proper state management)
        localStorage.setItem("currentUser", JSON.stringify(user));

        // Redirect based on role with new home routes
        switch (user.role) {
            case "admin":
                router.push("/admin/home");
                break;
            case "faculty":
                router.push("/faculty/home");
                break;
            case "sbo":
                router.push("/sbo/home");
                break;
            case "student":
                router.push("/student/home");
                break;
            default:
                router.push("/");
        }
    };

    return <AuthForm onAuth={handleAuth} />;
};

export default Auth;