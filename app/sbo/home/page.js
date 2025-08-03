"use client";

import { useState, useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useScanner } from '@/hooks/useScanner';
import { useAttendanceStats } from '@/hooks/useAttendanceStats';
import { usePosts } from '@/hooks/usePosts';
import { useCardAnimation } from '@/hooks/useCardAnimation';
import { toast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, LogOut, Target, UserCheck, Clock, History, QrCode } from "lucide-react";
import Link from "next/link";
import Sidebar from '@/app/sbo/components/Sidebar';
import FixedQRScanner from '@/app/sbo/components/FixedQRScanner';
import StudentPopup from '@/app/sbo/components/StudentPopup';
import PostsFeed from '@/app/sbo/components/PostsFeed';
import PostModeration from '@/app/sbo/components/PostModeration';
import ReportsPanel from '@/app/sbo/components/ReportsPanel';
import ScanHistory from '@/app/sbo/components/ScanHistory';
import EventsManagement from '@/components/EventsManagement';
import QRCodeGenerator from '@/app/sbo/components/QRCodeGenerator';

const SboHome = () => {
    const { user, loading, logout } = useAuthUser();
    const [activeTab, setActiveTab] = useState("scan");
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Card animation hook - 6 main cards (welcome, 3 scanner stats, QR scanner, recent scans)
    const { getCardAnimationClass, getCardDelayClass } = useCardAnimation(6, 150);

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
        showStudentPopup,
        scannedStudentInfo,
        scanHistory,
        getCurrentTimeInfo,
        handleRecordAttendance,
        clearScanHistory,
        onClosePopup
    } = useScanner();

    const [showScanner, setShowScanner] = useState(false);

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
                isMobile={isMobile}
            />
        </div>
    );

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#13392F' }}>
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            {/* Mobile Menu - Moved to left side */}
                            {isMobile && (
                                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-80" style={{ backgroundColor: '#13392F' }}>
                                        <SheetHeader>
                                            <SheetTitle className="text-white">SBO Dashboard</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <NavigationContent />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            <div className="flex items-center space-x-2">
                                <Target className="h-6 w-6 text-white" />
                                <span className="font-semibold text-lg text-white">SBO Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <Target className="h-4 w-4 text-white" />
                                <span className="text-sm font-medium text-white">SBO Officer</span>
                            </div>

                            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-gray-300 hover:bg-gray-800/20">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
                    {/* Left Sidebar - Desktop Only */}
                    {!isMobile && (
                        <div className="lg:col-span-1 sticky top-20 space-y-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                                <NavigationContent />
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-3'}`}>
                        {activeTab === "scan" && (
                            <div className="space-y-6">
                                {/* Welcome Card */}
                                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(0)} ${getCardDelayClass(0)}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-white">
                                            <Target className="h-5 w-5 mr-2 text-blue-600" />
                                            Welcome, {user?.full_name || 'SBO Officer'}!
                                        </CardTitle>
                                        <CardDescription className="text-white/70">QR scanning and attendance management dashboard</CardDescription>
                                    </CardHeader>
                                </Card>

                                {/* Scanner Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(1)} ${getCardDelayClass(1)}`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <UserCheck className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white/70">Scans Today</p>
                                                    <p className="text-2xl font-bold text-green-600">{scanHistory.length}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(2)} ${getCardDelayClass(2)}`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <QrCode className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white/70">Scanner Status</p>
                                                    <p className="text-2xl font-bold text-blue-600">{showScanner ? 'Active' : 'Ready'}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(3)} ${getCardDelayClass(3)}`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <Clock className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white/70">Current Time</p>
                                                    <p className="text-2xl font-bold text-purple-600">{getCurrentTimeInfo().message}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Main Scanner Area */}
                                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(4)} ${getCardDelayClass(4)}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-white">
                                            <QrCode className="h-5 w-5 mr-2 text-blue-600" />
                                            QR Code Scanner
                                        </CardTitle>
                                        <CardDescription className="text-white/70">Scan student QR codes to record attendance</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="text-center">
                                            <button
                                                onClick={() => setShowScanner(true)}
                                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-500/30 transition-colors"
                                            >
                                                Start QR Scanner
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Scan History */}
                                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(5)} ${getCardDelayClass(5)}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-white">
                                            <History className="h-5 w-5 mr-2 text-blue-600" />
                                            Recent Scans
                                        </CardTitle>
                                        <CardDescription className="text-white/70">Latest QR code scans and attendance records</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScanHistory
                                            scanHistory={scanHistory}
                                            onClearHistory={clearScanHistory}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "feed" && <PostsFeed user={user} />}
                        {activeTab === "events" && <EventsManagement user={user} />}
                        {activeTab === "scoring" && <EventsManagement user={user} />}
                        {activeTab === "moderation" && <PostModeration />}
                        {activeTab === "reports" && <ReportsPanel />}
                        {activeTab === "qr-generator" && <QRCodeGenerator />}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showScanner && (
                <FixedQRScanner
                    onScan={(qrData) => {
                        console.log('QR Code scanned:', qrData);
                        // Handle the scanned QR data
                        setShowScanner(false);
                        // You can add logic here to process the scanned data
                        toast({
                            title: "QR Code Scanned",
                            description: `Scanned: ${qrData.name} (${qrData.student_id})`,
                        });
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}

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