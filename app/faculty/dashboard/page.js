"use client";

import { useState, useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TribeStats from '../components/TribeStats';
import PostsFeed from '../components/PostsFeed';
import NavigationSidebar from '../components/NavigationSidebar';

const FacultyDashboard = () => {
    const { user, loading, logout } = useAuthUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">Please log in to access the faculty portal.</p>
                </div>
            </div>
        );
    }

    const NavigationContent = () => (
        <div className="space-y-6">
            <NavigationSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-primary hover:text-primary/80">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-lg">Faculty Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                                <span className="text-sm font-medium text-purple-800">Faculty Member</span>
                            </div>

                            {/* Mobile Menu */}
                            {isMobile && (
                                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-80">
                                        <SheetHeader>
                                            <SheetTitle>Faculty Dashboard</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <NavigationContent />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            <Button variant="ghost" size="sm" onClick={logout}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'}`}>
                    {/* Left Sidebar - Desktop Only */}
                    {!isMobile && (
                        <div className="lg:col-span-1">
                            <div className="sticky top-20 space-y-6">
                                <NavigationContent />
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <ScrollArea className={`space-y-6 ${isMobile ? '' : 'lg:col-span-4'}`}>
                        {activeTab === "overview" && (
                            <>
                                <TribeStats />
                                {!isMobile && <PostsFeed user={user} />}
                            </>
                        )}

                        {activeTab === "posts" && (
                            <PostsFeed user={user} />
                        )}

                        {activeTab === "attendance" && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Attendance Records</h2>
                                <p className="text-gray-600">Attendance tracking and records will be implemented here.</p>
                            </div>
                        )}

                        {activeTab === "reports" && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Reports</h2>
                                <p className="text-gray-600">Faculty reports and analytics will be implemented here.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboard; 