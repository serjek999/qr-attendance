"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useCardAnimation } from '@/hooks/useCardAnimation';
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
    User,
    X
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
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const qrRef = useRef(null);
    const fileInputRef = useRef(null);

    // Card animation hook - 4 main cards (QR code, attendance status, tribe info, posts feed)
    const { getCardAnimationClass, getCardDelayClass } = useCardAnimation(4, 150);

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
                    authorType,
                    images: post.images || []
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

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);

        if (selectedImages.length + files.length > 3) {
            toast({
                title: "Too Many Images",
                description: "You can only upload up to 3 images per post",
                variant: "destructive"
            });
            return;
        }

        const validFiles = files.filter(file => {
            // Define accepted image types - support ALL image formats
            const acceptedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/bmp',
                'image/tiff',
                'image/tif',
                'image/svg+xml',
                'image/avif',
                'image/heic',
                'image/heif',
                'image/ico',
                'image/cur',
                'image/apng',
                'image/jfif',
                'image/pjpeg',
                'image/pjp'
            ];

            if (!acceptedTypes.includes(file.type)) {
                toast({
                    title: "Invalid File Type",
                    description: `${file.name} is not a valid image file. Please select an image file.`,
                    variant: "destructive"
                });
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File Too Large",
                    description: `${file.name} is larger than 5MB. Please choose a smaller image.`,
                    variant: "destructive"
                });
                return false;
            }
            return true;
        });

        setSelectedImages(prev => [...prev, ...validFiles]);
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async () => {
        if (selectedImages.length === 0) return [];

        const uploadedUrls = [];
        setUploading(true);

        try {
            for (const image of selectedImages) {
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name}`;
                const { data, error } = await supabase.storage
                    .from('post-images')
                    .upload(fileName, image);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast({
                title: "Upload Error",
                description: "Failed to upload images",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }

        return uploadedUrls;
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
                // If there's an RLS error, show a helpful message
                if (checkError.message && checkError.message.includes('row-level security')) {
                    toast({
                        title: "Database Update Required",
                        description: "The like feature requires a database update. Please contact your administrator.",
                        variant: "destructive"
                    });
                }
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
                    if (unlikeError.message && unlikeError.message.includes('row-level security')) {
                        toast({
                            title: "Database Update Required",
                            description: "The like feature requires a database update. Please contact your administrator.",
                            variant: "destructive"
                        });
                    }
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
                    if (likeError.message && likeError.message.includes('row-level security')) {
                        toast({
                            title: "Database Update Required",
                            description: "The like feature requires a database update. Please contact your administrator.",
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error",
                            description: "Failed to like post. Please try again.",
                            variant: "destructive"
                        });
                    }
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
        if (!newPost.trim() && selectedImages.length === 0) {
            toast({
                title: "Error",
                description: "Please enter some content or add images for your post",
                variant: "destructive"
            });
            return;
        }

        try {
            setUploading(true);
            const imageUrls = await uploadImages();

            // Prepare post data
            const postData = {
                content: newPost,
                author_id: user.id,
                author_type: 'student',
                tribe_id: user.tribe_id,
                approved: false
            };

            // Only add images if the column exists (will be handled by migration)
            if (imageUrls.length > 0) {
                postData.images = imageUrls;
            }

            const { data: postDataResult, error: postError } = await supabase
                .from('posts')
                .insert(postData)
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
            setSelectedImages([]);
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
        } finally {
            setUploading(false);
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
        <div className="space-y-6">
            {/* User Profile Card */}
            <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(0)} ${getCardDelayClass(0)}`}>
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                        </div>
                        <h3 className="font-semibold text-lg text-white">{user?.full_name || 'Student'}</h3>
                        <p className="text-sm text-white/70">Student</p>
                        <Badge className="mt-2 bg-white/20 text-white">
                            <Shield className="h-3 w-3 mr-1" />
                            {tribeInfo?.name || 'No Tribe'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation */}
            <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(1)} ${getCardDelayClass(1)}`}>
                <CardContent className="p-4">
                    <nav className="space-y-2">
                        <Button
                            className={`w-full justify-start ${activeTab === "feed" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("feed");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Home Feed
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "leaderboard" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("leaderboard");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            Leaderboard
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "tribe" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("tribe");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            My Tribe
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "events" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
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
            <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(2)} ${getCardDelayClass(2)}`}>
                <CardHeader>
                    <CardTitle className="text-lg text-white">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Attendance Rate</span>
                        <span className="font-semibold text-green-400">
                            {attendanceStatus.totalDays > 0
                                ? Math.round((attendanceStatus.streak / attendanceStatus.totalDays) * 100)
                                : 0}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Tribe Rank</span>
                        <span className="font-semibold text-blue-400">#{tribeInfo?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Points Earned</span>
                        <span className="font-semibold text-purple-400">{attendanceStatus.totalDays * 10}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Streak</span>
                        <span className="font-semibold text-orange-400">{attendanceStatus.streak} days</span>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Status */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Today&apos;s Attendance</CardTitle>
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

                            <div className="flex items-center space-x-2">
                                <GraduationCap className="h-6 w-6 text-white" />
                                <span className="font-semibold text-lg text-white">Student Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <Shield className="h-4 w-4 text-white" />
                                <span className="text-sm font-medium text-white">{tribeInfo?.name || 'No Tribe'}</span>
                            </div>

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
                                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(3)} ${getCardDelayClass(3)}`}>
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
                                                    className="mb-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50"
                                                />

                                                {/* Image Preview */}
                                                {selectedImages.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedImages.map((image, index) => (
                                                                <div key={index} className="relative group">
                                                                    <img
                                                                        src={URL.createObjectURL(image)}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeImage(index)}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                                                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            {image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm text-white/50 mt-1">
                                                            {selectedImages.length}/3 images selected • {selectedImages.reduce((total, img) => total + img.size, 0).toFixed(1)} MB total
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            type="button"
                                                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                                            size="sm"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={selectedImages.length >= 3}
                                                        >
                                                            <Image className="h-4 w-4 mr-1" />
                                                            Photo ({selectedImages.length}/3)
                                                        </Button>
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleImageSelect}
                                                            className="hidden"
                                                        />
                                                        <Button
                                                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
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
                                                    <Button
                                                        onClick={handleNewPost}
                                                        disabled={(!newPost.trim() && selectedImages.length === 0) || uploading}
                                                        className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                                                    >
                                                        {uploading ? 'Posting...' : 'Post'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Posts Feed */}
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <Card key={post.id} className="bg-white/10 backdrop-blur-md border border-white/20">
                                            <CardHeader>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{post.authorName}</p>
                                                        <p className="text-sm text-white/70">
                                                            {new Date(post.created_at).toLocaleDateString()} • {post.authorType}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-white mb-4">{post.content}</p>

                                                {/* Post Images */}
                                                {post.images && post.images.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' :
                                                            post.images.length === 2 ? 'grid-cols-2' :
                                                                'grid-cols-3'
                                                            }`}>
                                                            {post.images.map((imageUrl, index) => (
                                                                <div key={index} className="relative group">
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={`Post image ${index + 1}`}
                                                                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'flex';
                                                                        }}
                                                                        loading="lazy"
                                                                    />
                                                                    <div
                                                                        className="hidden w-full h-32 bg-gray-200 rounded-lg items-center justify-center text-gray-500 text-sm"
                                                                        style={{ display: 'none' }}
                                                                    >
                                                                        <span>Image not available</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-4">
                                                    <Button
                                                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                                        size="sm"
                                                        onClick={() => handleLike(post.id)}
                                                    >
                                                        <Heart className="h-4 w-4 mr-1" />
                                                        {post.likes_count || 0}
                                                    </Button>
                                                    <Button className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20" size="sm">
                                                        <MessageCircle className="h-4 w-4 mr-1" />
                                                        Comment
                                                    </Button>
                                                    <Button className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20" size="sm">
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
                            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-white">
                                        <Trophy className="h-6 w-6 text-yellow-400" />
                                        <span>Leaderboard</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">Top performing students and tribes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-white/70">Leaderboard feature will be implemented soon.</p>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "tribe" && (
                            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-white">
                                        <Shield className="h-6 w-6 text-blue-400" />
                                        <span>My Tribe</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">Your tribe&apos;s activities and attendance information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Tribe Info */}
                                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-3">Tribe Information</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-white/70">Name:</span>
                                                    <p className="font-semibold text-white">{tribeInfo?.name || 'No Tribe'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-white/70">Members:</span>
                                                    <p className="font-semibold text-white">Loading...</p>
                                                </div>
                                                <div>
                                                    <span className="text-white/70">Attendance Rate:</span>
                                                    <p className="font-semibold text-white">
                                                        {attendanceStatus.totalDays > 0
                                                            ? Math.round((attendanceStatus.streak / attendanceStatus.totalDays) * 100)
                                                            : 0}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-white/70">Total Points:</span>
                                                    <p className="font-semibold text-white">{attendanceStatus.totalDays * 10}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Your Attendance Status */}
                                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-3">Your Attendance</h4>
                                            <div className="flex items-center space-x-3">
                                                {getAttendanceStatusIcon(attendanceStatus.today)}
                                                <span className={`font-semibold text-white`}>
                                                    {getAttendanceStatusText(attendanceStatus.today)}
                                                </span>
                                            </div>
                                            <div className="mt-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-white/70">Current Streak:</span>
                                                    <span className="font-semibold text-white">{attendanceStatus.streak} days</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/70">Total Days:</span>
                                                    <span className="font-semibold text-white">{attendanceStatus.totalDays}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR Code Section */}
                                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-3">Your Attendance QR Code</h4>
                                            <div className="text-center">
                                                {qrCodeUrl ? (
                                                    <div className="space-y-3">
                                                        <img
                                                            src={qrCodeUrl}
                                                            alt="Student QR Code"
                                                            className="w-32 h-32 mx-auto border-2 border-white/30 rounded-lg shadow-md"
                                                        />
                                                        <p className="text-sm text-white/70">
                                                            Show this QR code to SBO officers for attendance tracking
                                                        </p>
                                                        <Button onClick={downloadQR} size="sm" className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download QR Code
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 mx-auto bg-white/10 rounded-lg flex items-center justify-center">
                                                        <QrCode className="h-8 w-8 text-white/50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Attendance Guidelines */}
                                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">Attendance Guidelines:</h4>
                                            <ul className="text-sm text-white/70 space-y-1">
                                                <li>• Time-in is allowed from 7:00 AM to 12:00 PM</li>
                                                <li>• Time-out is allowed from 1:00 PM to 5:00 PM</li>
                                                <li>• Regular attendance contributes to your tribe&apos;s score</li>
                                                <li>• Keep your QR code accessible on your phone</li>
                                                <li>• Contact SBO if you encounter any issues</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "events" && (
                            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-white">
                                        <Calendar className="h-6 w-6 text-purple-400" />
                                        <span>Events</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">School and tribe events with attendance tracking</CardDescription>
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