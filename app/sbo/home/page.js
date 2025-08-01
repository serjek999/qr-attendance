"use client";

import { useState, useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useScanner } from '@/hooks/useScanner';
import { useAttendanceStats } from '@/hooks/useAttendanceStats';
import { usePosts } from '@/hooks/usePosts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import Sidebar from '@/app/sbo/components/Sidebar';
import ScannerModal from '@/app/sbo/components/ScannerModal';
import StudentPopup from '@/app/sbo/components/StudentPopup';
import PostFeed from '@/app/sbo/components/PostFeed';
import PostModeration from '@/app/sbo/components/PostModeration';
import ReportsPanel from '@/app/sbo/components/ReportsPanel';
import ScanHistory from '@/app/sbo/components/ScanHistory';

const SboHome = () => {
    const { user, loading, logout } = useAuthUser();
    const [activeTab, setActiveTab] = useState("scan");
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

    const {
        isScanning,
        isFullScreenScanner,
        showStudentPopup,
        scannedStudentInfo,
        scanHistory,
        getCurrentTimeInfo,
        startFullScreenScanning,
        stopScanning,
        handleRecordAttendance,
        clearScanHistory,
        onCloseScanner,
        onClosePopup
    } = useScanner();

    const { stats, tribeStats } = useAttendanceStats();
    const { posts, pendingPosts } = usePosts();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">Please log in to access the SBO portal.</p>
                </div>
            </div>
        );
    }

    const NavigationContent = () => (
        <div className="space-y-6">
            <Sidebar
                user={user}
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
                                <span className="font-semibold text-lg">SBO Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                                <span className="text-sm font-medium text-blue-800">SBO Officer</span>
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
                                            <SheetTitle>SBO Dashboard</SheetTitle>
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
            <div className="flex">
                {/* Desktop Sidebar */}
                {!isMobile && (
                    <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
                        <div className="sticky top-20 space-y-6 p-6">
                            <NavigationContent />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Content Header */}
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {activeTab === "scan" && "QR Scanner"}
                                    {activeTab === "feed" && "Posts Feed"}
                                    {activeTab === "moderation" && "Post Moderation"}
                                    {activeTab === "reports" && "Attendance Reports"}
                                </h1>
                                <p className="text-gray-600">
                                    {activeTab === "scan" && "Scan student QR codes for attendance"}
                                    {activeTab === "feed" && "Manage announcements and posts"}
                                    {activeTab === "moderation" && "Review and approve pending posts"}
                                    {activeTab === "reports" && "View attendance statistics and reports"}
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <ScrollArea className="flex-1">
                        <main className="p-6">
                            <div className="max-w-7xl mx-auto">
                                {activeTab === "scan" && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Scanner Area */}
                                        <div className="lg:col-span-2">
                                            <div className="bg-white rounded-lg shadow p-6">
                                                <div className="text-center mb-6">
                                                    <h2 className="text-xl font-semibold mb-2">QR Code Scanner</h2>
                                                    <p className="text-gray-600">
                                                        Scan student QR codes to record attendance
                                                    </p>
                                                </div>

                                                <div className="text-center">
                                                    <button
                                                        onClick={startFullScreenScanning}
                                                        className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
                                                    >
                                                        Start QR Scanner
                                                    </button>
                                                </div>

                                                {/* Time Info */}
                                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                                    <h3 className="font-semibold text-blue-900 mb-2">Current Time Status:</h3>
                                                    <div className="text-blue-800">
                                                        {getCurrentTimeInfo().message}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scan History */}
                                        <div className="lg:col-span-1">
                                            <ScanHistory
                                                scanHistory={scanHistory}
                                                onClearHistory={clearScanHistory}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "feed" && <PostFeed />}
                                {activeTab === "moderation" && <PostModeration />}
                                {activeTab === "reports" && <ReportsPanel />}
                            </div>
                        </main>
                    </ScrollArea>
                </div>
            </div>

            {/* Modals */}
            <ScannerModal
                isFullScreenScanner={isFullScreenScanner}
                isScanning={isScanning}
                onClose={onCloseScanner}
                onStartScanning={startFullScreenScanning}
                onStopScanning={stopScanning}
                getCurrentTimeInfo={getCurrentTimeInfo}
            />

            <StudentPopup
                showStudentPopup={showStudentPopup}
                scannedStudentInfo={scannedStudentInfo}
                onClose={onClosePopup}
                onRecordAttendance={handleRecordAttendance}
            />
        </div>
    );
};

export default SboHome; 