"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";
import QrScanner from "qr-scanner";
import {
    QrCode,
    Trophy,
    Users,
    Calendar,
    Heart,
    MessageCircle,
    Share2,
    Image,
    Smile,
    ArrowLeft,
    LogOut,
    Home,
    BarChart3,
    Shield,
    Bell,
    Camera,
    CheckCircle,
    XCircle,
    Settings,
    ScanLine,
    FileText,
    Download,
    Filter,
    Maximize2,
    Minimize2,
    TrendingUp,
    Clock,
    UserCheck,
    UserX,
    Activity,
    Target,
    Menu,
    User
} from "lucide-react";
import Link from "next/link";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const SboHome = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("feed");
    const [newPost, setNewPost] = useState("");
    const [posts, setPosts] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [isFullScreenScanner, setIsFullScreenScanner] = useState(false);
    const [scanHistory, setScanHistory] = useState([]);
    const [scannedStudentInfo, setScannedStudentInfo] = useState(null);
    const [showStudentPopup, setShowStudentPopup] = useState(false);
    const [qrCodePosition, setQrCodePosition] = useState(null);
    const [lastScan, setLastScan] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [scannedStudent, setScannedStudent] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [pendingPosts, setPendingPosts] = useState([]);
    const [reportFilter, setReportFilter] = useState("today");
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { toast } = useToast();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const qrScannerRef = useRef(null);

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Get user from localStorage first (immediate access)
        const userData = localStorage.getItem("currentUser");
        console.log('🔍 SBO useEffect - userData from localStorage:', userData ? 'exists' : 'null');

        if (userData) {
            const parsedUser = JSON.parse(userData);
            console.log('🔍 SBO useEffect - parsedUser:', parsedUser);

            // Basic role check
            if (parsedUser && parsedUser.role === 'sbo') {
                // Set user immediately from localStorage for fast loading
                console.log('🔍 SBO useEffect - Setting user from localStorage:', parsedUser.full_name);
                setUser({
                    id: parsedUser.id,
                    email: parsedUser.email,
                    full_name: parsedUser.full_name,
                    role: 'sbo'
                });

                // Then fetch fresh data from database in background
                const loadUserFromDatabase = async () => {
                    try {
                        if (parsedUser && parsedUser.email) {
                            const { data: sboOfficer, error } = await supabase
                                .from('sbo_officers')
                                .select('*')
                                .eq('email', parsedUser.email)
                                .single();

                            if (error || !sboOfficer) {
                                console.error('User verification failed:', error);
                                toast({
                                    title: "Verification Warning",
                                    description: "Please log in again to refresh your session",
                                    variant: "destructive"
                                });
                                return;
                            }

                            // Update with fresh data from database
                            console.log('Setting SBO user from database:', sboOfficer.full_name);
                            setUser({
                                id: sboOfficer.id,
                                email: sboOfficer.email,
                                full_name: sboOfficer.full_name,
                                role: 'sbo'
                            });
                        }
                    } catch (error) {
                        console.error('Database verification error:', error);
                        // Don't change user state on error, keep localStorage data
                    }
                };

                // Load user data from database in background
                loadUserFromDatabase();
            } else {
                // Wrong role - redirect to login
                console.error('User is not an SBO officer. Role:', parsedUser?.role);
                localStorage.removeItem("currentUser");
                window.location.href = "/auth";
            }
        } else {
            // No user data - redirect to login
            window.location.href = "/auth";
        }

        // Load real data
        loadPosts();
        loadPendingPosts();
        loadReports();

        return () => {
            window.removeEventListener('resize', checkMobile);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
            }
        };
    }, []);

    const loadPosts = async () => {
        try {
            const { data: postsData, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    tribes(name),
                    students(full_name),
                    admins(full_name),
                    faculty(full_name),
                    sbo_officers(full_name)
                `)
                .eq('approved', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading posts:', error);
                toast({
                    title: "Error",
                    description: "Failed to load posts",
                    variant: "destructive"
                });
            } else {
                // Process posts to get author information
                const processedPosts = postsData?.map(post => {
                    let authorName = 'Unknown';
                    let authorType = 'unknown';

                    if (post.students?.full_name) {
                        authorName = post.students.full_name;
                        authorType = 'student';
                    } else if (post.admins?.full_name) {
                        authorName = post.admins.full_name;
                        authorType = 'admin';
                    } else if (post.faculty?.full_name) {
                        authorName = post.faculty.full_name;
                        authorType = 'faculty';
                    } else if (post.sbo_officers?.full_name) {
                        authorName = post.sbo_officers.full_name;
                        authorType = 'sbo';
                    } else if (!post.author_id) {
                        // Posts without author_id are likely from SBO/Admin/Faculty (temporary)
                        authorName = 'System';
                        authorType = 'system';
                    }

                    return {
                        ...post,
                        authorName,
                        authorType
                    };
                }) || [];

                setPosts(processedPosts);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };

    const getCurrentTimeInfo = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeString = now.toLocaleTimeString();

        // Time-in window: 7:00 AM to 11:30 AM
        const isTimeInWindow = (hours >= 7 && hours < 11) || (hours === 11 && minutes <= 30);

        // Time-out window: 1:00 PM to 5:00 PM  
        const isTimeOutWindow = hours >= 13 && hours < 17;

        return {
            time: timeString,
            isTimeInWindow,
            isTimeOutWindow,
            canScan: isTimeInWindow || isTimeOutWindow,
            currentWindow: isTimeInWindow ? 'time-in' : isTimeOutWindow ? 'time-out' : null
        };
    };

    const loadReports = async () => {
        try {
            // Load students, tribes, and attendance data
            const { data: students } = await supabase.from('students').select('*');
            const { data: tribes } = await supabase.from('tribes').select('*');
            const { data: attendance } = await supabase.from('attendance_records').select('*');

            const totalStudents = students?.length || 0;

            // Calculate today's attendance
            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = attendance?.filter(record =>
                record.date === today
            ) || [];

            const presentToday = todayAttendance.length;
            const absentToday = totalStudents - presentToday;
            const attendanceRateToday = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

            // Calculate attendance by tribe for today
            const tribeStats = tribes?.map(tribe => {
                const tribeStudents = students?.filter(student => student.tribe_id === tribe.id) || [];
                const tribeAttendance = todayAttendance.filter(record =>
                    tribeStudents.some(student => student.id === record.student_id)
                );
                const present = tribeAttendance.length;
                const total = tribeStudents.length;
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;

                return {
                    name: tribe.name,
                    present,
                    total,
                    rate
                };
            }) || [];

            // Calculate weekly attendance (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAttendance = attendance?.filter(record =>
                new Date(record.date) >= weekAgo
            ) || [];

            const presentWeek = weekAttendance.length;
            const absentWeek = (totalStudents * 7) - presentWeek; // Assuming 7 school days
            const attendanceRateWeek = totalStudents > 0 ? Math.round((presentWeek / (totalStudents * 7)) * 100) : 0;

            // Calculate monthly attendance (last 30 days)
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            const monthAttendance = attendance?.filter(record =>
                new Date(record.date) >= monthAgo
            ) || [];

            const presentMonth = monthAttendance.length;
            const absentMonth = (totalStudents * 30) - presentMonth; // Assuming 30 school days
            const attendanceRateMonth = totalStudents > 0 ? Math.round((presentMonth / (totalStudents * 30)) * 100) : 0;

            setReports({
                today: {
                    totalStudents,
                    present: presentToday,
                    absent: absentToday,
                    attendanceRate: attendanceRateToday,
                    tribes: tribeStats
                },
                week: {
                    totalStudents,
                    present: presentWeek,
                    absent: absentWeek,
                    attendanceRate: attendanceRateWeek,
                    daily: [] // Could be calculated if needed
                },
                month: {
                    totalStudents,
                    present: presentMonth,
                    absent: absentMonth,
                    attendanceRate: attendanceRateMonth
                }
            });
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    };

    const loadPendingPosts = async () => {
        try {
            const { data: pendingData, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    tribes(name),
                    students(full_name),
                    admins(full_name),
                    faculty(full_name),
                    sbo_officers(full_name)
                `)
                .eq('approved', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading pending posts:', error);
                toast({
                    title: "Error",
                    description: "Failed to load pending posts",
                    variant: "destructive"
                });
            } else {
                // Process posts to get author information
                const processedPendingPosts = pendingData?.map(post => {
                    let authorName = 'Unknown';
                    let authorType = 'unknown';

                    if (post.students?.full_name) {
                        authorName = post.students.full_name;
                        authorType = 'student';
                    } else if (post.admins?.full_name) {
                        authorName = post.admins.full_name;
                        authorType = 'admin';
                    } else if (post.faculty?.full_name) {
                        authorName = post.faculty.full_name;
                        authorType = 'faculty';
                    } else if (post.sbo_officers?.full_name) {
                        authorName = post.sbo_officers.full_name;
                        authorType = 'sbo';
                    } else if (!post.author_id) {
                        // Posts without author_id are likely from SBO/Admin/Faculty (temporary)
                        authorName = 'System';
                        authorType = 'system';
                    }

                    return {
                        ...post,
                        authorName,
                        authorType
                    };
                }) || [];

                setPendingPosts(processedPendingPosts);
            }
        } catch (error) {
            console.error('Error loading pending posts:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
    };

    const startScanning = async () => {
        if (!videoRef.current) return;

        try {
            const qrScanner = new QrScanner(
                videoRef.current,
                async (result) => {
                    const schoolId = result.data;
                    setLastScan(schoolId);

                    // Fast duplicate detection and auto-processing
                    try {
                        const attendanceResult = await authUtils.checkStudentAttendance(schoolId);
                        if (attendanceResult.success) {
                            const timeInfo = getCurrentTimeInfo();
                            const studentData = attendanceResult.data;

                            // Fast duplicate detection - show toast immediately for duplicates
                            if (studentData.hasRecord) {
                                const record = studentData.record;

                                // Already complete record - show toast and don't open dialog
                                if (record.time_in && record.time_out) {
                                    toast({
                                        title: "Already Recorded Today",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has complete attendance record for today`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }

                                // Already time-in during time-in hours - show toast and don't open dialog
                                if (record.time_in && !record.time_out && timeInfo.isTimeInWindow) {
                                    toast({
                                        title: "Already Time-In",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has already time-in today at ${record.time_in}`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }
                            }

                            // Check recent records for today's entry (fallback check)
                            const recentRecords = studentData.recentRecords || [];
                            const today = new Date().toISOString().split('T')[0];
                            const todayRecord = recentRecords.find(record => record.date === today);

                            if (todayRecord) {
                                // Already complete record in recent records
                                if (todayRecord.time_in && todayRecord.time_out) {
                                    toast({
                                        title: "Already Recorded Today",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has complete attendance record for today`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }

                                // Already time-in during time-in hours in recent records
                                if (todayRecord.time_in && !todayRecord.time_out && timeInfo.isTimeInWindow) {
                                    toast({
                                        title: "Already Time-In",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has already time-in today at ${todayRecord.time_in}`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }
                            }

                            // Only open dialog for students who can actually be recorded
                            setScannedStudent(studentData);
                            setShowConfirmDialog(true);

                            // No toast here - let the dialog handle the user interaction

                        } else {
                            toast({
                                title: "Student Not Found",
                                description: attendanceResult.message,
                                variant: "destructive"
                            });
                        }
                    } catch (error) {
                        console.error('Error checking student attendance:', error);

                        // Provide more specific error messages
                        let errorMessage = "Failed to get student information";
                        if (error.message) {
                            if (error.message.includes('not found') || error.message.includes('does not exist')) {
                                errorMessage = "Student not found in database";
                            } else if (error.message.includes('network') || error.message.includes('connection')) {
                                errorMessage = "Network connection error. Please check your internet connection.";
                            } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                                errorMessage = "Permission denied. Please check your login credentials.";
                            } else if (error.message.includes('timeout')) {
                                errorMessage = "Request timeout. Please try again.";
                            } else {
                                errorMessage = `Error: ${error.message}`;
                            }
                        }

                        toast({
                            title: "Error",
                            description: errorMessage,
                            variant: "destructive"
                        });
                    }
                },
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                }
            );

            qrScannerRef.current = qrScanner;
            await qrScanner.start();
            setIsScanning(true);
            setShowScanner(true);

            toast({
                title: "Scanner Active",
                description: "Point camera at student QR codes to record attendance"
            });

        } catch (error) {
            console.error('Scanner error:', error);
            toast({
                title: "Camera Error",
                description: "Unable to access camera. Please check permissions.",
                variant: "destructive"
            });
        }
    };

    const startFullScreenScanning = async () => {
        // First, open the modal
        setIsFullScreenScanner(true);

        // Then try to start the camera with QrScanner
        if (!videoRef.current) return;

        try {
            const qrScanner = new QrScanner(
                videoRef.current,
                async (result) => {
                    const schoolId = result.data;
                    setLastScan(schoolId);

                    // Fast duplicate detection and auto-processing
                    try {
                        const attendanceResult = await authUtils.checkStudentAttendance(schoolId);
                        if (attendanceResult.success) {
                            const timeInfo = getCurrentTimeInfo();
                            const studentData = attendanceResult.data;

                            // Fast duplicate detection - show toast immediately for duplicates
                            if (studentData.hasRecord) {
                                const record = studentData.record;

                                // Already complete record - show toast and don't open dialog
                                if (record.time_in && record.time_out) {
                                    toast({
                                        title: "Already Recorded Today",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has complete attendance record for today`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }

                                // Already time-in during time-in hours - show toast and don't open dialog
                                if (record.time_in && !record.time_out && timeInfo.isTimeInWindow) {
                                    toast({
                                        title: "Already Time-In",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has already time-in today at ${record.time_in}`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }
                            }

                            // Check recent records for today's entry (fallback check)
                            const recentRecords = studentData.recentRecords || [];
                            const today = new Date().toISOString().split('T')[0];
                            const todayRecord = recentRecords.find(record => record.date === today);

                            if (todayRecord) {
                                // Already complete record in recent records
                                if (todayRecord.time_in && todayRecord.time_out) {
                                    toast({
                                        title: "Already Recorded Today",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has complete attendance record for today`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }

                                // Already time-in during time-in hours in recent records
                                if (todayRecord.time_in && !todayRecord.time_out && timeInfo.isTimeInWindow) {
                                    toast({
                                        title: "Already Time-In",
                                        description: `${schoolId} - ${studentData.student.first_name} ${studentData.student.last_name} has already time-in today at ${todayRecord.time_in}`,
                                        variant: "destructive"
                                    });
                                    return; // Don't open dialog, just show toast
                                }
                            }

                            // Only open dialog for students who can actually be recorded
                            setScannedStudent(studentData);
                            setShowConfirmDialog(true);

                            // No toast here - let the dialog handle the user interaction

                        } else {
                            toast({
                                title: "Student Not Found",
                                description: attendanceResult.message,
                                variant: "destructive"
                            });
                        }
                    } catch (error) {
                        console.error('Error checking student attendance:', error);

                        // Provide more specific error messages
                        let errorMessage = "Failed to get student information";
                        if (error.message) {
                            if (error.message.includes('not found') || error.message.includes('does not exist')) {
                                errorMessage = "Student not found in database";
                            } else if (error.message.includes('network') || error.message.includes('connection')) {
                                errorMessage = "Network connection error. Please check your internet connection.";
                            } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                                errorMessage = "Permission denied. Please check your login credentials.";
                            } else if (error.message.includes('timeout')) {
                                errorMessage = "Request timeout. Please try again.";
                            } else {
                                errorMessage = `Error: ${error.message}`;
                            }
                        }

                        toast({
                            title: "Error",
                            description: errorMessage,
                            variant: "destructive"
                        });
                    }
                },
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                }
            );

            qrScannerRef.current = qrScanner;
            await qrScanner.start();
            setIsScanning(true);

            toast({
                title: "Scanner Active",
                description: "Point camera at student QR codes to record attendance"
            });

        } catch (error) {
            console.error('Scanner error:', error);
            toast({
                title: "Camera Error",
                description: "Unable to access camera. Please check permissions.",
                variant: "destructive"
            });
        }
    };

    const stopScanning = () => {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setIsScanning(false);
        setShowScanner(false);
        setIsFullScreenScanner(false);
        setScannedData(null);
        setQrCodePosition(null);

        toast({
            title: "Scanner Stopped",
            description: "QR code scanning has been disabled"
        });
    };

    const scanQRCode = () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        try {
            if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                // Try multiple QR code detection strategies
                let code = null;

                // Strategy 1: Standard detection
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                // Strategy 2: Try both inversions
                if (!code) {
                    code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "attemptBoth",
                    });
                }

                // Strategy 3: Try with grayscale weights
                if (!code) {
                    code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                        grayscaleWeights: {
                            red: 0.299,
                            green: 0.587,
                            blue: 0.114
                        }
                    });
                }

                // Strategy 4: Try with different threshold
                if (!code) {
                    code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "attemptBoth",
                        grayscaleWeights: {
                            red: 0.2126,
                            green: 0.7152,
                            blue: 0.0722
                        }
                    });
                }

                if (code && code.data) {
                    console.log('QR Code detected:', code.data);
                    console.log('QR Code bounds:', code.location);

                    // Calculate QR code position relative to video
                    const video = videoRef.current;
                    if (video && code.location) {
                        const videoRect = video.getBoundingClientRect();
                        const qrBounds = code.location;

                        // Calculate center of QR code
                        const qrCenterX = (qrBounds.topLeftCorner.x + qrBounds.topRightCorner.x + qrBounds.bottomLeftCorner.x + qrBounds.bottomRightCorner.x) / 4;
                        const qrCenterY = (qrBounds.topLeftCorner.y + qrBounds.topRightCorner.y + qrBounds.bottomLeftCorner.y + qrBounds.bottomRightCorner.y) / 4;

                        // Convert to percentage for responsive positioning
                        const percentX = (qrCenterX / video.videoWidth) * 100;
                        const percentY = (qrCenterY / video.videoHeight) * 100;

                        setQrCodePosition({ x: percentX, y: percentY, bounds: qrBounds });
                    }

                    // Add visual feedback for QR detection
                    toast({
                        title: "QR Code Detected! 🎯",
                        description: "Processing student information...",
                    });

                    handleScanSuccess(code.data);
                    return;
                } else {
                    // Clear position when no QR code is detected
                    setQrCodePosition(null);
                }

                // Debug: Log scanning attempts (only occasionally to avoid spam)
                if (Math.random() < 0.005) { // Log 0.5% of the time
                    console.log('Scanning for QR codes...', {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        canvasWidth: canvas.width,
                        canvasHeight: canvas.height,
                        readyState: video.readyState,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('Error scanning QR code:', error);
        }

        // Continue scanning if no QR code found and still scanning
        if (isScanning) {
            animationFrameRef.current = requestAnimationFrame(scanQRCode);
        }
    };



    const handleScanSuccess = async (data) => {
        setScannedData(data);
        stopScanning();

        try {
            // Parse the scanned data (assuming it's a student ID or QR code data)
            let studentId = data;

            // If the data is a JSON string, parse it
            if (data.startsWith('{') || data.startsWith('[')) {
                try {
                    const parsedData = JSON.parse(data);
                    studentId = parsedData.studentId || parsedData.id || data;
                } catch (e) {
                    // If parsing fails, use the raw data
                    studentId = data;
                }
            }

            // Check if student exists
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (studentError || !student) {
                // Add to scan history
                setScanHistory(prev => [{
                    schoolId: studentId,
                    time: new Date().toLocaleTimeString(),
                    type: 'error',
                    status: 'error',
                    message: 'Student not found'
                }, ...prev.slice(0, 9)]);

                toast({
                    title: "Student Not Found",
                    description: "The scanned QR code does not match any registered student.",
                    variant: "destructive"
                });
                return;
            }

            // Check if attendance already recorded for today
            const today = new Date().toISOString().split('T')[0];
            const { data: existingAttendance, error: attendanceCheckError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', studentId)
                .eq('date', today)
                .single();

            // Show student info popup
            setScannedStudentInfo({
                student,
                existingAttendance,
                studentId,
                today
            });
            setShowStudentPopup(true);

        } catch (error) {
            console.error('Error processing QR scan:', error);

            // Add to scan history
            setScanHistory(prev => [{
                schoolId: data,
                time: new Date().toLocaleTimeString(),
                type: 'error',
                status: 'error',
                message: 'Error processing scan'
            }, ...prev.slice(0, 9)]);

            toast({
                title: "Error",
                description: "Failed to process QR code. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleConfirmAttendance = async () => {
        if (!scannedStudent) return;

        setIsProcessing(true);
        const timeInfo = getCurrentTimeInfo();

        // Get user from localStorage as fallback if state is not available
        let currentUser = user;
        if (!currentUser || !currentUser.id) {
            console.log('🔍 handleConfirmAttendance - User state not available, checking localStorage...');
            const userData = localStorage.getItem("currentUser");
            if (userData) {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && parsedUser.role === 'sbo') {
                    currentUser = parsedUser;
                    console.log('🔍 handleConfirmAttendance - Using user from localStorage:', currentUser.full_name);
                }
            }
        }

        if (!currentUser || !currentUser.id) {
            console.error('❌ User not loaded or missing ID for attendance recording');
            toast({
                title: "Error",
                description: "User session not found. Please log in again.",
                variant: "destructive"
            });
            setIsProcessing(false);
            return;
        }

        // Fast recording - since we've already validated the student can be recorded
        // we can proceed directly to recording without additional checks

        try {
            const result = await authUtils.recordAttendance(scannedStudent.student.school_id, currentUser.id);

            if (result.success) {
                const record = result.data;
                const type = record.time_out ? 'time-out' : 'time-in';

                setScanHistory(prev => [{
                    schoolId: scannedStudent.student.school_id,
                    time: timeInfo.time,
                    type: type,
                    status: 'success',
                    message: `${type === 'time-out' ? 'Time-out' : 'Time-in'} recorded for ${record.student_name}`
                }, ...prev.slice(0, 9)]);

                // Fast success feedback
                toast({
                    title: `${type === 'time-out' ? 'Time-Out' : 'Time-In'} Recorded! ✅`,
                    description: `${scannedStudent.student.school_id} - ${scannedStudent.student.first_name} ${scannedStudent.student.last_name} ${type === 'time-out' ? 'time-out' : 'time-in'} recorded successfully`,
                });
            } else {
                setScanHistory(prev => [{
                    schoolId: scannedStudent.student.school_id,
                    time: timeInfo.time,
                    type: (timeInfo.currentWindow || 'time-in'),
                    status: 'error',
                    message: result.message
                }, ...prev.slice(0, 9)]);

                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }

        } catch (error) {
            console.error('Attendance recording error:', error);
            const errorMessage = "Failed to record attendance";

            setScanHistory(prev => [{
                schoolId: scannedStudent.student.school_id,
                time: timeInfo.time,
                type: (timeInfo.currentWindow || 'time-in'),
                status: 'error',
                message: errorMessage
            }, ...prev.slice(0, 9)]);

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        }

        setShowConfirmDialog(false);
        setScannedStudent(null);
        setIsProcessing(false);
    };

    const handleCancelAttendance = () => {
        setShowConfirmDialog(false);
        setScannedStudent(null);
        setIsProcessing(false);

        toast({
            title: "Scan Cancelled",
            description: "Attendance recording was cancelled"
        });
    };

    const handleRecordAttendance = async () => {
        if (!scannedStudentInfo) return;

        try {
            const { student, existingAttendance, studentId, today } = scannedStudentInfo;

            if (existingAttendance) {
                toast({
                    title: "Already Recorded",
                    description: `${student.full_name} has already been marked present today.`,
                    variant: "destructive"
                });
                setShowStudentPopup(false);
                setScannedStudentInfo(null);
                return;
            }

            // Record attendance
            const { error: insertError } = await supabase
                .from('attendance_records')
                .insert({
                    student_id: studentId,
                    date: today,
                    time_in: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error recording attendance:', insertError);
                toast({
                    title: "Error",
                    description: "Failed to record attendance. Please try again.",
                    variant: "destructive"
                });
                return;
            }

            // Success - Add to scan history
            setScanHistory(prev => [{
                schoolId: student.school_id || studentId,
                time: new Date().toLocaleTimeString(),
                type: 'time-in',
                status: 'success',
                message: `Time-in recorded for ${student.full_name}`
            }, ...prev.slice(0, 9)]);

            toast({
                title: "Attendance Recorded! ✅",
                description: `${student.full_name} has been marked present.`
            });

            // Close popup and reload reports
            setShowStudentPopup(false);
            setScannedStudentInfo(null);
            loadReports();

        } catch (error) {
            console.error('Error recording attendance:', error);
            toast({
                title: "Error",
                description: "Failed to record attendance. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handlePostApproval = async (postId, approved) => {
        try {
            // Update post in database
            const { error } = await supabase
                .from('posts')
                .update({ approved: approved })
                .eq('id', postId);

            if (error) {
                console.error('Error updating post:', error);
                toast({
                    title: "Error",
                    description: `Failed to ${approved ? 'approve' : 'reject'} post: ${error.message}`,
                    variant: "destructive"
                });
                return;
            }

            // Reload posts to reflect changes
            await loadPosts();
            await loadPendingPosts();

            toast({
                title: approved ? "Post Approved! ✅" : "Post Rejected! ❌",
                description: approved ? "The post has been approved and is now visible." : "The post has been rejected."
            });
        } catch (error) {
            console.error('Error updating post:', error);
            toast({
                title: "Error",
                description: `Failed to ${approved ? 'approve' : 'reject'} post`,
                variant: "destructive"
            });
        }
    };

    const handleNewPost = async () => {
        if (!newPost.trim()) return;

        // Debug: Check if user is loaded
        console.log('🔍 handleNewPost - User object:', user);
        console.log('🔍 handleNewPost - User ID:', user?.id);
        console.log('🔍 handleNewPost - New post content:', newPost);

        // Get user from localStorage as fallback if state is not available
        let currentUser = user;
        if (!currentUser || !currentUser.id) {
            console.log('🔍 handleNewPost - User state not available, checking localStorage...');
            const userData = localStorage.getItem("currentUser");
            console.log('🔍 handleNewPost - localStorage userData:', userData);

            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    console.log('🔍 handleNewPost - parsedUser:', parsedUser);
                    console.log('🔍 handleNewPost - parsedUser.role:', parsedUser?.role);
                    console.log('🔍 handleNewPost - parsedUser.id:', parsedUser?.id);

                    if (parsedUser && parsedUser.role === 'sbo' && parsedUser.id) {
                        currentUser = parsedUser;
                        console.log('🔍 handleNewPost - Using user from localStorage:', currentUser.full_name);
                        console.log('🔍 handleNewPost - currentUser.id:', currentUser.id);
                    } else {
                        console.log('🔍 handleNewPost - parsedUser validation failed:', {
                            hasParsedUser: !!parsedUser,
                            role: parsedUser?.role,
                            hasId: !!parsedUser?.id
                        });
                    }
                } catch (parseError) {
                    console.error('🔍 handleNewPost - Error parsing localStorage data:', parseError);
                }
            } else {
                console.log('🔍 handleNewPost - No userData found in localStorage');
            }
        }

        if (!currentUser || !currentUser.id) {
            console.log('🔍 User not loaded from state, attempting fallback mechanisms...');
            console.log('🔍 Attempting to get user from database as last resort...');

            // Last resort: try to get user from database using email from localStorage
            try {
                const userData = localStorage.getItem("currentUser");
                console.log('🔍 Last resort - localStorage userData:', userData);

                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    console.log('🔍 Last resort - parsedUser:', parsedUser);

                    if (parsedUser && parsedUser.email) {
                        console.log('🔍 Trying to fetch user from database with email:', parsedUser.email);

                        const { data: dbUser, error } = await supabase
                            .from('sbo_officers')
                            .select('*')
                            .eq('email', parsedUser.email)
                            .single();

                        if (!error && dbUser) {
                            currentUser = {
                                id: dbUser.id,
                                email: dbUser.email,
                                full_name: dbUser.full_name,
                                role: 'sbo'
                            };
                            console.log('🔍 Successfully got user from database:', currentUser.full_name);
                            console.log('🔍 currentUser.id:', currentUser.id);
                        } else {
                            console.error('❌ Failed to get user from database:', error);
                        }
                    } else {
                        console.log('🔍 No email found in parsedUser:', parsedUser);
                    }
                } else {
                    console.log('🔍 No userData found in localStorage for last resort');
                }
            } catch (dbError) {
                console.error('❌ Error fetching user from database:', dbError);
            }

            // If still no user, try to get the first SBO officer as emergency fallback
            if (!currentUser || !currentUser.id) {
                console.log('🔍 Emergency fallback: trying to get first SBO officer...');
                try {
                    const { data: dbUsers, error } = await supabase
                        .from('sbo_officers')
                        .select('*')
                        .limit(1);

                    if (!error && dbUsers && dbUsers.length > 0) {
                        const dbUser = dbUsers[0];
                        currentUser = {
                            id: dbUser.id,
                            email: dbUser.email,
                            full_name: dbUser.full_name,
                            role: 'sbo'
                        };
                        console.log('🔍 Emergency fallback successful:', currentUser.full_name);
                        console.log('🔍 Emergency currentUser.id:', currentUser.id);
                    } else {
                        console.error('❌ Emergency fallback failed:', error);
                    }
                } catch (emergencyError) {
                    console.error('❌ Emergency fallback error:', emergencyError);
                }
            }

            if (!currentUser || !currentUser.id) {
                console.error('❌ All fallback methods failed - user cannot be loaded');
                toast({
                    title: "Error",
                    description: "User session not found. Please log in again.",
                    variant: "destructive"
                });
                return;
            }
        }

        try {
            const postData = {
                content: newPost,
                author_type: 'sbo',
                sbo_officer_id: currentUser.id,
                tribe_id: null, // SBO posts are system-wide
                approved: true // SBO posts are auto-approved
            };

            console.log('📝 Attempting to create post with data:', postData);

            // Create post in database with correct schema for SBO posts
            const { data: newPostData, error } = await supabase
                .from('posts')
                .insert(postData)
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating post:', error);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
                toast({
                    title: "Error",
                    description: `Failed to create post: ${error.message}`,
                    variant: "destructive"
                });
                return;
            }

            console.log('✅ Post created successfully:', newPostData);
            setNewPost("");

            // Reload posts to show the new one
            await loadPosts();

            toast({
                title: "Post Created! 🎉",
                description: "Your announcement has been posted."
            });
        } catch (error) {
            console.error('❌ Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        }
    };

    const mockLeaderboard = [
        { rank: 1, tribe: "Beta", score: 1356, members: 26 },
        { rank: 2, tribe: "Alpha", score: 1247, members: 28 },
        { rank: 3, tribe: "Gamma", score: 1189, members: 27 },
        { rank: 4, tribe: "Delta", score: 1098, members: 25 },
        { rank: 5, tribe: "Epsilon", score: 1034, members: 24 }
    ];

    const [reports, setReports] = useState({
        today: {
            totalStudents: 0,
            present: 0,
            absent: 0,
            attendanceRate: 0,
            tribes: []
        },
        week: {
            totalStudents: 0,
            present: 0,
            absent: 0,
            attendanceRate: 0,
            daily: []
        },
        month: {
            totalStudents: 0,
            present: 0,
            absent: 0,
            attendanceRate: 0
        }
    });

    // Debug function to check localStorage (can be called from browser console)
    const debugLocalStorage = () => {
        console.log('🔍 Debug localStorage:');
        const userData = localStorage.getItem("currentUser");
        console.log('userData:', userData);
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                console.log('parsed:', parsed);
                console.log('role:', parsed?.role);
                console.log('id:', parsed?.id);
                console.log('full_name:', parsed?.full_name);
                console.log('email:', parsed?.email);
            } catch (e) {
                console.error('Parse error:', e);
            }
        }
        console.log('Current user state:', user);
        console.log('Current user ID:', user?.id);

        // Test database connection
        console.log('🔍 Testing database connection...');
        supabase.from('sbo_officers').select('count').then(({ data, error }) => {
            if (error) {
                console.error('❌ Database connection failed:', error);
            } else {
                console.log('✅ Database connection successful');
            }
        });
    };

    // Make debug function available globally
    if (typeof window !== 'undefined') {
        window.debugLocalStorage = debugLocalStorage;
    }

    const downloadReport = () => {
        const reportData = reports[reportFilter];
        let csvContent = `Attendance Report - ${reportFilter}\nDate,Present,Absent,Rate\n`;

        if (reportFilter === "week") {
            reportData.daily.forEach(day => {
                csvContent += `${day.day},${day.present},${day.absent},${day.rate}%\n`;
            });
        } else {
            csvContent += `Total,${reportData.present},${reportData.absent},${reportData.attendanceRate}%\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-report-${reportFilter}.csv`;
        link.click();

        toast({
            title: "Report Downloaded",
            description: `Attendance report for ${reportFilter} has been saved.`
        });
    };

    const NavigationContent = () => (
        <div className="space-y-6 overflow-y-auto max-h-screen">
            {/* User Profile Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                        </div>
                        <h3 className="font-semibold text-lg">{user?.full_name || 'SBO Officer'}</h3>
                        <p className="text-sm text-muted-foreground">SBO Officer</p>
                        <Badge variant="secondary" className="mt-2">
                            <Shield className="h-3 w-3 mr-1" />
                            Tribe {user?.tribe}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        onClick={startFullScreenScanning}
                        className="w-full"
                        variant={isScanning ? "destructive" : "default"}
                    >
                        <QrCode className="h-4 w-4 mr-2" />
                        {isScanning ? "Stop Scanning" : "Scan QR Code"}
                        {isScanning && (
                            <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                    </Button>
                    <Button
                        onClick={() => setActiveTab("reports")}
                        variant="outline"
                        className="w-full"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Reports
                    </Button>
                    <Button
                        onClick={() => {
                            toast({
                                title: "Settings",
                                description: "Settings panel will be available soon."
                            });
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </CardContent>
            </Card>



            {/* Navigation */}
            <Card>
                <CardContent className="p-4">
                    <nav className="space-y-2">
                        <Button
                            variant={activeTab === "feed" ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab("feed");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Tribe Feed
                        </Button>
                        <Button
                            variant={activeTab === "moderation" ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab("moderation");
                                setIsSheetOpen(false);
                            }}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Moderation
                            {pendingPosts.length > 0 && (
                                <Badge variant="destructive" className="ml-auto">
                                    {pendingPosts.length}
                                </Badge>
                            )}
                        </Button>
                        <Button
                            variant={activeTab === "reports" ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab("reports");
                                setIsSheetOpen(false);
                            }}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Reports
                        </Button>
                        <Button
                            variant={activeTab === "leaderboard" ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab("leaderboard");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            Leaderboard
                        </Button>
                        <Button
                            variant={activeTab === "events" ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab("events");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Events
                        </Button>
                    </nav>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Today&apos;s Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Students Scanned</span>
                        <span className="font-semibold text-green-600">{reports.today.present}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Attendance Rate</span>
                        <span className="font-semibold text-blue-600">{reports.today.attendanceRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Posts</span>
                        <span className="font-semibold text-orange-600">{pendingPosts.length}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">New post pending</p>
                                <p className="text-xs text-muted-foreground">Review required</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">Attendance recorded</p>
                                <p className="text-xs text-muted-foreground">{reports.today.present} students present</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (!user) {
        return <div>Loading...</div>;
    }

    // Advanced QR Scanner Modal
    if (isFullScreenScanner) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-2">
                            <QrCode className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-lg text-gray-800">SBO Attendance Scanner</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={stopScanning}
                            className="text-gray-500 hover:text-red-500"
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>

                    {/* Scanner Content */}
                    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                        {/* Scanner Section */}
                        <div className="flex-1 p-4">
                            <div className="space-y-3">
                                {/* Time Status */}
                                {(() => {
                                    const timeInfo = getCurrentTimeInfo();
                                    return (
                                        <div className="p-3 rounded-lg bg-muted/30 border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">Current Time:</span>
                                                <span className="font-mono text-sm">{timeInfo.time}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className={`p-2 rounded ${timeInfo.isTimeInWindow ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    <div className="font-medium">Time-in</div>
                                                    <div>7:00-11:30</div>
                                                </div>
                                                <div className={`p-2 rounded ${timeInfo.isTimeOutWindow ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    <div className="font-medium">Time-out</div>
                                                    <div>1:00-5:00</div>
                                                </div>
                                            </div>
                                            {!timeInfo.canScan && (
                                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                    <Clock className="h-3 w-3 inline mr-1" />
                                                    Scanner disabled outside of attendance hours
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Video Scanner */}
                                <div className="relative bg-black rounded-lg overflow-hidden w-48 h-48 mx-auto">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        playsInline
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="hidden"
                                        style={{ display: 'none' }}
                                    />

                                    {/* QR Code Detection Square Overlay */}
                                    {isScanning && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Static scanning square (when no QR detected) */}
                                            {!qrCodePosition && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="relative w-32 h-32 scanning-square">
                                                        {/* Top-left corner */}
                                                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-500"></div>
                                                        {/* Top-right corner */}
                                                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-500"></div>
                                                        {/* Bottom-left corner */}
                                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-500"></div>
                                                        {/* Bottom-right corner */}
                                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-500"></div>

                                                        {/* Scanning line animation */}
                                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500 animate-pulse"></div>

                                                        {/* Center dot */}
                                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dynamic QR tracking square (when QR detected) */}
                                            {qrCodePosition && (
                                                <div
                                                    className="absolute w-32 h-32 transition-all duration-200 ease-out"
                                                    style={{
                                                        left: `${qrCodePosition.x}%`,
                                                        top: `${qrCodePosition.y}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    {/* Tracking square with glowing effect */}
                                                    <div className="relative w-full h-full">
                                                        {/* Top-left corner */}
                                                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                                                        {/* Top-right corner */}
                                                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                                                        {/* Bottom-left corner */}
                                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                                                        {/* Bottom-right corner */}
                                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>

                                                        {/* Pulsing center dot */}
                                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>

                                                        {/* Detection indicator */}
                                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-medium">
                                                            QR Detected!
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isScanning && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                            <div className="text-center text-white">
                                                <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">Click &quot;Start Scanner&quot; to begin</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scanning Status */}
                                    {isScanning && (
                                        <div className="absolute top-2 right-2">
                                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                                                Scanning
                                            </div>
                                        </div>
                                    )}

                                    {/* Instructions */}
                                    {isScanning && (
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded text-center">
                                                {qrCodePosition ? 'QR code detected! Processing...' : 'Position QR code within the square'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Scanner Controls */}
                                <div className="space-y-2">
                                    {!isScanning ? (
                                        <Button
                                            onClick={startScanning}
                                            className="w-full"
                                            size="sm"
                                            disabled={!getCurrentTimeInfo().canScan}
                                        >
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Start Scanner
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={stopScanning}
                                            variant="destructive"
                                            className="w-full"
                                            size="sm"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Stop Scanner
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Scan History Section */}
                        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l p-4">
                            <div className="space-y-3 h-full flex flex-col">
                                <h3 className="font-semibold text-lg">Recent Scans</h3>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-64 lg:max-h-96">
                                    {scanHistory.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No scans yet</p>
                                            <p className="text-sm">Start scanning to see attendance records</p>
                                        </div>
                                    ) : (
                                        scanHistory.map((scan, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg border ${scan.status === 'success'
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono font-medium text-xs sm:text-sm">{scan.schoolId}</span>
                                                    {scan.status === 'success' ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="text-xs sm:text-sm opacity-75">
                                                    <div>{scan.time} - {scan.type.toUpperCase()}</div>
                                                    <div className="mt-1">{scan.message}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-primary hover:text-primary/80">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center space-x-2">
                                <Users className="h-6 w-6 text-green-600" />
                                <span className="font-semibold text-lg">SBO Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {isScanning && (
                                <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full animate-pulse">
                                    <QrCode className="h-4 w-4" />
                                    <span className="text-sm font-semibold">SCAN MODE</span>
                                </div>
                            )}
                            <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">SBO Officer</span>
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

                            <Button variant="ghost" size="sm" onClick={handleLogout}>
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
                            <NavigationContent />
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-2'}`}>
                        {activeTab === "feed" && (
                            <>
                                {/* Create Announcement */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex space-x-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Create an announcement..."
                                                    value={newPost}
                                                    onChange={(e) => setNewPost(e.target.value)}
                                                    className="mb-3"
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                toast({
                                                                    title: "Photo Upload",
                                                                    description: "Photo upload feature will be available soon."
                                                                });
                                                            }}
                                                        >
                                                            <Image className="h-4 w-4 mr-1" />
                                                            Photo
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                toast({
                                                                    title: "Emoji Picker",
                                                                    description: "Emoji picker will be available soon."
                                                                });
                                                            }}
                                                        >
                                                            <Smile className="h-4 w-4 mr-1" />
                                                            Emoji
                                                        </Button>
                                                    </div>
                                                    <Button onClick={handleNewPost} disabled={!newPost.trim()}>
                                                        Post Announcement
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Posts Feed */}
                                <div className="space-y-6">
                                    {posts.map((post) => (
                                        <Card key={post.id}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <span className="font-semibold">{post.authorName}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {post.authorType === 'admin' ? 'System' : (post.tribes?.name || 'No Tribe')}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {post.authorType === 'admin' ? 'Admin' :
                                                                    post.authorType === 'faculty' ? 'Faculty' :
                                                                        post.authorType === 'sbo' ? 'SBO' : 'Student'}
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground">•</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(post.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="mb-4">{post.content}</p>
                                                        {post.image && (
                                                            <img
                                                                src={post.image}
                                                                alt="Post"
                                                                className="w-full rounded-lg mb-4"
                                                            />
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex space-x-4">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        toast({
                                                                            title: "Like Post",
                                                                            description: "Like feature will be available soon."
                                                                        });
                                                                    }}
                                                                >
                                                                    <Heart className="h-4 w-4 mr-1" />
                                                                    {post.likes}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        toast({
                                                                            title: "Comments",
                                                                            description: "Comment feature will be available soon."
                                                                        });
                                                                    }}
                                                                >
                                                                    <MessageCircle className="h-4 w-4 mr-1" />
                                                                    {post.comments}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        toast({
                                                                            title: "Share Post",
                                                                            description: "Share feature will be available soon."
                                                                        });
                                                                    }}
                                                                >
                                                                    <Share2 className="h-4 w-4 mr-1" />
                                                                    Share
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === "moderation" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                        Post Moderation
                                    </CardTitle>
                                    <CardDescription>Review and approve pending posts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {pendingPosts.length === 0 ? (
                                        <div className="text-center py-8">
                                            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
                                            <p className="text-muted-foreground">No posts pending approval.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingPosts.map((post) => (
                                                <Card key={post.id} className="border-orange-200">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start space-x-4">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                                {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <span className="font-semibold">{post.authorName}</span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {post.authorType === 'admin' ? 'System' : (post.tribes?.name || 'No Tribe')}
                                                                    </Badge>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {post.authorType === 'admin' ? 'Admin' :
                                                                            post.authorType === 'faculty' ? 'Faculty' :
                                                                                post.authorType === 'sbo' ? 'SBO' : 'Student'}
                                                                    </Badge>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Pending
                                                                    </Badge>
                                                                    <span className="text-sm text-muted-foreground">•</span>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {new Date(post.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="mb-4">{post.content}</p>
                                                                {post.image && (
                                                                    <img
                                                                        src={post.image}
                                                                        alt="Post"
                                                                        className="w-full rounded-lg mb-4"
                                                                    />
                                                                )}
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handlePostApproval(post.id, true)}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handlePostApproval(post.id, false)}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Reject
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "reports" && (
                            <div className="space-y-6">
                                {/* Report Header */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center">
                                                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                                    Attendance Reports
                                                </CardTitle>
                                                <CardDescription>Detailed attendance analytics and insights</CardDescription>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={downloadReport}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex space-x-2 mb-6">
                                            <Button
                                                variant={reportFilter === "today" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setReportFilter("today")}
                                            >
                                                Today
                                            </Button>
                                            <Button
                                                variant={reportFilter === "week" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setReportFilter("week")}
                                            >
                                                This Week
                                            </Button>
                                            <Button
                                                variant={reportFilter === "month" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setReportFilter("month")}
                                            >
                                                This Month
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <UserCheck className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Present</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {reports[reportFilter].present}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                                    <UserX className="h-6 w-6 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Absent</p>
                                                    <p className="text-2xl font-bold text-red-600">
                                                        {reports[reportFilter].absent}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Rate</p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        {reports[reportFilter].attendanceRate}%
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Tribe Breakdown */}
                                {reportFilter === "today" && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                                                Tribe Breakdown
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {reports.today.tribes.map((tribe) => (
                                                    <div key={tribe.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                                <Shield className="h-5 w-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">Tribe {tribe.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {tribe.present}/{tribe.total} students
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-bold text-purple-600">{tribe.rate}%</p>
                                                            <p className="text-sm text-muted-foreground">attendance</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Weekly Chart */}
                                {reportFilter === "week" && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Activity className="h-5 w-5 mr-2 text-orange-600" />
                                                Weekly Attendance Trend
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {reports.week.daily.map((day) => (
                                                    <div key={day.day} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                                                <Calendar className="h-5 w-5 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{day.day}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {day.present} present, {day.absent} absent
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-bold text-orange-600">{day.rate}%</p>
                                                            <p className="text-sm text-muted-foreground">rate</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {activeTab === "leaderboard" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                                        Tribe Leaderboard
                                    </CardTitle>
                                    <CardDescription>Current standings and competition rankings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {mockLeaderboard.map((tribe) => (
                                            <div key={tribe.tribe} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tribe.rank === 1 ? 'bg-yellow-500' :
                                                        tribe.rank === 2 ? 'bg-gray-400' :
                                                            tribe.rank === 3 ? 'bg-orange-500' : 'bg-muted'
                                                        }`}>
                                                        <span className="text-white font-bold text-sm">#{tribe.rank}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Tribe {tribe.tribe}</p>
                                                        <p className="text-sm text-muted-foreground">{tribe.members} members</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-primary">{tribe.score}</p>
                                                    <p className="text-sm text-muted-foreground">points</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "events" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2 text-green-600" />
                                        Upcoming Events
                                    </CardTitle>
                                    <CardDescription>School and tribe events</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8">
                                        <Calendar className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">No Events</h3>
                                        <p className="text-muted-foreground">Check back later for upcoming events!</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Sidebar - Desktop Only */}
                    {!isMobile && (
                        <div className="lg:col-span-1 space-y-6">
                            {/* QR Scanner */}
                            {showScanner && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center">
                                                <QrCode className="h-4 w-4 mr-2" />
                                                QR Scanner
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={startFullScreenScanning}
                                            >
                                                <Maximize2 className="h-4 w-4" />
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative">
                                            <video
                                                ref={videoRef}
                                                className="w-full rounded-lg"
                                                autoPlay
                                                playsInline
                                            />
                                            <canvas
                                                ref={canvasRef}
                                                className="hidden"
                                                style={{ display: 'none' }}
                                            />

                                            {/* QR Code Detection Square Overlay */}
                                            {isScanning && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {/* Static scanning square (when no QR detected) */}
                                                    {!qrCodePosition && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="relative w-48 h-48 scanning-square">
                                                                {/* Top-left corner */}
                                                                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500"></div>
                                                                {/* Top-right corner */}
                                                                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500"></div>
                                                                {/* Bottom-left corner */}
                                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500"></div>
                                                                {/* Bottom-right corner */}
                                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500"></div>

                                                                {/* Scanning line animation */}
                                                                <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>

                                                                {/* Center dot */}
                                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dynamic QR tracking square (when QR detected) */}
                                                    {qrCodePosition && (
                                                        <div
                                                            className="absolute w-48 h-48 transition-all duration-200 ease-out"
                                                            style={{
                                                                left: `${qrCodePosition.x}%`,
                                                                top: `${qrCodePosition.y}%`,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                        >
                                                            {/* Tracking square with glowing effect */}
                                                            <div className="relative w-full h-full">
                                                                {/* Top-left corner */}
                                                                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                                                                {/* Top-right corner */}
                                                                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                                                                {/* Bottom-left corner */}
                                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                                                                {/* Bottom-right corner */}
                                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-yellow-400 shadow-lg shadow-yellow-400/50"></div>

                                                                {/* Pulsing center dot */}
                                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>

                                                                {/* Detection indicator */}
                                                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-sm px-3 py-1 rounded-full font-medium">
                                                                    QR Detected!
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Fallback border when not scanning */}
                                            {!isScanning && (
                                                <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none">
                                                    <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-green-500"></div>
                                                    <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-green-500"></div>
                                                    <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-green-500"></div>
                                                    <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-green-500"></div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            onClick={stopScanning}
                                            variant="destructive"
                                            className="w-full mt-3"
                                        >
                                            Stop Scanning
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Student Info Popup */}
            {showStudentPopup && scannedStudentInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-lg text-gray-800">Student Information</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setShowStudentPopup(false);
                                    setScannedStudentInfo(null);
                                }}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>

                        {/* Student Info Content */}
                        <div className="p-6 space-y-4">
                            {/* Student Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">School ID:</span>
                                    <span className="font-mono font-medium text-gray-900">{scannedStudentInfo.student.school_id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">Full Name:</span>
                                    <span className="font-medium text-gray-900">{scannedStudentInfo.student.full_name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">Birthdate:</span>
                                    <span className="text-gray-900">{new Date(scannedStudentInfo.student.birthdate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Attendance Status */}
                            <div className={`p-4 rounded-lg border ${scannedStudentInfo.existingAttendance
                                ? 'bg-red-50 border-red-200'
                                : 'bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    {scannedStudentInfo.existingAttendance ? (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                    <span className={`font-medium ${scannedStudentInfo.existingAttendance ? 'text-red-900' : 'text-green-900'
                                        }`}>
                                        {scannedStudentInfo.existingAttendance ? 'Already Recorded Today' : 'Ready to Record'}
                                    </span>
                                </div>
                                <p className={`text-sm ${scannedStudentInfo.existingAttendance ? 'text-red-700' : 'text-green-700'
                                    }`}>
                                    {scannedStudentInfo.existingAttendance
                                        ? `${scannedStudentInfo.student.full_name} has already been marked present today.`
                                        : `Ready to record time-in for ${scannedStudentInfo.student.full_name}.`
                                    }
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowStudentPopup(false);
                                        setScannedStudentInfo(null);
                                    }}
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                                {!scannedStudentInfo.existingAttendance && (
                                    <Button
                                        onClick={handleRecordAttendance}
                                        className="flex-1"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Record Attendance
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={showConfirmDialog}
                onOpenChange={(open) => {
                    console.log('Dialog onOpenChange:', open);
                    setShowConfirmDialog(open);
                    if (!open) {
                        setScannedStudent(null);
                        setIsProcessing(false);
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-md"
                    onEscapeKeyDown={() => {
                        console.log('Escape key pressed');
                        setShowConfirmDialog(false);
                        setScannedStudent(null);
                        setIsProcessing(false);
                    }}
                    onInteractOutside={() => {
                        console.log('Clicked outside dialog');
                        setShowConfirmDialog(false);
                        setScannedStudent(null);
                        setIsProcessing(false);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <DialogClose asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto h-6 w-6 p-0"
                                    onClick={() => {
                                        console.log('DialogClose clicked');
                                        setScannedStudent(null);
                                        setIsProcessing(false);
                                    }}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                            {(() => {
                                const timeInfo = getCurrentTimeInfo();
                                if (scannedStudent?.hasRecord) {
                                    if (scannedStudent?.record?.time_in && scannedStudent?.record?.time_out) {
                                        return 'Student Already Recorded';
                                    } else if (scannedStudent?.record?.time_in && !scannedStudent?.record?.time_out) {
                                        if (timeInfo.isTimeInWindow) {
                                            return 'Student Already Time-In';
                                        } else {
                                            return 'Ready for Time-Out';
                                        }
                                    }
                                } else {
                                    // Check if there's a record for today in recent records
                                    const recentRecords = scannedStudent?.recentRecords || [];
                                    const today = new Date().toISOString().split('T')[0];
                                    const todayRecord = recentRecords.find(record => record.date === today);

                                    console.log('Fallback check:', { today, todayRecord, recentRecords });

                                    if (todayRecord) {
                                        if (todayRecord.time_in && todayRecord.time_out) {
                                            return 'Student Already Recorded';
                                        } else if (todayRecord.time_in && !todayRecord.time_out) {
                                            if (timeInfo.isTimeInWindow) {
                                                return 'Student Already Time-In';
                                            } else {
                                                return 'Ready for Time-Out';
                                            }
                                        }
                                    }
                                    return 'Confirm Attendance';
                                }
                            })()}
                        </DialogTitle>
                        <DialogDescription>
                            {(() => {
                                const timeInfo = getCurrentTimeInfo();
                                if (scannedStudent?.hasRecord) {
                                    if (scannedStudent?.record?.time_in && scannedStudent?.record?.time_out) {
                                        return 'This student has already been recorded for today. Check the details below.';
                                    } else if (scannedStudent?.record?.time_in && !scannedStudent?.record?.time_out) {
                                        if (timeInfo.isTimeInWindow) {
                                            return 'This student is already time-in. Time-out can be recorded between 1:00 PM - 5:00 PM.';
                                        } else {
                                            return 'This student can record time-out when the time-out window is active.';
                                        }
                                    }
                                } else {
                                    // Check if there's a record for today in recent records
                                    const recentRecords = scannedStudent?.recentRecords || [];
                                    const today = new Date().toISOString().split('T')[0];
                                    const todayRecord = recentRecords.find(record => record.date === today);

                                    if (todayRecord) {
                                        if (todayRecord.time_in && todayRecord.time_out) {
                                            return 'This student has already been recorded for today. Check the details below.';
                                        } else if (todayRecord.time_in && !todayRecord.time_out) {
                                            if (timeInfo.isTimeInWindow) {
                                                return 'This student is already time-in. Time-out can be recorded between 1:00 PM - 5:00 PM.';
                                            } else {
                                                return 'This student can record time-out when the time-out window is active.';
                                            }
                                        }
                                    }
                                    return 'Please confirm the student information before recording attendance';
                                }
                            })()}
                        </DialogDescription>
                    </DialogHeader>

                    {scannedStudent?.student && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">Student Information</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">School ID:</span>
                                        <span className="font-mono font-medium text-blue-900">{scannedStudent.student.school_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Name:</span>
                                        <span className="font-medium text-blue-900">{scannedStudent.student.full_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Birthdate:</span>
                                        <span className="text-blue-900">{new Date(scannedStudent.student.birthdate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const timeInfo = getCurrentTimeInfo();

                                // Debug logging
                                console.log('Dialog Debug:', {
                                    hasRecord: scannedStudent?.hasRecord,
                                    record: scannedStudent?.record,
                                    recentRecords: scannedStudent?.recentRecords,
                                    timeInfo
                                });

                                // Check if student has a record for today (either through hasRecord or recentRecords)
                                const hasTodayRecord = scannedStudent?.hasRecord ||
                                    (scannedStudent?.recentRecords?.some(record => record.date === new Date().toISOString().split('T')[0]));

                                if (hasTodayRecord) {
                                    // Get the today's record
                                    const todayRecord = scannedStudent?.record ||
                                        scannedStudent?.recentRecords?.find(record => record.date === new Date().toISOString().split('T')[0]);

                                    if (todayRecord?.time_in && todayRecord?.time_out) {
                                        // Complete record (both time-in and time-out)
                                        return (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                    <span className="font-medium text-red-900">Already Recorded Today</span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-red-700">Time In:</span>
                                                        <span className="font-medium text-red-900">{todayRecord.time_in}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-red-700">Time Out:</span>
                                                        <span className="font-medium text-red-900">{todayRecord.time_out}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-red-700">Status:</span>
                                                        <span className="font-medium text-green-700">Complete</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else if (todayRecord?.time_in && !todayRecord?.time_out) {
                                        // Only time-in recorded
                                        if (timeInfo.isTimeInWindow) {
                                            // During time-in hours - show already time-in message
                                            return (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                        <span className="font-medium text-red-900">Already Time-In</span>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-red-700">Time In:</span>
                                                            <span className="font-medium text-red-900">{todayRecord.time_in}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-red-700">Status:</span>
                                                            <span className="font-medium text-orange-700">Time-In Only</span>
                                                        </div>
                                                        <div className="text-sm text-red-700 mt-2">
                                                            This student is already time-in only. Time-out can be recorded between 1:00 PM - 5:00 PM.
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Outside time-in hours - show ready for time-out
                                            return (
                                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Clock className="h-4 w-4 text-orange-600" />
                                                        <span className="font-medium text-orange-900">Ready for Time-Out</span>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-orange-700">Time In:</span>
                                                            <span className="font-medium text-orange-900">{todayRecord.time_in}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-orange-700">Status:</span>
                                                            <span className="font-medium text-orange-700">Time-In Only</span>
                                                        </div>
                                                        <div className="text-sm text-orange-700 mt-2">
                                                            Student can record time-out when time-out window is active.
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }
                                } else {
                                    // No record for today - show ready to record with history
                                    const hasRecentRecords = scannedStudent?.recentRecords?.length > 0;

                                    if (timeInfo.isTimeInWindow) {
                                        return (
                                            <div className="space-y-3">
                                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <span className="font-medium text-green-900">Ready to Record</span>
                                                    </div>
                                                    <div className="text-sm text-green-800">
                                                        This student has not been recorded today. Ready to record time-in.
                                                    </div>
                                                </div>

                                                {hasRecentRecords && (
                                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Clock className="h-4 w-4 text-gray-600" />
                                                            <span className="font-medium text-gray-900">Recent Attendance History</span>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            {scannedStudent.recentRecords.map((record, index) => (
                                                                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">{record.date}</span>
                                                                        <div className="text-xs text-gray-500">
                                                                            {record.time_in && `Time-in: ${record.time_in}`}
                                                                            {record.time_in && record.time_out && ' | '}
                                                                            {record.time_out && `Time-out: ${record.time_out}`}
                                                                        </div>
                                                                    </div>
                                                                    <span className={`text-xs px-2 py-1 rounded ${record.time_in && record.time_out
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-orange-100 text-orange-700'
                                                                        }`}>
                                                                        {record.time_in && record.time_out ? 'Complete' : 'Partial'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    } else if (timeInfo.isTimeOutWindow) {
                                        // During time-out hours, check if student has time-in but no time-out
                                        return (
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Clock className="h-4 w-4 text-blue-600" />
                                                    <span className="font-medium text-blue-900">Ready for Time-Out</span>
                                                </div>
                                                <div className="text-sm text-blue-800">
                                                    Student can record time-out now (1:00 PM - 5:00 PM).
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Clock className="h-4 w-4 text-yellow-600" />
                                                    <span className="font-medium text-yellow-900">Time-In Not Available</span>
                                                </div>
                                                <div className="text-sm text-yellow-800">
                                                    This student has not been recorded today, but time-in is only allowed between 7:00 AM - 11:30 AM.
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                            })()}

                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Current time: {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                console.log('Close button clicked');
                                setShowConfirmDialog(false);
                                setScannedStudent(null);
                                setIsProcessing(false);
                            }}
                            disabled={isProcessing}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                        {(() => {
                            const timeInfo = getCurrentTimeInfo();
                            const canRecord = (!scannedStudent?.hasRecord && timeInfo.isTimeInWindow) ||
                                (scannedStudent?.hasRecord && !scannedStudent?.record.time_out && timeInfo.isTimeOutWindow);

                            if (canRecord) {
                                return (
                                    <Button
                                        onClick={handleConfirmAttendance}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Recording...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Record {!scannedStudent?.hasRecord ? 'Time-In' : 'Time-Out'}
                                            </>
                                        )}
                                    </Button>
                                );
                            }
                            return null;
                        })()}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SboHome; 