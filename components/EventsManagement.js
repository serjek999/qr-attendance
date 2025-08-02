"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCardAnimation } from '@/hooks/useCardAnimation';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Trophy,
    Plus,
    Edit,
    Trash2,
    Award,
    Target,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const EventsManagement = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [tribes, setTribes] = useState([]);
    const [tribeScores, setTribeScores] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [editingScore, setEditingScore] = useState(null);
    const [stats, setStats] = useState({
        totalStudents: 0,
        todayAttendance: 0,
        attendanceRate: 0,
        topTribe: null
    });
    const { toast } = useToast();

    // Card animation hook - 8 cards (4 stats cards + 4 main sections)
    const { getCardAnimationClass, getCardDelayClass } = useCardAnimation(8, 100);

    // Form states
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        max_participants: '',
        tribe_id: '',
        event_type: 'general',
        status: 'upcoming'
    });

    const [scoreForm, setScoreForm] = useState({
        tribe_id: '',
        event_name: '',
        points: '',
        category: 'general',
        description: ''
    });

    useEffect(() => {
        loadEvents();
        loadTribes();
        loadTribeScores();
        loadStats();
    }, []);

    const loadEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    tribes(name)
                `)
                .order('date', { ascending: true });

            if (error) {
                console.error('Error loading events:', error);

                // Check if it's a table doesn't exist error
                if (error.message && error.message.includes('relation "events" does not exist')) {
                    console.log('Events table not found - migration may be needed');
                    setEvents([]); // Set empty array to prevent errors
                    return;
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to load events",
                        variant: "destructive"
                    });
                }
            } else {
                setEvents(data || []);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]); // Set empty array to prevent errors
        }
    };

    const loadTribes = async () => {
        try {
            const { data, error } = await supabase
                .from('tribes')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error loading tribes:', error);
            } else {
                setTribes(data || []);
            }
        } catch (error) {
            console.error('Error loading tribes:', error);
        }
    };

    const loadTribeScores = async () => {
        try {
            const { data, error } = await supabase
                .from('tribe_scores')
                .select(`
                    *,
                    tribes(name)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading tribe scores:', error);

                // Check if it's a table doesn't exist error
                if (error.message && error.message.includes('relation "tribe_scores" does not exist')) {
                    console.log('Tribe scores table not found - migration may be needed');
                    setTribeScores([]); // Set empty array to prevent errors
                    return;
                }
            } else {
                setTribeScores(data || []);
            }
        } catch (error) {
            console.error('Error loading tribe scores:', error);
            setTribeScores([]); // Set empty array to prevent errors
        }
    };

    const loadStats = async () => {
        try {
            // Get total students
            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('id');

            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            const { data: todayAttendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('id')
                .eq('date', today);

            // Get tribes with attendance data
            const { data: tribes, error: tribesError } = await supabase
                .from('tribes')
                .select(`
                    id,
                    name,
                    students(id)
                `);

            if (studentsError || attendanceError || tribesError) {
                console.error('Error loading stats:', { studentsError, attendanceError, tribesError });
                return;
            }

            const totalStudents = students?.length || 0;
            const todayAttendanceCount = todayAttendance?.length || 0;
            const attendanceRate = totalStudents > 0 ? Math.round((todayAttendanceCount / totalStudents) * 100) : 0;

            // Calculate top tribe based on attendance
            let topTribe = null;
            if (tribes && tribes.length > 0) {
                const tribesWithAttendance = tribes.map(tribe => {
                    const tribeStudents = tribe.students?.length || 0;
                    const tribeAttendance = todayAttendance?.filter(record =>
                        tribe.students?.some(student => student.id === record.student_id)
                    )?.length || 0;
                    const tribeRate = tribeStudents > 0 ? Math.round((tribeAttendance / tribeStudents) * 100) : 0;

                    return {
                        id: tribe.id,
                        name: tribe.name,
                        attendanceRate: tribeRate,
                        totalStudents: tribeStudents,
                        presentToday: tribeAttendance
                    };
                });

                // Sort by attendance rate and get the top one
                tribesWithAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate);
                topTribe = tribesWithAttendance[0];
            }

            setStats({
                totalStudents,
                todayAttendance: todayAttendanceCount,
                attendanceRate,
                topTribe
            });

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventForm.title || !eventForm.date || !eventForm.time) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('events')
                .insert({
                    ...eventForm,
                    created_by: user.full_name || user.email,
                    max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
                    tribe_id: eventForm.tribe_id || null
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating event:', error);

                // Check if it's a table doesn't exist error
                if (error.message && error.message.includes('relation "events" does not exist')) {
                    toast({
                        title: "Database Setup Required",
                        description: "Events table not found. Please run the database migration first.",
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to create event",
                        variant: "destructive"
                    });
                }
            } else {
                toast({
                    title: "Success",
                    description: "Event created successfully"
                });
                setShowEventModal(false);
                resetEventForm();
                loadEvents();
            }
        } catch (error) {
            console.error('Error creating event:', error);
            toast({
                title: "Error",
                description: "Failed to create event",
                variant: "destructive"
            });
        }
    };

    const handleUpdateEvent = async () => {
        if (!editingEvent) return;

        try {
            const { error } = await supabase
                .from('events')
                .update({
                    ...eventForm,
                    max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
                    tribe_id: eventForm.tribe_id || null
                })
                .eq('id', editingEvent.id);

            if (error) {
                console.error('Error updating event:', error);
                toast({
                    title: "Error",
                    description: "Failed to update event",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Event updated successfully"
                });
                setShowEventModal(false);
                setEditingEvent(null);
                resetEventForm();
                loadEvents();
            }
        } catch (error) {
            console.error('Error updating event:', error);
            toast({
                title: "Error",
                description: "Failed to update event",
                variant: "destructive"
            });
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) {
                console.error('Error deleting event:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete event",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Event deleted successfully"
                });
                loadEvents();
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            toast({
                title: "Error",
                description: "Failed to delete event",
                variant: "destructive"
            });
        }
    };

    const handleCreateScore = async () => {
        if (!scoreForm.tribe_id || !scoreForm.event_name || !scoreForm.points) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tribe_scores')
                .insert({
                    ...scoreForm,
                    points: parseInt(scoreForm.points),
                    created_by: user.full_name || user.email
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating score:', error);

                // Check if it's a table doesn't exist error
                if (error.message && error.message.includes('relation "tribe_scores" does not exist')) {
                    toast({
                        title: "Database Setup Required",
                        description: "Tribe scores table not found. Please run the database migration first.",
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to create score",
                        variant: "destructive"
                    });
                }
            } else {
                toast({
                    title: "Success",
                    description: "Score added successfully"
                });
                setShowScoreModal(false);
                resetScoreForm();
                loadTribeScores();
            }
        } catch (error) {
            console.error('Error creating score:', error);
            toast({
                title: "Error",
                description: "Failed to create score",
                variant: "destructive"
            });
        }
    };

    const handleUpdateScore = async () => {
        if (!editingScore) return;

        try {
            const { error } = await supabase
                .from('tribe_scores')
                .update({
                    ...scoreForm,
                    points: parseInt(scoreForm.points)
                })
                .eq('id', editingScore.id);

            if (error) {
                console.error('Error updating score:', error);
                toast({
                    title: "Error",
                    description: "Failed to update score",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Score updated successfully"
                });
                setShowScoreModal(false);
                setEditingScore(null);
                resetScoreForm();
                loadTribeScores();
            }
        } catch (error) {
            console.error('Error updating score:', error);
            toast({
                title: "Error",
                description: "Failed to update score",
                variant: "destructive"
            });
        }
    };

    const handleDeleteScore = async (scoreId) => {
        if (!confirm('Are you sure you want to delete this score?')) return;

        try {
            const { error } = await supabase
                .from('tribe_scores')
                .delete()
                .eq('id', scoreId);

            if (error) {
                console.error('Error deleting score:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete score",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Score deleted successfully"
                });
                loadTribeScores();
            }
        } catch (error) {
            console.error('Error deleting score:', error);
            toast({
                title: "Error",
                description: "Failed to delete score",
                variant: "destructive"
            });
        }
    };

    const resetEventForm = () => {
        setEventForm({
            title: '',
            description: '',
            date: '',
            time: '',
            location: '',
            max_participants: '',
            tribe_id: '',
            event_type: 'general',
            status: 'upcoming'
        });
    };

    const resetScoreForm = () => {
        setScoreForm({
            tribe_id: '',
            event_name: '',
            points: '',
            category: 'general',
            description: ''
        });
    };

    const openEventModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setEventForm({
                title: event.title,
                description: event.description || '',
                date: event.date,
                time: event.time,
                location: event.location || '',
                max_participants: event.max_participants?.toString() || '',
                tribe_id: event.tribe_id || '',
                event_type: event.event_type,
                status: event.status
            });
        } else {
            setEditingEvent(null);
            resetEventForm();
        }
        setShowEventModal(true);
    };

    const openScoreModal = (score = null) => {
        if (score) {
            setEditingScore(score);
            setScoreForm({
                tribe_id: score.tribe_id,
                event_name: score.event_name,
                points: score.points.toString(),
                category: score.category,
                description: score.description || ''
            });
        } else {
            setEditingScore(null);
            resetScoreForm();
        }
        setShowScoreModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'ongoing': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'competition': return 'bg-purple-100 text-purple-800';
            case 'workshop': return 'bg-orange-100 text-orange-800';
            case 'meeting': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'academic': return 'bg-blue-100 text-blue-800';
            case 'sports': return 'bg-green-100 text-green-800';
            case 'cultural': return 'bg-purple-100 text-purple-800';
            case 'leadership': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Events & Scoring Management</h2>
                    <p className="text-white/70">Create events and manage tribe scores</p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={() => openEventModal()} className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                    </Button>
                    <Button onClick={() => openScoreModal()} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                        <Award className="h-4 w-4 mr-2" />
                        Add Score
                    </Button>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Students */}
                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(0)} ${getCardDelayClass(0)}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
                        <p className="text-xs text-white/70">
                            Registered students
                        </p>
                    </CardContent>
                </Card>

                {/* Today's Attendance */}
                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(1)} ${getCardDelayClass(1)}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Today&apos;s Attendance</CardTitle>
                        <Calendar className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.todayAttendance}</div>
                        <p className="text-xs text-white/70">
                            Students present today
                        </p>
                    </CardContent>
                </Card>

                {/* Attendance Rate */}
                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(2)} ${getCardDelayClass(2)}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Attendance Rate</CardTitle>
                        <Target className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.attendanceRate}%</div>
                        <p className="text-xs text-white/70">
                            Today&apos;s overall rate
                        </p>
                    </CardContent>
                </Card>

                {/* Top Tribe */}
                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(3)} ${getCardDelayClass(3)}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Top Tribe</CardTitle>
                        <Trophy className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.topTribe ? stats.topTribe.attendanceRate : 0}%
                        </div>
                        <p className="text-xs text-white/70">
                            {stats.topTribe ? `Tribe ${stats.topTribe.name}` : 'No data'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Tribes List */}
            <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(4)} ${getCardDelayClass(4)}`}>
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <Trophy className="h-5 w-5 mr-2" />
                        Top Tribes Ranking
                    </CardTitle>
                    <CardDescription className="text-white/70">Today&apos;s attendance performance by tribe</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(() => {
                            // Get all tribes with attendance data
                            const tribesWithAttendance = tribes.map(tribe => {
                                const tribeStudents = tribe.students?.length || 0;
                                const today = new Date().toISOString().split('T')[0];
                                const tribeAttendance = stats.todayAttendance || 0; // This would need to be calculated properly
                                const tribeRate = tribeStudents > 0 ? Math.round((tribeAttendance / tribeStudents) * 100) : 0;

                                return {
                                    id: tribe.id,
                                    name: tribe.name,
                                    attendanceRate: tribeRate,
                                    totalStudents: tribeStudents,
                                    presentToday: tribeAttendance
                                };
                            });

                            // Sort by attendance rate
                            tribesWithAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate);

                            return tribesWithAttendance.map((tribe, index) => (
                                <div key={tribe.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">Tribe {tribe.name}</h3>
                                            <p className="text-sm text-white/70">
                                                {tribe.presentToday} / {tribe.totalStudents} students present
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-white">
                                            {tribe.attendanceRate}%
                                        </div>
                                        <div className="text-xs text-white/70">attendance rate</div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </CardContent>
            </Card>

            {/* Events Section */}
            <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(6)} ${getCardDelayClass(6)}`}>
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <Calendar className="h-5 w-5 mr-2" />
                        Events
                    </CardTitle>
                    <CardDescription className="text-white/70">Manage upcoming and ongoing events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="border border-white/20 rounded-lg p-4 bg-white/5 backdrop-blur-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="font-semibold">{event.title}</h3>
                                            <Badge className={getStatusColor(event.status)}>
                                                {event.status}
                                            </Badge>
                                            <Badge className={getEventTypeColor(event.event_type)}>
                                                {event.event_type}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-2">{event.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-white/70">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {new Date(event.date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {event.time}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center">
                                                    <MapPin className="h-4 w-4 mr-1" />
                                                    {event.location}
                                                </div>
                                            )}
                                            {event.tribes?.name && (
                                                <div className="flex items-center">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    Tribe {event.tribes.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                            size="sm"
                                            onClick={() => openEventModal(event)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                            size="sm"
                                            onClick={() => handleDeleteEvent(event.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70">No events created yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tribe Scores Section */}
            <Card className={`bg-white/10 backdrop-blur-md border border-white/20 ${getCardAnimationClass(5)} ${getCardDelayClass(5)}`}>
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <Trophy className="h-5 w-5 mr-2" />
                        Tribe Scores
                    </CardTitle>
                    <CardDescription className="text-white/70">Manage tribe scoring and points</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tribeScores.map((score) => (
                            <div key={score.id} className="border border-white/20 rounded-lg p-4 bg-white/5 backdrop-blur-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="font-semibold">{score.event_name}</h3>
                                            <Badge className={getCategoryColor(score.category)}>
                                                {score.category}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {score.points} points
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-2">{score.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-white/70">
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 mr-1" />
                                                Tribe {score.tribes?.name}
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {new Date(score.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                            size="sm"
                                            onClick={() => openScoreModal(score)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                            size="sm"
                                            onClick={() => handleDeleteScore(score.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tribeScores.length === 0 && (
                            <div className="text-center py-8">
                                <Trophy className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70">No scores recorded yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Event Modal */}
            <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingEvent ? 'Edit Event' : 'Create New Event'}
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                            {editingEvent ? 'Update event details' : 'Create a new event for the community'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Event Title *</label>
                                <Input
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter event title"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Event Type</label>
                                <Select
                                    value={eventForm.event_type}
                                    onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="competition">Competition</SelectItem>
                                        <SelectItem value="workshop">Workshop</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={eventForm.description}
                                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter event description"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Date *</label>
                                <Input
                                    type="date"
                                    value={eventForm.date}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Time *</label>
                                <Input
                                    type="time"
                                    value={eventForm.time}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                    value={eventForm.location}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Enter location"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Max Participants</label>
                                <Input
                                    type="number"
                                    value={eventForm.max_participants}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: e.target.value }))}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Tribe (Optional)</label>
                                <Select
                                    value={eventForm.tribe_id}
                                    onValueChange={(value) => setEventForm(prev => ({ ...prev, tribe_id: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tribe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Tribes</SelectItem>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id}>
                                                Tribe {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={eventForm.status}
                                    onValueChange={(value) => setEventForm(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="ongoing">Ongoing</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowEventModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                            >
                                {editingEvent ? 'Update Event' : 'Create Event'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Score Modal */}
            <Dialog open={showScoreModal} onOpenChange={setShowScoreModal}>
                <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingScore ? 'Edit Score' : 'Add Tribe Score'}
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                            {editingScore ? 'Update tribe score details' : 'Add points to a tribe for an event'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Tribe *</label>
                                <Select
                                    value={scoreForm.tribe_id}
                                    onValueChange={(value) => setScoreForm(prev => ({ ...prev, tribe_id: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tribe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id}>
                                                Tribe {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <Select
                                    value={scoreForm.category}
                                    onValueChange={(value) => setScoreForm(prev => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="academic">Academic</SelectItem>
                                        <SelectItem value="sports">Sports</SelectItem>
                                        <SelectItem value="cultural">Cultural</SelectItem>
                                        <SelectItem value="leadership">Leadership</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Event Name *</label>
                            <Input
                                value={scoreForm.event_name}
                                onChange={(e) => setScoreForm(prev => ({ ...prev, event_name: e.target.value }))}
                                placeholder="Enter event name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Points *</label>
                            <Input
                                type="number"
                                value={scoreForm.points}
                                onChange={(e) => setScoreForm(prev => ({ ...prev, points: e.target.value }))}
                                placeholder="Enter points"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={scoreForm.description}
                                onChange={(e) => setScoreForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter description"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowScoreModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={editingScore ? handleUpdateScore : handleCreateScore}
                            >
                                {editingScore ? 'Update Score' : 'Add Score'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EventsManagement; 