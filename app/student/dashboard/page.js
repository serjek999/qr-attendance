"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
    GraduationCap,
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
    QrCode,
    Download,
    CheckCircle,
    Clock,
    AlertCircle,
    Menu,
    User
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";
import { authUtils } from "@/app/lib/auth";
import QRCode from "qrcode";

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("feed");
    const [newPost, setNewPost] = useState("");
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [attendanceStatus, setAttendanceStatus] = useState({
        today: "pending",
        lastRecorded: null,
        streak: 0,
        totalDays: 0
    });
    const [tribeInfo, setTribeInfo] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { toast } = useToast();
    const qrRef = useRef(null);

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Get user from localStorage
        const userData = localStorage.getItem("currentUser");
        if (userData) {
            const userObj = JSON.parse(userData);
            setUser(userObj);

            // Load user data and generate QR code
            loadUserData(userObj);

            // Generate QR code for the student after a delay to ensure client-side rendering
            setTimeout(() => {
                generateQRCode(userObj.school_id);
            }, 500);
        } else {
            // Redirect to login if no user
            window.location.href = "/auth";
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const loadUserData = async (userObj) => {
        try {
            // Load tribe information
            if (userObj.tribe_id) {
                const { data: tribeData, error: tribeError } = await supabase
                    .from('tribes')
                    .select('*')
                    .eq('id', userObj.tribe_id)
                    .single();

                if (!tribeError && tribeData) {
                    setTribeInfo(tribeData);
                }
            }

            // Load attendance status
            await loadAttendanceStatus(userObj.id);

            // Load posts
            await loadPosts(userObj.tribe_id);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadAttendanceStatus = async (studentId) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get today's attendance record
            const { data: todayRecord, error: todayError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', studentId)
                .eq('date', today)
                .single();

            if (todayError && todayError.code !== 'PGRST116') {
                console.error('Error fetching today attendance:', todayError);
            }

            // Get attendance statistics
            const { data: allRecords, error: allError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false });

            if (allError) {
                console.error('Error fetching attendance records:', allError);
                return;
            }

            // Calculate streak and total days
            let streak = 0;
            let totalDays = allRecords.length;

            if (allRecords.length > 0) {
                const sortedRecords = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                let currentDate = new Date(sortedRecords[0].date);
                let consecutiveDays = 0;

                for (const record of sortedRecords) {
                    const recordDate = new Date(record.date);
                    const diffTime = Math.abs(currentDate - recordDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 1) {
                        consecutiveDays++;
                        currentDate = recordDate;
                    } else {
                        break;
                    }
                }
                streak = consecutiveDays;
            }

            setAttendanceStatus(prev => ({
                ...prev,
                today: todayRecord ? 'present' : 'pending',
                lastRecorded: allRecords.length > 0 ? allRecords[0].date : null,
                streak,
                totalDays
            }));
        } catch (error) {
            console.error('Error loading attendance status:', error);
        }
    };

    const loadPosts = async (tribeId) => {
        try {
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    students!posts_author_id_fkey(full_name),
                    sbo_officers!posts_sbo_officer_id_fkey(full_name),
                    faculty!posts_faculty_id_fkey(full_name),
                    admins!posts_admin_id_fkey(full_name)
                `)
                .eq('approved', true)
                .order('created_at', { ascending: false });

            if (postsError) {
                console.error('Error loading posts:', postsError);
                return;
            }

            // Process posts to get author names
            const processedPosts = postsData.map(post => {
                let authorName = 'Unknown Author';
                let authorType = 'Unknown';

                if (post.students?.full_name) {
                    authorName = post.students.full_name;
                    authorType = 'Student';
                } else if (post.sbo_officers?.full_name) {
                    authorName = post.sbo_officers.full_name;
                    authorType = 'SBO Officer';
                } else if (post.faculty?.full_name) {
                    authorName = post.faculty.full_name;
                    authorType = 'Faculty';
                } else if (post.admins?.full_name) {
                    authorName = post.admins.full_name;
                    authorType = 'Admin';
                }

                return {
                    ...post,
                    authorName,
                    authorType
                };
            });

            setPosts(processedPosts);
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };

    const generateQRCode = async (schoolId) => {
        try {
            const qrDataUrl = await QRCode.toDataURL(schoolId, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#1e3a8a',
                    light: '#ffffff'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
            toast({
                title: "Error",
                description: "Failed to generate QR code",
                variant: "destructive"
            });
        }
    };

    const downloadQR = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = `qr-code-${user.school_id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "QR Code Downloaded",
                description: "Your QR code has been saved to your device",
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/auth';
    };

    const handleLike = async (postId) => {
        try {
            // Check if user already liked this post
            const { data: existingLike, error: checkError } = await supabase
                .from('post_likes')
                .select('*')
                .eq('post_id', postId)
                .eq('student_id', user.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking like:', checkError);
                return;
            }

            if (existingLike) {
                // Unlike the post
                const { error: unlikeError } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('student_id', user.id);

                if (unlikeError) {
                    console.error('Error unliking post:', unlikeError);
                    return;
                }

                // Update posts state
                setPosts(prev => prev.map(post =>
                    post.id === postId
                        ? { ...post, likes_count: Math.max(0, (post.likes_count || 0) - 1) }
                        : post
                ));

                toast({
                    title: "Post Unliked",
                    description: "You unliked this post",
                });
            } else {
                // Like the post
                const { error: likeError } = await supabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        student_id: user.id
                    });

                if (likeError) {
                    console.error('Error liking post:', likeError);
                    return;
                }

                // Update posts state
                setPosts(prev => prev.map(post =>
                    post.id === postId
                        ? { ...post, likes_count: (post.likes_count || 0) + 1 }
                        : post
                ));

                toast({
                    title: "Post Liked",
                    description: "You liked this post",
                });
            }
        } catch (error) {
            console.error('Error handling like:', error);
            toast({
                title: "Error",
                description: "Failed to like/unlike post",
                variant: "destructive"
            });
        }
    };

    const handleNewPost = async () => {
        if (!newPost.trim()) {
            toast({
                title: "Error",
                description: "Please enter some content for your post",
                variant: "destructive"
            });
            return;
        }

        try {
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert({
                    content: newPost,
                    author_id: user.id,
                    author_type: 'student',
                    tribe_id: user.tribe_id,
                    approved: false
                })
                .select()
                .single();

            if (postError) {
                console.error('Error creating post:', postError);
                toast({
                    title: "Error",
                    description: "Failed to create post",
                    variant: "destructive"
                });
                return;
            }

            setNewPost("");
            toast({
                title: "Post Created",
                description: "Your post has been submitted for approval",
            });

            // Reload posts
            await loadPosts(user.tribe_id);
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        }
    };

    const getAttendanceStatusIcon = (status) => {
        switch (status) {
            case "present":
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case "absent":
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case "pending":
                return <Clock className="h-5 w-5 text-yellow-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    const getAttendanceStatusText = (status) => {
        switch (status) {
            case "present":
                return "Present";
            case "absent":
                return "Absent";
            case "pending":
                return "Not Recorded";
            default:
                return "Unknown";
        }
    };

    const getAttendanceStatusColor = (status) => {
        switch (status) {
            case "present":
                return "text-green-600";
            case "absent":
                return "text-red-600";
            case "pending":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    const NavigationContent = () => (
        <div className="space-y-6 overflow-y-auto max-h-screen">
            {/* User Profile Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                        </div>
                        <h3 className="font-semibold text-lg">{user?.full_name || 'Student'}</h3>
                        <p className="text-sm text-muted-foreground">Student</p>
                        <Badge variant="secondary" className="mt-2">
                            <Shield className="h-3 w-3 mr-1" />
                            {tribeInfo?.name || 'No Tribe'}
                        </Badge>
                    </div>
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
                            Home Feed
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
                            variant={activeTab === "tribe" ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab("tribe");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            My Tribe
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
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Attendance Rate</span>
                        <span className="font-semibold text-green-600">
                            {attendanceStatus.totalDays > 0
                                ? Math.round((attendanceStatus.streak / attendanceStatus.totalDays) * 100)
                                : 0}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tribe Rank</span>
                        <span className="font-semibold text-blue-600">#{tribeInfo?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Points Earned</span>
                        <span className="font-semibold text-purple-600">{attendanceStatus.totalDays * 10}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Streak</span>
                        <span className="font-semibold text-orange-600">{attendanceStatus.streak} days</span>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Today's Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-3">
                        {getAttendanceStatusIcon(attendanceStatus.today)}
                        <div>
                            <p className={`font-semibold ${getAttendanceStatusColor(attendanceStatus.today)}`}>
                                {getAttendanceStatusText(attendanceStatus.today)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {attendanceStatus.lastRecorded
                                    ? `Last: ${new Date(attendanceStatus.lastRecorded).toLocaleDateString()}`
                                    : 'No previous records'
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your QR Code</CardTitle>
                    <CardDescription>Show this to SBO officers for attendance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        {qrCodeUrl ? (
                            <div className="space-y-3">
                                <img
                                    src={qrCodeUrl}
                                    alt="Student QR Code"
                                    className="w-32 h-32 mx-auto border-2 border-primary/20 rounded-lg shadow-md"
                                />
                                <Button onClick={downloadQR} size="sm" className="w-full">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        ) : (
                            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                <QrCode className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">Please log in to access the student portal.</p>
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
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <span className="font-semibold text-lg">Student Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">{tribeInfo?.name || 'No Tribe'}</span>
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
                                            <SheetTitle>Student Dashboard</SheetTitle>
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
                    <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-3'}`}>
                        {activeTab === "feed" && (
                            <>
                                {/* Create Post */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex space-x-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="What's on your mind?"
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
                                                        Post
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Posts Feed */}
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <Card key={post.id}>
                                            <CardHeader>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{post.authorName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(post.created_at).toLocaleDateString()} • {post.authorType}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-800 mb-4">{post.content}</p>
                                                <div className="flex items-center space-x-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleLike(post.id)}
                                                    >
                                                        <Heart className="h-4 w-4 mr-1" />
                                                        {post.likes_count || 0}
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <MessageCircle className="h-4 w-4 mr-1" />
                                                        Comment
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Share2 className="h-4 w-4 mr-1" />
                                                        Share
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === "leaderboard" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Trophy className="h-6 w-6 text-yellow-500" />
                                        <span>Leaderboard</span>
                                    </CardTitle>
                                    <CardDescription>Top performing students and tribes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Leaderboard feature will be implemented soon.</p>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "tribe" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Shield className="h-6 w-6 text-blue-500" />
                                        <span>My Tribe</span>
                                    </CardTitle>
                                    <CardDescription>Your tribe's activities and attendance information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Tribe Info */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-3">Tribe Information</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-blue-700">Name:</span>
                                                    <p className="font-semibold text-blue-900">{tribeInfo?.name || 'No Tribe'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-blue-700">Members:</span>
                                                    <p className="font-semibold text-blue-900">Loading...</p>
                                                </div>
                                                <div>
                                                    <span className="text-blue-700">Attendance Rate:</span>
                                                    <p className="font-semibold text-blue-900">
                                                        {attendanceStatus.totalDays > 0
                                                            ? Math.round((attendanceStatus.streak / attendanceStatus.totalDays) * 100)
                                                            : 0}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-blue-700">Total Points:</span>
                                                    <p className="font-semibold text-blue-900">{attendanceStatus.totalDays * 10}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Your Attendance Status */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-green-900 mb-3">Your Attendance</h4>
                                            <div className="flex items-center space-x-3">
                                                {getAttendanceStatusIcon(attendanceStatus.today)}
                                                <span className={`font-semibold ${getAttendanceStatusColor(attendanceStatus.today)}`}>
                                                    {getAttendanceStatusText(attendanceStatus.today)}
                                                </span>
                                            </div>
                                            <div className="mt-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-green-700">Current Streak:</span>
                                                    <span className="font-semibold text-green-900">{attendanceStatus.streak} days</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-green-700">Total Days:</span>
                                                    <span className="font-semibold text-green-900">{attendanceStatus.totalDays}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR Code Section */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Your Attendance QR Code</h4>
                                            <div className="text-center">
                                                {qrCodeUrl ? (
                                                    <div className="space-y-3">
                                                        <img
                                                            src={qrCodeUrl}
                                                            alt="Student QR Code"
                                                            className="w-32 h-32 mx-auto border-2 border-primary/20 rounded-lg shadow-md"
                                                        />
                                                        <p className="text-sm text-gray-600">
                                                            Show this QR code to SBO officers for attendance tracking
                                                        </p>
                                                        <Button onClick={downloadQR} size="sm">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download QR Code
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <QrCode className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Attendance Guidelines */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-yellow-900 mb-2">Attendance Guidelines:</h4>
                                            <ul className="text-sm text-yellow-800 space-y-1">
                                                <li>• Time-in is allowed from 7:00 AM to 12:00 PM</li>
                                                <li>• Time-out is allowed from 1:00 PM to 5:00 PM</li>
                                                <li>• Regular attendance contributes to your tribe's score</li>
                                                <li>• Keep your QR code accessible on your phone</li>
                                                <li>• Contact SBO if you encounter any issues</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "events" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Calendar className="h-6 w-6 text-purple-500" />
                                        <span>Events</span>
                                    </CardTitle>
                                    <CardDescription>School and tribe events with attendance tracking</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Event QR Code */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-purple-900 mb-2">Event Attendance QR Code</h4>
                                            <div className="text-center">
                                                {qrCodeUrl ? (
                                                    <div className="space-y-3">
                                                        <img
                                                            src={qrCodeUrl}
                                                            alt="Event QR Code"
                                                            className="w-32 h-32 mx-auto border-2 border-purple-300 rounded-lg shadow-md"
                                                        />
                                                        <p className="text-sm text-purple-700">
                                                            Event Attendance QR Code
                                                        </p>
                                                        <p className="text-xs text-purple-600">
                                                            Use this QR code for event-specific attendance tracking
                                                        </p>
                                                        <Button onClick={downloadQR} size="sm" variant="outline">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download Event QR
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <QrCode className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-center text-muted-foreground">
                                            <p>This QR code can be used for any tribe or school event attendance.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard; 