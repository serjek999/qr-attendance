"use client";

import { useState, useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useCardAnimation } from '@/hooks/useCardAnimation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StatsCards from '../components/StatsCards';
import TribePerformance from '../components/TribePerformance';
import PostsFeed from '../components/PostsFeed';
import NavigationSidebar from '../components/NavigationSidebar';
import TribeManagementModal from '../components/TribeManagementModal';

const AdminDashboard = () => {
    const { user, loading, logout } = useAuthUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [showTribeModal, setShowTribeModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Card animation hook - 2 main content areas (tribe management, reports)
    const { getCardAnimationClass, getCardDelayClass } = useCardAnimation(2, 200);

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
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#13392F' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#13392F' }}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-white/70">Please log in to access the admin portal.</p>
                </div>
            </div>
        );
    }

    const NavigationContent = () => (
        <div className="space-y-6">
            <NavigationSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onManageTribes={() => setShowTribeModal(true)}
            />
        </div>
    );

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#13392F' }}>
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-white hover:text-white/80">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-lg text-white">Admin Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <span className="text-sm font-medium text-white">Administrator</span>
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
                                            <SheetTitle>Admin Dashboard</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <NavigationContent />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-gray-300 hover:bg-gray-800/20">
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
                                <StatsCards />
                                <TribePerformance />
                            </>
                        )}

                        {activeTab === "posts" && (
                            <PostsFeed user={user} />
                        )}

                        {activeTab === "tribes" && (
                            <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 ${getCardAnimationClass(0)} ${getCardDelayClass(0)}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-white">Tribe Management</h2>
                                    <button
                                        onClick={() => setShowTribeModal(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Add New Tribe
                                    </button>
                                </div>
                                <TribePerformance />
                            </div>
                        )}

                        {activeTab === "reports" && (
                            <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 ${getCardAnimationClass(1)} ${getCardDelayClass(1)}`}>
                                <h2 className="text-xl font-semibold mb-4 text-white">Reports</h2>
                                <p className="text-white/70">Admin reports and analytics will be implemented here.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Tribe Management Modal */}
            <TribeManagementModal
                isOpen={showTribeModal}
                onClose={() => setShowTribeModal(false)}
            />
        </div>
    );
};

export default AdminDashboard; 