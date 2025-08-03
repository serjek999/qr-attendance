"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import EventsManagement from '@/components/EventsManagement';
import {
    GraduationCap,
    Trophy,
    Users,
    Calendar,
    LogOut,
    Home,
    BarChart3,
    Shield,
    Bell,
    Settings,
    FileText,
    TrendingUp,
    UserCheck,
    UserX,
    Activity,
    Menu,
    BookOpen,
    Award,
    Target,
    Download,
    MessageSquare,
    Send
} from "lucide-react";
import Link from "next/link";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const FacultyHome = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { toast } = useToast();

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
            setUser(JSON.parse(userData));
        } else {
            // Redirect to login if no user
            window.location.href = "/auth";
        }

        // Load posts and stats
        loadPosts();
        loadStats();

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const loadStats = async () => {
        try {
            // Load user counts and attendance data
            const { data: students } = await supabase.from('students').select('*');
            const { data: tribes } = await supabase.from('tribes').select('*');
            const { data: attendance } = await supabase.from('attendance_records').select('*');

            // Calculate attendance for today
            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = attendance?.filter(record =>
                record.date === today
            ) || [];

            const presentToday = todayAttendance.length;
            const totalStudentsCount = students?.length || 0;
            const attendanceRate = totalStudentsCount > 0 ? Math.round((presentToday / totalStudentsCount) * 100) : 0;

            setStats({
                totalStudents: students?.length || 0,
                presentToday,
                absentToday: totalStudentsCount - presentToday,
                attendanceRate,
                tribes: tribes || []
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

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
                .order('created_at', { ascending: false })
                .limit(20);

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

    const handleNewPost = async () => {
        if (!newPost.trim()) {
            toast({
                title: "Error",
                description: "Please enter a post content",
                variant: "destructive"
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('posts')
                .insert({
                    author_type: 'faculty',
                    faculty_id: user.id,
                    content: newPost,
                    tribe_id: null, // Faculty posts are system-wide
                    approved: true // Faculty posts are auto-approved
                });

            if (error) {
                console.error('Error creating post:', error);
                toast({
                    title: "Error",
                    description: "Failed to create post",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Post created successfully"
                });
                setNewPost("");
                loadPosts(); // Reload posts
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
    };

    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
        tribes: []
    });

    const mockLeaderboard = [
        // TODO: Replace with actual API call to fetch leaderboard
    ];

    const NavigationContent = () => (
        <div className="space-y-6 overflow-y-auto max-h-screen">
            {/* User Profile Card */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'F'}
                        </div>
                        <h3 className="font-semibold text-lg text-white">{user?.full_name || 'Faculty'}</h3>
                        <p className="text-sm text-white/70">Faculty Member</p>
                        <Badge className="mt-2 bg-white/20 text-white">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Academic Staff
                        </Badge>
                    </div>
                </CardContent>
            </Card>



            {/* Navigation */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-4">
                    <nav className="space-y-2">
                        <Button
                            className={`w-full justify-start ${activeTab === "overview" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("overview");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Overview
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "feed" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("feed");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Activity className="h-4 w-4 mr-2" />
                            Feed
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "reports" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("reports");
                                setIsSheetOpen(false);
                            }}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Reports
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
                            className={`w-full justify-start ${activeTab === "analytics" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("analytics");
                                setIsSheetOpen(false);
                            }}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Analytics
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
                        <Button
                            className={`w-full justify-start ${activeTab === "scoring" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("scoring");
                                setIsSheetOpen(false);
                            }}
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            Tribe Scoring
                        </Button>
                    </nav>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Today&apos;s Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Total Students</span>
                        <span className="font-semibold text-blue-400">{stats.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Present Today</span>
                        <span className="font-semibold text-green-400">{stats.presentToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Attendance Rate</span>
                        <span className="font-semibold text-purple-400">{stats.attendanceRate}%</span>
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
                                <p className="text-sm font-medium">Attendance report ready</p>
                                <p className="text-xs text-muted-foreground">Today&apos;s data has been processed</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">High attendance rate</p>
                                <p className="text-xs text-muted-foreground">94.5% attendance today</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium">New analytics available</p>
                                <p className="text-xs text-muted-foreground">Weekly trends updated</p>
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
                                            <SheetTitle>Faculty Dashboard</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <NavigationContent />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            <div className="flex items-center space-x-2">
                                <GraduationCap className="h-6 w-6 text-white" />
                                <span className="font-semibold text-lg text-white">Faculty Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <BookOpen className="h-4 w-4 text-white" />
                                <span className="text-sm font-medium text-white">Faculty Member</span>
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
                            <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                                <NavigationContent />
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-3'}`}>
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                {/* Welcome Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Target className="h-5 w-5 mr-2 text-purple-600" />
                                            Welcome, {user.full_name || 'Faculty'}!
                                        </CardTitle>
                                        <CardDescription>Here&apos;s an overview of today&apos;s attendance and key metrics</CardDescription>
                                    </CardHeader>
                                </Card>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <UserCheck className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Present Today</p>
                                                    <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
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
                                                    <p className="text-sm text-muted-foreground">Absent Today</p>
                                                    <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                                    <p className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Tribe Performance */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Shield className="h-5 w-5 mr-2 text-blue-600" />
                                            Tribe Performance Today
                                        </CardTitle>
                                        <CardDescription>Attendance breakdown by tribe</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {stats.tribes.map((tribe) => (
                                                <div key={tribe.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <Shield className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">Tribe {tribe.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {tribe.present}/{tribe.total} students
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-blue-600">{tribe.rate}%</p>
                                                        <p className="text-sm text-muted-foreground">attendance</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "feed" && (
                            <div className="space-y-6">
                                {/* Feed Header */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Activity className="h-5 w-5 mr-2 text-purple-600" />
                                            Community Feed
                                        </CardTitle>
                                        <CardDescription>Latest posts and announcements from students and staff</CardDescription>
                                    </CardHeader>
                                </Card>

                                {/* Create Post */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                                            Create Post
                                        </CardTitle>
                                        <CardDescription>Share announcements or updates with the community</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <Textarea
                                                placeholder="What&apos;s on your mind? Share an announcement or update..."
                                                value={newPost}
                                                onChange={(e) => setNewPost(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            <div className="flex justify-end">
                                                <Button onClick={handleNewPost} disabled={!newPost.trim()}>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Post
                                                </Button>
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
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
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
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {posts.length === 0 && (
                                        <Card>
                                            <CardContent className="p-6 text-center">
                                                <p className="text-muted-foreground">No posts yet. Check back later for updates!</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "reports" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                            Attendance Reports
                                        </CardTitle>
                                        <CardDescription>Generate and view detailed attendance reports</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">Reports Dashboard</h3>
                                            <p className="text-muted-foreground mb-4">Access comprehensive attendance analytics and insights</p>
                                            <div className="flex space-x-2 justify-center">
                                                <Button variant="default">
                                                    <BarChart3 className="h-4 w-4 mr-2" />
                                                    Generate Report
                                                </Button>
                                                <Button variant="outline">
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export Data
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
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

                        {activeTab === "analytics" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                                            Analytics Dashboard
                                        </CardTitle>
                                        <CardDescription>Advanced analytics and insights</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <Activity className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
                                            <p className="text-muted-foreground">Advanced analytics features are being developed</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "events" && <EventsManagement user={user} mode="events" />}
                        {activeTab === "scoring" && <EventsManagement user={user} mode="scoring" />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyHome; 