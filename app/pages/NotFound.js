"use client";

import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";

const NotFound = () => {
    const location = useLocation();

    useEffect(() => {
        console.error(
            "404 Error: User attempted to access non-existent route:",
            location.pathname
        );
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-md mx-auto">
                    <Card variant="gradient" className="text-center">
                        <CardHeader>
                            <div className="flex items-center justify-center mb-4">
                                <GraduationCap className="h-16 w-16 text-primary" />
                            </div>
                            <CardTitle className="text-6xl font-bold text-primary mb-2">404</CardTitle>
                            <CardDescription className="text-xl">
                                Oops! Page not found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-6">
                                The page you&apos;re looking for doesn&apos;t exist or has been moved.
                            </p>
                            <Link to="/">
                                <Button variant="academic" className="w-full">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Return to Home
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NotFound;