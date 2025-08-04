"use client";

import { useState, useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useScanner } from '@/hooks/useScanner';
import { useAttendanceStats } from '@/hooks/useAttendanceStats';
import { useScanHistory } from '@/hooks/useScanHistory';
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
        getCurrentTimeInfo,
        handleRecordAttendance,
        onClosePopup,
        startFullScreenScanning,
        stopScanning
    } = useScanner();

    const [showScanner, setShowScanner] = useState(false);
    const [showCustomStudentPopup, setShowCustomStudentPopup] = useState(false);
    const [customScannedStudentInfo, setCustomScannedStudentInfo] = useState(null);

    const { stats, tribeStats, fetchStats, fetchTribeStats } = useAttendanceStats();
    const { scanHistory, addScanToHistory, clearScanHistory } = useScanHistory();
    const { posts, pendingPosts } = usePosts();

    // Custom attendance recording function for the popup
    const handleCustomRecordAttendance = async () => {
        if (!customScannedStudentInfo) return;

        try {
            const timeInfo = getCurrentTimeInfo();
            const currentTime = new Date().toISOString(); // Use full ISO timestamp instead of just time

            const { supabase } = await import('@/app/lib/supabaseClient');

            let attendanceResult = null;
            let isNewRecord = false;

            if (customScannedStudentInfo.existingAttendance) {
                // Update existing attendance record
                const existingRecord = customScannedStudentInfo.existingAttendance;
                const updateData = {};

                if (timeInfo.isTimeInWindow && !existingRecord.time_in) {
                    updateData.time_in = currentTime;
                } else if (timeInfo.isTimeOutWindow && !existingRecord.time_out) {
                    updateData.time_out = currentTime;
                }

                if (Object.keys(updateData).length > 0) {
                    console.log('Updating existing attendance record:', {
                        recordId: existingRecord.id,
                        updateData: updateData,
                        existingRecord: existingRecord
                    });

                    const { data, error } = await supabase
                        .from('attendance_records')
                        .update(updateData)
                        .eq('id', existingRecord.id)
                        .select();

                    if (error) {
                        console.error('Supabase update error:', error);
                        console.error('Update error details:', {
                            code: error.code,
                            message: error.message,
                            details: error.details,
                            hint: error.hint
                        });
                        throw new Error(`Failed to update attendance: ${error.message}`);
                    }
                    attendanceResult = data[0];
                    console.log('Attendance updated successfully:', attendanceResult);
                } else {
                    // No update needed - already has both time_in and time_out
                    attendanceResult = existingRecord;
                    console.log('No update needed, attendance already complete');
                }
            } else {
                // Create new attendance record
                const attendanceData = {
                    student_id: customScannedStudentInfo.student.id,
                    tribe_id: customScannedStudentInfo.student.tribe_id,
                    time_in: timeInfo.isTimeInWindow ? currentTime : null,
                    time_out: timeInfo.isTimeOutWindow ? currentTime : null
                    // Remove date field - let database use default current_date
                };

                console.log('Creating new attendance record:', attendanceData);

                // Try to insert, but handle duplicate key constraint
                const { data, error } = await supabase
                    .from('attendance_records')
                    .insert(attendanceData)
                    .select();

                if (error) {
                    // Check if it's a duplicate key constraint error
                    if (error.code === '23505' && error.message.includes('attendance_records_student_id_date_key')) {
                        console.log('Duplicate key detected, attempting to update existing record...');

                        // Try to get the existing record and update it
                        const today = new Date().toISOString().split('T')[0];
                        const { data: existingRecord, error: fetchError } = await supabase
                            .from('attendance_records')
                            .select('*')
                            .eq('student_id', customScannedStudentInfo.student.id)
                            .eq('date', today)
                            .single();

                        if (fetchError) {
                            console.error('Error fetching existing record:', fetchError);
                            throw new Error(`Failed to handle duplicate attendance record: ${fetchError.message}`);
                        }

                        // Update the existing record
                        const updateData = {};
                        if (timeInfo.isTimeInWindow && !existingRecord.time_in) {
                            updateData.time_in = currentTime;
                        } else if (timeInfo.isTimeOutWindow && !existingRecord.time_out) {
                            updateData.time_out = currentTime;
                        }

                        if (Object.keys(updateData).length > 0) {
                            const { data: updatedData, error: updateError } = await supabase
                                .from('attendance_records')
                                .update(updateData)
                                .eq('id', existingRecord.id)
                                .select();

                            if (updateError) {
                                console.error('Error updating existing record:', updateError);
                                throw new Error(`Failed to update existing attendance: ${updateError.message}`);
                            }

                            attendanceResult = updatedData[0];
                            console.log('Successfully updated existing attendance record:', attendanceResult);
                        } else {
                            attendanceResult = existingRecord;
                            console.log('No update needed, attendance already complete');
                        }
                    } else {
                        console.error('Supabase insert error:', error);
                        console.error('Error details:', {
                            code: error.code,
                            message: error.message,
                            details: error.details,
                            hint: error.hint
                        });
                        throw new Error(`Failed to record attendance: ${error.message}`);
                    }
                } else {
                    attendanceResult = data[0];
                    isNewRecord = true;
                    console.log('Attendance created successfully:', attendanceResult);
                }
            }

            // Show success message
            const action = timeInfo.isTimeInWindow ? 'time-in' : 'time-out';
            const recordType = isNewRecord ? 'recorded' : 'updated';

            toast({
                title: "Attendance Success",
                description: `Successfully ${recordType} ${action} for ${customScannedStudentInfo.student.full_name}`,
            });

            // Add to scan history
            const newScan = {
                timestamp: new Date().toISOString(),
                status: 'success',
                studentInfo: {
                    id: student.id,
                    full_name: student.full_name,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    school_id: student.school_id,
                    year_level: student.year_level
                },
                action: action,
                recordType: recordType,
                scanData: qrData,
                attendanceRecorded: true
            };

            addScanToHistory(newScan);

            // Refresh attendance stats to update reports
            await fetchStats('today');
            await fetchTribeStats();

            // Close the popup
            setShowCustomStudentPopup(false);
            setCustomScannedStudentInfo(null);

        } catch (error) {
            console.error('Error recording attendance:', error);
            toast({
                title: "Recording Error",
                description: error.message || "Failed to record attendance. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Custom close popup function
    const handleCloseCustomPopup = () => {
        setShowCustomStudentPopup(false);
        setCustomScannedStudentInfo(null);
    };

    // Handle QR scan from FixedQRScanner
    const handleQRScan = async (qrData) => {
        try {
            console.log('QR Code scanned:', qrData);

            // Clean the scanned data
            const cleanData = qrData.trim();

            // Import supabase client
            const { supabase } = await import('@/app/lib/supabaseClient');

            // Find student by school_id first, then by id
            let student = null;
            let { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`
                    *,
                    tribes (
                        id,
                        name
                    )
                `)
                .eq('school_id', cleanData)
                .single();

            if (studentError) {
                // Try finding by id
                const { data: studentById, error: idError } = await supabase
                    .from('students')
                    .select(`
                        *,
                        tribes (
                            id,
                            name
                        )
                    `)
                    .eq('id', cleanData)
                    .single();

                if (idError) {
                    throw new Error(`Student not found with ID: ${cleanData}. Please check if the student exists in the database.`);
                }
                student = studentById;
            } else {
                student = studentData;
            }

            // Check if student already has attendance for today
            const today = new Date().toISOString().split('T')[0];

            // Use a more robust query to find today's attendance
            let { data: existingAttendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', student.id)
                .gte('date', today)
                .lt('date', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .maybeSingle(); // Use maybeSingle instead of single to avoid errors

            if (attendanceError) {
                console.error('Error checking existing attendance:', attendanceError);
                // Continue with null existingAttendance
                existingAttendance = null;
            }

            console.log('Attendance check result:', {
                today: today,
                student_id: student.id,
                existingAttendance: existingAttendance,
                attendanceError: attendanceError
            });

            console.log('Student data:', {
                id: student.id,
                full_name: student.full_name,
                school_id: student.school_id,
                tribe_id: student.tribe_id
            });

            console.log('Existing attendance check:', {
                today: today,
                student_id: student.id,
                existingAttendance: existingAttendance,
                attendanceError: attendanceError
            });

            // Prepare student info for popup
            const studentInfo = {
                student,
                existingAttendance: existingAttendance || null
            };

            console.log('Setting custom student info:', studentInfo);

            // Show student popup instead of recording attendance immediately
            setCustomScannedStudentInfo(studentInfo);
            setShowCustomStudentPopup(true);
            setShowScanner(false);

        } catch (error) {
            console.error('Scan error:', error);
            setShowScanner(false);

            // Save failed scan to history
            const failedScan = {
                timestamp: new Date().toISOString(),
                status: 'failed',
                error: error.message || "Failed to process QR code",
                scanData: qrData,
                attendanceRecorded: false
            };

            addScanToHistory(failedScan);

            toast({
                title: "Scan Error",
                description: error.message || "Failed to process QR code",
                variant: "destructive"
            });
        }
    };

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
                    onScan={handleQRScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <StudentPopup
                showStudentPopup={showStudentPopup}
                scannedStudentInfo={scannedStudentInfo}
                onClose={onClosePopup}
                onRecordAttendance={handleRecordAttendance}
            />

            {/* Custom Student Popup for SBO Scanner */}
            <StudentPopup
                showStudentPopup={showCustomStudentPopup}
                scannedStudentInfo={customScannedStudentInfo}
                onClose={handleCloseCustomPopup}
                onRecordAttendance={handleCustomRecordAttendance}
            />
        </div>
    );
};

export default SboHome; 