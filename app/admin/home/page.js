"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    Crown,
    Target,
    Download,
    Database,
    UserPlus,
    ShieldCheck,
    Heart,
    MessageCircle,
    Share2,
    Image,
    Smile
} from "lucide-react";
import Link from "next/link";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const AdminHome = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [newPost, setNewPost] = useState("");
    const [posts, setPosts] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showTribeModal, setShowTribeModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tribeToDelete, setTribeToDelete] = useState(null);
    const [tribes, setTribes] = useState([
        // TODO: Replace with actual API call to fetch tribes
    ]);
    const [newTribe, setNewTribe] = useState({ name: "", color: "bg-blue-500" });
    const { toast } = useToast();

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Get user from localStorage first (immediate access)
        const userData = localStorage.getItem("currentUser");
        if (userData) {
            const parsedUser = JSON.parse(userData);

            // Basic role check
            if (parsedUser && parsedUser.role === 'admin') {
                // Always fetch fresh data from database first
                const loadUserFromDatabase = async () => {
                    try {
                        if (parsedUser && parsedUser.email) {
                            const { data: admin, error } = await supabase
                                .from('admins')
                                .select('*')
                                .eq('email', parsedUser.email)
                                .single();

                            if (error || !admin) {
                                console.error('User verification failed:', error);
                                // Fallback to localStorage data
                                setUser({
                                    id: parsedUser.id,
                                    email: parsedUser.email,
                                    full_name: parsedUser.full_name,
                                    role: 'admin'
                                });
                                toast({
                                    title: "Verification Warning",
                                    description: "Please log in again to refresh your session",
                                    variant: "destructive"
                                });
                                return;
                            }

                            // Always use fresh data from database
                            console.log('Setting Admin user from database:', admin.full_name);
                            setUser({
                                id: admin.id,
                                email: admin.email,
                                full_name: admin.full_name,
                                role: 'admin'
                            });
                        }
                    } catch (error) {
                        console.error('Database verification error:', error);
                        // Fallback to localStorage data
                        setUser({
                            id: parsedUser.id,
                            email: parsedUser.email,
                            full_name: parsedUser.full_name,
                            role: 'admin'
                        });
                    }
                };

                // Load user data from database immediately
                loadUserFromDatabase();
            } else {
                // Wrong role - redirect to login
                console.error('User is not an admin. Role:', parsedUser?.role);
                localStorage.removeItem("currentUser");
                window.location.href = "/auth";
            }
        } else {
            // No user data - redirect to login
            window.location.href = "/auth";
        }

        // Load tribes, posts, and stats
        loadTribes();
        loadMockPosts();
        loadStats();

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const loadTribes = async () => {
        try {
            const { data: tribesData, error } = await supabase
                .from('tribes')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error loading tribes:', error);
                toast({
                    title: "Error",
                    description: "Failed to load tribes",
                    variant: "destructive"
                });
            } else {
                setTribes(tribesData || []);
            }
        } catch (error) {
            console.error('Error loading tribes:', error);
        }
    };

    const loadStats = async () => {
        try {
            // Load user counts
            const { data: students } = await supabase.from('students').select('*');
            const { data: admins } = await supabase.from('admins').select('*');
            const { data: faculty } = await supabase.from('faculty').select('*');
            const { data: sboOfficers } = await supabase.from('sbo_officers').select('*');
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
                totalSBO: sboOfficers?.length || 0,
                totalFaculty: faculty?.length || 0,
                presentToday,
                absentToday: totalStudentsCount - presentToday,
                attendanceRate,
                tribes: tribes || []
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadMockPosts = async () => {
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
                        // For now, we'll show them as System posts
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
        if (!newPost.trim()) return;

        try {
            // Create post in database with correct schema for admin posts
            const { data: newPostData, error } = await supabase
                .from('posts')
                .insert({
                    content: newPost,
                    author_type: 'admin',
                    admin_id: user.id,
                    tribe_id: null, // Admin posts are system-wide
                    approved: true // Admin posts are auto-approved
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating post:', error);
                toast({
                    title: "Error",
                    description: `Failed to create post: ${error.message}`,
                    variant: "destructive"
                });
                return;
            }

            setNewPost("");

            // Reload posts to show the new one
            await loadMockPosts();

            toast({
                title: "Post Created! 🎉",
                description: "Your announcement has been posted to all users."
            });
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        }
    };

    const handleLike = (postId) => {
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    isLiked: !post.isLiked
                };
            }
            return post;
        }));
    };

    const handleAddTribe = async () => {
        if (!newTribe.name.trim()) {
            toast({
                title: "Error",
                description: "Please enter a tribe name.",
                variant: "destructive"
            });
            return;
        }

        // Check if tribe already exists
        const existingTribe = tribes.find(t => t.name.toLowerCase() === newTribe.name.toLowerCase());

        if (existingTribe) {
            toast({
                title: "Error",
                description: "A tribe with this name already exists.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Insert new tribe into database
            const { data: newTribeData, error } = await supabase
                .from('tribes')
                .insert({
                    name: newTribe.name
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating tribe:', error);
                toast({
                    title: "Error",
                    description: `Failed to create tribe: ${error.message}`,
                    variant: "destructive"
                });
                return;
            }

            // Update local state
            setTribes(prev => [...prev, newTribeData]);
            setNewTribe({ name: "", color: "bg-blue-500" });
            setShowTribeModal(false);

            toast({
                title: "Tribe Added",
                description: `Tribe "${newTribeData.name}" has been created successfully.`
            });
        } catch (error) {
            console.error('Error creating tribe:', error);
            toast({
                title: "Error",
                description: "Failed to create tribe",
                variant: "destructive"
            });
        }
    };

    const handleDeleteTribe = async (tribeId) => {
        const tribe = tribes.find(t => t.id === tribeId);

        // Check if tribe has members
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id')
            .eq('tribe_id', tribeId);

        if (studentsError) {
            console.error('Error checking tribe members:', studentsError);
            toast({
                title: "Error",
                description: "Failed to check tribe members",
                variant: "destructive"
            });
            return;
        }

        if (students && students.length > 0) {
            toast({
                title: "Cannot Delete",
                description: `Cannot delete tribe "${tribe.name}" because it has ${students.length} members.`,
                variant: "destructive"
            });
            return;
        }

        setTribeToDelete(tribe);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteTribe = async () => {
        if (!tribeToDelete) return;

        try {
            // Delete tribe from database
            const { error } = await supabase
                .from('tribes')
                .delete()
                .eq('id', tribeToDelete.id);

            if (error) {
                console.error('Error deleting tribe:', error);
                toast({
                    title: "Error",
                    description: `Failed to delete tribe: ${error.message}`,
                    variant: "destructive"
                });
                return;
            }

            // Update local state
            setTribes(prev => prev.filter(t => t.id !== tribeToDelete.id));
            toast({
                title: "Tribe Deleted",
                description: `Tribe "${tribeToDelete.name}" has been deleted successfully.`
            });

            setTribeToDelete(null);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Error deleting tribe:', error);
            toast({
                title: "Error",
                description: "Failed to delete tribe",
                variant: "destructive"
            });
        }
    };

    const handleEditTribe = async (tribeId, newName) => {
        if (!newName.trim()) {
            toast({
                title: "Error",
                description: "Please enter a valid tribe name.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Update tribe in database
            const { data: updatedTribe, error } = await supabase
                .from('tribes')
                .update({ name: newName })
                .eq('id', tribeId)
                .select()
                .single();

            if (error) {
                console.error('Error updating tribe:', error);
                toast({
                    title: "Error",
                    description: `Failed to update tribe: ${error.message}`,
                    variant: "destructive"
                });
                return;
            }

            // Update local state
            setTribes(prev => prev.map(tribe =>
                tribe.id === tribeId
                    ? { ...tribe, name: newName }
                    : tribe
            ));

            toast({
                title: "Tribe Updated",
                description: "Tribe name has been updated successfully."
            });
        } catch (error) {
            console.error('Error updating tribe:', error);
            toast({
                title: "Error",
                description: "Failed to update tribe",
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
        totalSBO: 0,
        totalFaculty: 0,
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
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                        </div>
                        <h3 className="font-semibold text-lg text-white">{user?.full_name || 'Admin'}</h3>
                        <p className="text-sm text-white/70">Administrator</p>
                        <Badge className="mt-2 bg-white/20 text-white">
                            <Crown className="h-3 w-3 mr-1" />
                            System Admin
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
                            className={`w-full justify-start ${activeTab === "posts" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("posts");
                                setIsSheetOpen(false);
                            }}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            All Posts
                        </Button>
                        <Button
                            className={`w-full justify-start ${activeTab === "management" ? "bg-white/30 text-white backdrop-blur-md" : "bg-transparent text-white/70 hover:bg-white/10"}`}
                            onClick={() => {
                                setActiveTab("management");
                                setIsSheetOpen(false);
                            }}
                        >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Management
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
                    <CardTitle className="text-lg text-white">System Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Total Students</span>
                        <span className="font-semibold text-blue-400">{stats.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">SBO Officers</span>
                        <span className="font-semibold text-green-400">{stats.totalSBO}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Faculty Members</span>
                        <span className="font-semibold text-purple-400">{stats.totalFaculty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Attendance Rate</span>
                        <span className="font-semibold text-orange-400">{stats.attendanceRate}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center text-white">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium text-white">System update available</p>
                                <p className="text-xs text-white/50">New features ready to deploy</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium text-white">High attendance rate</p>
                                <p className="text-xs text-white/50">94.5% attendance today</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                            <div>
                                <p className="text-sm font-medium text-white">New user registration</p>
                                <p className="text-xs text-white/50">2 new SBO officers added</p>
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
                                            <SheetTitle>Admin Dashboard</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <NavigationContent />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            <div className="flex items-center space-x-2">
                                <Crown className="h-6 w-6 text-white" />
                                <span className="font-semibold text-lg text-white">Admin Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <Crown className="h-4 w-4 text-white" />
                                <span className="text-sm font-medium text-white">Administrator</span>
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
                                            <Target className="h-5 w-5 mr-2 text-red-600" />
                                            Welcome, {user.full_name || 'Admin'}!
                                        </CardTitle>
                                        <CardDescription>System overview and key performance metrics</CardDescription>
                                    </CardHeader>
                                </Card>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Students</p>
                                                    <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <Shield className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">SBO Officers</p>
                                                    <p className="text-2xl font-bold text-green-600">{stats.totalSBO}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <GraduationCap className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Faculty</p>
                                                    <p className="text-2xl font-bold text-purple-600">{stats.totalFaculty}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                                    <TrendingUp className="h-6 w-6 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                                    <p className="text-2xl font-bold text-orange-600">{stats.attendanceRate}%</p>
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

                        {activeTab === "reports" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                            System Reports
                                        </CardTitle>
                                        <CardDescription>Generate and view comprehensive system reports</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">Reports Dashboard</h3>
                                            <p className="text-muted-foreground mb-4">Access comprehensive system analytics and insights</p>
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
                                            System Analytics
                                        </CardTitle>
                                        <CardDescription>Advanced analytics and system insights</CardDescription>
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

                        {activeTab === "posts" && (
                            <div className="space-y-6">
                                {/* Create Post */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex space-x-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Create an announcement for all users..."
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
                                                                        post.authorType === 'sbo' ? 'SBO' :
                                                                            post.authorType === 'system' ? 'System' : 'Student'}
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
                                                                    onClick={() => handleLike(post.id)}
                                                                    className={post.isLiked ? "text-red-500" : ""}
                                                                >
                                                                    <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
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
                            </div>
                        )}

                        {activeTab === "management" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <ShieldCheck className="h-5 w-5 mr-2 text-red-600" />
                                            System Management
                                        </CardTitle>
                                        <CardDescription>Manage users, settings, and system configuration</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <Database className="h-16 w-16 text-red-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">Management Panel</h3>
                                            <p className="text-muted-foreground mb-4">System management features are being developed</p>
                                            <div className="flex space-x-2 justify-center">
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        toast({
                                                            title: "User Management",
                                                            description: "User management panel will be available soon."
                                                        });
                                                    }}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Manage Users
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        toast({
                                                            title: "System Settings",
                                                            description: "System settings panel will be available soon."
                                                        });
                                                    }}
                                                >
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    System Settings
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "events" && <EventsManagement user={user} />}
                        {activeTab === "scoring" && <EventsManagement user={user} />}
                    </div>
                </div>
            </div>

            {/* Tribe Management Modal */}
            <Dialog open={showTribeModal} onOpenChange={setShowTribeModal}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Tribe Management</DialogTitle>
                        <DialogDescription>
                            Manage student tribes. Add new tribes, edit existing ones, or delete empty tribes.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-6">
                            {/* Add New Tribe */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Add New Tribe</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Tribe Name</label>
                                        <Input
                                            placeholder="Enter tribe name"
                                            value={newTribe.name}
                                            onChange={(e) => setNewTribe(prev => ({ ...prev, name: e.target.value }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Color</label>
                                        <select
                                            value={newTribe.color}
                                            onChange={(e) => setNewTribe(prev => ({ ...prev, color: e.target.value }))}
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="bg-blue-500">Blue</option>
                                            <option value="bg-green-500">Green</option>
                                            <option value="bg-purple-500">Purple</option>
                                            <option value="bg-orange-500">Orange</option>
                                            <option value="bg-red-500">Red</option>
                                            <option value="bg-pink-500">Pink</option>
                                            <option value="bg-indigo-500">Indigo</option>
                                            <option value="bg-yellow-500">Yellow</option>
                                        </select>
                                    </div>
                                </div>
                                <Button onClick={handleAddTribe} className="w-full">
                                    Add Tribe
                                </Button>
                            </div>

                            {/* Existing Tribes */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Existing Tribes</h3>
                                <div className="space-y-3">
                                    {tribes.map((tribe) => (
                                        <div key={tribe.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-4 h-4 rounded-full ${tribe.color}`}></div>
                                                <div>
                                                    <h4 className="font-medium">{tribe.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {tribe.members} member{tribe.members !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newName = prompt(`Edit tribe name for ${tribe.name}:`, tribe.name);
                                                        if (newName !== null) {
                                                            handleEditTribe(tribe.id, newName);
                                                        }
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteTribe(tribe.id)}
                                                    disabled={tribe.members > 0}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the tribe &quot;{tribeToDelete?.name}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setTribeToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteTribe}
                        >
                            Delete Tribe
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminHome; 