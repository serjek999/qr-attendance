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

const StudentHome = () => {
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

            if (!todayError && todayRecord) {
                let status = 'partial';
                if (todayRecord.time_in && todayRecord.time_out) {
                    status = 'present';
                } else if (!todayRecord.time_in && !todayRecord.time_out) {
                    status = 'absent';
                }
                setAttendanceStatus(prev => ({
                    ...prev,
                    today: status,
                    lastRecorded: today
                }));
            }

            // Get attendance statistics
            const { data: allRecords, error: recordsError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false });

            if (!recordsError && allRecords) {
                let streak = 0;
                let totalDays = allRecords.length;

                // Calculate streak
                for (let i = 0; i < allRecords.length; i++) {
                    const record = allRecords[i];
                    if (record.status === 'present' || (record.time_in && record.time_out)) {
                        streak++;
                    } else {
                        break;
                    }
                }

                setAttendanceStatus(prev => ({
                    ...prev,
                    streak,
                    totalDays
                }));
            }

        } catch (error) {
            console.error('Error loading attendance status:', error);
        }
    };

    const loadPosts = async (tribeId) => {
        try {
            let query = supabase
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
                .order('created_at', { ascending: false })
                .limit(20);

            if (tribeId) {
                // Show posts from student's tribe AND system-wide posts (admin, faculty, SBO)
                query = query.or(`tribe_id.eq.${tribeId},tribe_id.is.null`);
            }

            const { data: postsData, error: postsError } = await query;

            if (!postsError && postsData) {
                // Process posts to get author information
                const processedPosts = postsData.map(post => {
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
                        authorType,
                        isLiked: false // TODO: Check if user has liked this post
                    };
                });

                setPosts(processedPosts);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };

    const generateQRCode = async (schoolId) => {
        try {
            // Check if schoolId is provided
            if (!schoolId) {
                console.log('No school ID provided, skipping QR generation');
                return;
            }

            // Check if we're in the browser environment
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                console.log('Not in browser environment, skipping QR generation');
                return;
            }

            // Additional check to ensure we're fully in client-side
            if (!window.navigator || !window.navigator.userAgent) {
                console.log('Navigator not available, skipping QR generation');
                return;
            }

            // Check if canvas is supported
            if (!window.HTMLCanvasElement) {
                console.log('Canvas not supported, skipping QR generation');
                return;
            }

            // Wait for the component to be fully mounted
            await new Promise(resolve => setTimeout(resolve, 200));

            // Dynamically import QRCode to avoid SSR issues
            const QRCode = (await import('qrcode')).default;

            // Additional check to ensure QRCode is properly loaded
            if (!QRCode || typeof QRCode.toDataURL !== 'function') {
                console.log('QRCode library not properly loaded');
                return;
            }

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
            // Only show toast if we're in browser environment
            if (typeof window !== 'undefined') {
                toast({
                    title: "Error",
                    description: "Failed to generate QR code",
                    variant: "destructive"
                });
            }
        }
    };

    const downloadQR = () => {
        if (qrCodeUrl && typeof document !== 'undefined') {
            const link = document.createElement('a');
            link.download = `${user.school_id}-qr-code.png`;
            link.href = qrCodeUrl;
            link.click();

            toast({
                title: "QR Code Downloaded",
                description: "Your QR code has been saved to your device"
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
    };

    const handleLike = async (postId) => {
        try {
            // Toggle like status
            const post = posts.find(p => p.id === postId);
            const isLiked = post.isLiked;

            if (isLiked) {
                // Remove like
                const { error: unlikeError } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id)
                    .eq('user_type', 'student');

                if (!unlikeError) {
                    // Update post likes count
                    const { error: updateError } = await supabase
                        .from('posts')
                        .update({ likes_count: post.likes_count - 1 })
                        .eq('id', postId);

                    if (!updateError) {
                        setPosts(prev => prev.map(p =>
                            p.id === postId
                                ? { ...p, likes_count: p.likes_count - 1, isLiked: false }
                                : p
                        ));
                    }
                }
            } else {
                // Add like
                const { error: likeError } = await supabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        user_id: user.id,
                        user_type: 'student'
                    });

                if (!likeError) {
                    // Update post likes count
                    const { error: updateError } = await supabase
                        .from('posts')
                        .update({ likes_count: post.likes_count + 1 })
                        .eq('id', postId);

                    if (!updateError) {
                        setPosts(prev => prev.map(p =>
                            p.id === postId
                                ? { ...p, likes_count: p.likes_count + 1, isLiked: true }
                                : p
                        ));
                    }
                }
            }
        } catch (error) {
            console.error('Error handling like:', error);
            toast({
                title: "Error",
                description: "Failed to update like",
                variant: "destructive"
            });
        }
    };

    const handleNewPost = async () => {
        if (!newPost.trim()) return;

        try {
            const { data: newPostData, error: postError } = await supabase
                .from('posts')
                .insert({
                    author_id: user.id,
                    content: newPost,
                    tribe_id: user.tribe_id,
                    approved: false // Posts need approval
                })
                .select()
                .single();

            if (postError) {
                throw postError;
            }

            setNewPost("");

            toast({
                title: "Post Created! 🎉",
                description: "Your post has been submitted for approval and will be visible to your tribe soon."
            });

            // Reload posts to show the new one
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
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "absent":
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getAttendanceStatusText = (status) => {
        switch (status) {
            case "present":
                return "Present";
            case "absent":
                return "Absent";
            case "pending":
                return "Pending";
            default:
                return "Not Recorded";
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
                        <span className="text-sm text-muted-foreground">Current Streak</span>
                        <span className="font-semibold text-orange-600">{attendanceStatus.streak} days</span>
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
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">New tribe event</p>
                                <p className="text-xs text-muted-foreground">Basketball tournament this weekend</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">Attendance recorded</p>
                                <p className="text-xs text-muted-foreground">You&apos;ve been marked present today</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">QR Code ready</p>
                                <p className="text-xs text-muted-foreground">Your attendance QR code is available</p>
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
                                                    placeholder="What&apos;s on your mind?"
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
                                                            {post.authorType === 'system' && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    System
                                                                </Badge>
                                                            )}
                                                            {post.tribes && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {post.tribes.name}
                                                                </Badge>
                                                            )}
                                                            <span className="text-sm text-muted-foreground">•</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(post.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="mb-4">{post.content}</p>
                                                        {post.image_url && (
                                                            <img
                                                                src={post.image_url}
                                                                alt="Post"
                                                                className="w-full rounded-lg mb-4"
                                                            />
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex space-x-4">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleLike(post.id)}
                                                                    className={post.isLiked ? "text-red-500" : ""}
                                                                >
                                                                    <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                                                                    {post.likes_count || 0}
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
                                                                    {post.comments_count || 0}
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

                                    {posts.length === 0 && (
                                        <Card>
                                            <CardContent className="p-6 text-center">
                                                <p className="text-muted-foreground">No posts yet. Be the first to share something with your tribe!</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </>
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
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">Leaderboard feature coming soon!</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "tribe" && (
                            <div className="space-y-6">
                                {/* Tribe Info Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Shield className="h-5 w-5 mr-2 text-blue-600" />
                                            My Tribe - {tribeInfo?.name || 'No Tribe'}
                                        </CardTitle>
                                        <CardDescription>Your tribe&apos;s activities and attendance information</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Tribe Members */}
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-blue-900 mb-3">Tribe Members</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Total Members</span>
                                                        <span className="font-semibold">-</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Present Today</span>
                                                        <span className="font-semibold text-green-600">-</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Attendance Rate</span>
                                                        <span className="font-semibold text-blue-600">-</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Your Attendance Status */}
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-green-900 mb-3">Your Attendance</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Today&apos;s Status</span>
                                                        <div className="flex items-center space-x-2">
                                                            {getAttendanceStatusIcon(attendanceStatus.today)}
                                                            <span className={`font-semibold ${getAttendanceStatusColor(attendanceStatus.today)}`}>
                                                                {getAttendanceStatusText(attendanceStatus.today)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Current Streak</span>
                                                        <span className="font-semibold text-purple-600">{attendanceStatus.streak} days</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Total Days</span>
                                                        <span className="font-semibold text-gray-600">{attendanceStatus.totalDays}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* QR Code Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <QrCode className="h-5 w-5 mr-2 text-green-600" />
                                            Your Attendance QR Code
                                        </CardTitle>
                                        <CardDescription>Show this QR code to SBO officers for attendance tracking</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center space-y-4">
                                            <div ref={qrRef} className="flex justify-center">
                                                {qrCodeUrl && (
                                                    <img
                                                        src={qrCodeUrl}
                                                        alt="Student QR Code"
                                                        className="border-2 border-primary/20 rounded-lg shadow-md"
                                                    />
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p className="mb-2">Student ID: <span className="font-mono font-semibold">{user.school_id}</span></p>
                                                <p>Keep this QR code accessible on your phone for quick scanning!</p>
                                            </div>
                                            <Button onClick={downloadQR} className="w-full">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download QR Code
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Important Reminders */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Important Reminders</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">Attendance Guidelines:</h4>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>• Time-in is allowed from 7:00 AM to 11:30 AM</li>
                                                <li>• Time-out is allowed from 1:00 PM to 5:00 PM</li>
                                                <li>• Keep your QR code accessible on your phone</li>
                                                <li>• Contact SBO if you encounter any issues</li>
                                                <li>• Regular attendance contributes to your tribe&apos;s score</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "events" && (
                            <div className="space-y-6">
                                {/* Upcoming Events */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-green-600" />
                                            Upcoming Events
                                        </CardTitle>
                                        <CardDescription>School and tribe events with attendance tracking</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">Events feature coming soon!</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Event Attendance QR Code */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                                            Event Attendance QR Code
                                        </CardTitle>
                                        <CardDescription>Use this QR code for event-specific attendance tracking</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center space-y-4">
                                            <div className="flex justify-center">
                                                {qrCodeUrl && (
                                                    <img
                                                        src={qrCodeUrl}
                                                        alt="Event QR Code"
                                                        className="border-2 border-purple-200 rounded-lg shadow-md"
                                                    />
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p className="mb-2">Event QR Code for: <span className="font-semibold">All Events</span></p>
                                                <p>This QR code can be used for any tribe or school event attendance.</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button onClick={downloadQR} className="flex-1">
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download QR
                                                </Button>
                                                <Button variant="outline" className="flex-1">
                                                    <QrCode className="h-4 w-4 mr-2" />
                                                    Show QR
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentHome; 