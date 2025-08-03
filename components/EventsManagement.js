"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Trophy
} from "lucide-react";

export default function EventsManagement({ user, mode = 'events' }) {
    const [events, setEvents] = useState([]);
    const [tribes, setTribes] = useState([]);
    const [tribeScores, setTribeScores] = useState([]);
    const [competitiveEvents, setCompetitiveEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showCompetitiveModal, setShowCompetitiveModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [editingCompetitiveEvent, setEditingCompetitiveEvent] = useState(null);
    const { toast } = useToast();

    // Form state
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

    // Competitive event form state
    const [competitiveEventForm, setCompetitiveEventForm] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        first_place_tribe_id: '',
        second_place_tribe_id: '',
        third_place_tribe_id: '',
        first_place_points: 10,
        second_place_points: 5,
        third_place_points: 3,
        status: 'upcoming'
    });

    // Fetch events from Supabase
    const fetchEvents = useCallback(async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("date", { ascending: true });

        if (error) {
            console.error("Error fetching events:", error.message);
            toast({
                title: "Error",
                description: "Failed to load events",
                variant: "destructive",
            });
        } else {
            setEvents(data || []);
        }

        setLoading(false);
    }, [toast]);

    // Fetch tribes from Supabase
    const fetchTribes = useCallback(async () => {
        const { data, error } = await supabase
            .from("tribes")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching tribes:", error.message);
            toast({
                title: "Error",
                description: "Failed to load tribes",
                variant: "destructive",
            });
        } else {
            setTribes(data || []);
        }
    }, [toast]);

    // Fetch competitive events from Supabase
    const fetchCompetitiveEvents = useCallback(async () => {
        const { data, error } = await supabase
            .from("competitive_events")
            .select("*")
            .order("date", { ascending: true });

        if (error) {
            console.error("Error fetching competitive events:", error.message);
            toast({
                title: "Error",
                description: "Failed to load competitive events",
                variant: "destructive",
            });
        } else {
            setCompetitiveEvents(data || []);
        }
    }, [toast]);

    // Calculate tribe scores based on events and competitive events
    const calculateTribeScores = useCallback(() => {
        const scores = tribes.map(tribe => {
            // Get events for this tribe
            const tribeEvents = events.filter(event => event.tribe_id === tribe.id);

            // Get competitive events where this tribe placed
            const tribeCompetitiveWins = competitiveEvents.filter(event =>
                event.status === 'completed' && (
                    event.first_place_tribe_id === tribe.id ||
                    event.second_place_tribe_id === tribe.id ||
                    event.third_place_tribe_id === tribe.id
                )
            );

            // Calculate score based on event participation and completion
            let totalScore = 0;
            let completedEvents = 0;
            let upcomingEvents = 0;
            let ongoingEvents = 0;
            let competitiveWins = 0;
            let eventTypeBonus = 0;

            tribeEvents.forEach(event => {
                switch (event.status) {
                    case 'completed':
                        totalScore += 100; // Base points for completed events
                        completedEvents++;
                        break;
                    case 'ongoing':
                        totalScore += 50; // Points for ongoing events
                        ongoingEvents++;
                        break;
                    case 'upcoming':
                        upcomingEvents++;
                        break;
                }

                // Bonus points for different event types
                switch (event.event_type) {
                    case 'competition':
                        totalScore += 25;
                        eventTypeBonus += 25;
                        break;
                    case 'workshop':
                        totalScore += 15;
                        eventTypeBonus += 15;
                        break;
                    case 'meeting':
                        totalScore += 10;
                        eventTypeBonus += 10;
                        break;
                }
            });

            // Add points from competitive event placements
            tribeCompetitiveWins.forEach(event => {
                if (event.first_place_tribe_id === tribe.id) {
                    totalScore += event.first_place_points || 10;
                    competitiveWins++;
                } else if (event.second_place_tribe_id === tribe.id) {
                    totalScore += event.second_place_points || 5;
                    competitiveWins++;
                } else if (event.third_place_tribe_id === tribe.id) {
                    totalScore += event.third_place_points || 3;
                    competitiveWins++;
                }
            });

            return {
                id: tribe.id,
                name: tribe.name,
                totalScore,
                completedEvents,
                ongoingEvents,
                upcomingEvents,
                competitiveWins,
                eventTypeBonus,
                totalEvents: tribeEvents.length + competitiveWins
            };
        });

        // Sort by total score (descending)
        const sortedScores = scores.sort((a, b) => b.totalScore - a.totalScore);

        // Add ranking
        const rankedScores = sortedScores.map((score, index) => ({
            ...score,
            rank: index + 1
        }));

        setTribeScores(rankedScores);
    }, [tribes, events, competitiveEvents]);

    useEffect(() => {
        fetchEvents();
        fetchTribes();
        fetchCompetitiveEvents();
    }, [fetchEvents, fetchTribes, fetchCompetitiveEvents]);

    useEffect(() => {
        if (tribes.length > 0 && (events.length > 0 || competitiveEvents.length > 0)) {
            calculateTribeScores();
        }
    }, [tribes, events, competitiveEvents, calculateTribeScores]);

    const handleCreateEvent = async () => {
        if (!validateForm()) return;

        // Clean up the form data to handle empty strings for integer fields
        const cleanedForm = {
            ...eventForm,
            max_participants: eventForm.max_participants && eventForm.max_participants.trim() !== '' ? parseInt(eventForm.max_participants) : null,
            tribe_id: eventForm.tribe_id && eventForm.tribe_id.trim() !== '' ? parseInt(eventForm.tribe_id) : null
        };

        const { error } = await supabase
            .from("events")
            .insert([cleanedForm]);

        if (error) {
            console.error("Error creating event:", error.message);
            toast({
                title: "Error",
                description: "Failed to create event",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Event created successfully",
            });
            setShowEventModal(false);
            resetEventForm();
            // Refresh events
            await fetchEvents();
        }
    };

    const handleUpdateEvent = async () => {
        if (!validateForm()) return;

        // Clean up the form data to handle empty strings for integer fields
        const cleanedForm = {
            ...eventForm,
            max_participants: eventForm.max_participants && eventForm.max_participants.trim() !== '' ? parseInt(eventForm.max_participants) : null,
            tribe_id: eventForm.tribe_id && eventForm.tribe_id.trim() !== '' ? parseInt(eventForm.tribe_id) : null
        };

        const { error } = await supabase
            .from("events")
            .update(cleanedForm)
            .eq("id", editingEvent.id);

        if (error) {
            console.error("Error updating event:", error.message);
            toast({
                title: "Error",
                description: "Failed to update event",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Event updated successfully",
            });
            setShowEventModal(false);
            resetEventForm();
            // Refresh events
            await fetchEvents();
        }
    };

    const handleDeleteEvent = async (eventId) => {
        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", eventId);

        if (error) {
            console.error("Error deleting event:", error.message);
            toast({
                title: "Error",
                description: "Failed to delete event",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Event deleted successfully",
            });
            // Refresh events
            await fetchEvents();
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
        setEditingEvent(null);
    };

    const openEventModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setEventForm({
                title: event.title || '',
                description: event.description || '',
                date: event.date || '',
                time: event.time || '',
                location: event.location || '',
                max_participants: event.max_participants ? event.max_participants.toString() : '',
                tribe_id: event.tribe_id ? event.tribe_id.toString() : '',
                event_type: event.event_type || 'general',
                status: event.status || 'upcoming'
            });
        } else {
            resetEventForm();
        }
        setShowEventModal(true);
    };

    const validateForm = () => {
        if (!eventForm.title.trim()) {
            toast({
                title: "Validation Error",
                description: "Event title is required",
                variant: "destructive",
            });
            return false;
        }
        if (!eventForm.description.trim()) {
            toast({
                title: "Validation Error",
                description: "Event description is required",
                variant: "destructive",
            });
            return false;
        }
        if (!eventForm.date) {
            toast({
                title: "Validation Error",
                description: "Event date is required",
                variant: "destructive",
            });
            return false;
        }
        if (!eventForm.time) {
            toast({
                title: "Validation Error",
                description: "Event time is required",
                variant: "destructive",
            });
            return false;
        }
        return true;
    };

    const refreshEvents = async () => {
        setLoading(true);
        await fetchEvents();
        await fetchTribes();
        toast({
            title: "Success",
            description: "Events and tribe scores refreshed successfully",
        });
    };

    const refreshTribeScores = async () => {
        setLoading(true);
        await fetchTribes();
        await fetchCompetitiveEvents();
        calculateTribeScores();
        toast({
            title: "Success",
            description: "Tribe scores recalculated successfully",
        });
        setLoading(false);
    };

    // Competitive Event Functions
    const handleCreateCompetitiveEvent = async () => {
        if (!validateCompetitiveForm()) return;

        const { error } = await supabase
            .from("competitive_events")
            .insert([competitiveEventForm]);

        if (error) {
            console.error("Error creating competitive event:", error.message);
            toast({
                title: "Error",
                description: "Failed to create competitive event",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Competitive event created successfully",
            });
            setShowCompetitiveModal(false);
            resetCompetitiveEventForm();
            await fetchCompetitiveEvents();
        }
    };

    const handleUpdateCompetitiveEvent = async () => {
        if (!validateCompetitiveForm()) return;

        const { error } = await supabase
            .from("competitive_events")
            .update(competitiveEventForm)
            .eq("id", editingCompetitiveEvent.id);

        if (error) {
            console.error("Error updating competitive event:", error.message);
            toast({
                title: "Error",
                description: "Failed to update competitive event",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Competitive event updated successfully",
            });
            setShowCompetitiveModal(false);
            resetCompetitiveEventForm();
            await fetchCompetitiveEvents();
        }
    };

    const handleDeleteCompetitiveEvent = async (eventId) => {
        const { error } = await supabase
            .from("competitive_events")
            .delete()
            .eq("id", eventId);

        if (error) {
            console.error("Error deleting competitive event:", error.message);
            toast({
                title: "Error",
                description: "Failed to delete competitive event",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Competitive event deleted successfully",
            });
            await fetchCompetitiveEvents();
        }
    };

    const resetCompetitiveEventForm = () => {
        setCompetitiveEventForm({
            title: '',
            description: '',
            date: '',
            time: '',
            location: '',
            first_place_tribe_id: '',
            second_place_tribe_id: '',
            third_place_tribe_id: '',
            first_place_points: 10,
            second_place_points: 5,
            third_place_points: 3,
            status: 'upcoming'
        });
        setEditingCompetitiveEvent(null);
    };

    const openCompetitiveModal = (event = null) => {
        if (event) {
            setEditingCompetitiveEvent(event);
            setCompetitiveEventForm({
                title: event.title || '',
                description: event.description || '',
                date: event.date || '',
                time: event.time || '',
                location: event.location || '',
                first_place_tribe_id: event.first_place_tribe_id || '',
                second_place_tribe_id: event.second_place_tribe_id || '',
                third_place_tribe_id: event.third_place_tribe_id || '',
                first_place_points: event.first_place_points || 10,
                second_place_points: event.second_place_points || 5,
                third_place_points: event.third_place_points || 3,
                status: event.status || 'upcoming'
            });
        } else {
            resetCompetitiveEventForm();
        }
        setShowCompetitiveModal(true);
    };

    const validateCompetitiveForm = () => {
        if (!competitiveEventForm.title.trim()) {
            toast({
                title: "Validation Error",
                description: "Event title is required",
                variant: "destructive",
            });
            return false;
        }
        if (!competitiveEventForm.description.trim()) {
            toast({
                title: "Validation Error",
                description: "Event description is required",
                variant: "destructive",
            });
            return false;
        }
        if (!competitiveEventForm.date) {
            toast({
                title: "Validation Error",
                description: "Event date is required",
                variant: "destructive",
            });
            return false;
        }
        if (!competitiveEventForm.time) {
            toast({
                title: "Validation Error",
                description: "Event time is required",
                variant: "destructive",
            });
            return false;
        }
        return true;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white/70">Loading Events Management...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {mode === 'events' ? 'Events Management' : 'Tribe Scoring Management'}
                    </h2>
                    <p className="text-white/70">
                        {mode === 'events' ? 'Create and manage events' : 'Manage tribe scores and rankings'}
                    </p>
                </div>
                <div className="flex space-x-2">
                    {/* Mode Toggle */}
                    <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
                        <Button
                            onClick={() => window.location.href = '?mode=events'}
                            className={`px-4 py-2 text-sm ${mode === 'events' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                            variant="ghost"
                        >
                            Events
                        </Button>
                        <Button
                            onClick={() => window.location.href = '?mode=competitive'}
                            className={`px-4 py-2 text-sm ${mode === 'competitive' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                            variant="ghost"
                        >
                            Competitive Events
                        </Button>
                        <Button
                            onClick={() => window.location.href = '?mode=scoring'}
                            className={`px-4 py-2 text-sm ${mode === 'scoring' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                            variant="ghost"
                        >
                            Tribe Scoring
                        </Button>
                    </div>

                    {mode === 'events' && (
                        <>
                            <Button onClick={() => openEventModal()} className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                            <Button onClick={refreshEvents} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </>
                    )}
                    {mode === 'competitive' && (
                        <>
                            <Button onClick={() => openCompetitiveModal()} className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Competitive Event
                            </Button>
                            <Button onClick={refreshEvents} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Events Management Section */}
            {mode === 'events' && (
                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader>
                        <CardTitle className="flex items-center text-white">
                            <CalendarIcon className="h-5 w-5 mr-2" />
                            Events Management ({events.length})
                        </CardTitle>
                        <CardDescription className="text-white/70">Manage and view all created events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {events.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarIcon className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70">No events created yet</p>
                                <p className="text-white/50 text-sm">Create your first event using the form above</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event, index) => (
                                    <div key={event.id} className="bg-white/10 p-4 rounded border border-white/20 hover:bg-white/15 transition-all duration-300">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white mb-2">{index + 1}. {event.title}</h3>
                                                <p className="text-white/70 text-sm mb-3">{event.description}</p>
                                                <div className="flex items-center space-x-4 text-sm text-white/70 mb-3">
                                                    <div className="flex items-center">
                                                        <CalendarIcon className="h-4 w-4 mr-1" />
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
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        {event.event_type}
                                                    </Badge>
                                                    <Badge className={`${event.status === 'upcoming' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                        event.status === 'ongoing' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                            event.status === 'completed' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' :
                                                                'bg-red-500/20 text-red-300 border-red-500/30'
                                                        } border`}>
                                                        {event.status}
                                                    </Badge>
                                                    {event.tribe_id && (
                                                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                            {tribes.find(t => t.id === event.tribe_id)?.name || `Tribe ${event.tribe_id}`}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
                                                    size="sm"
                                                    onClick={() => openEventModal(event)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200"
                                                    size="sm"
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Competitive Events Section */}
            {mode === 'competitive' && (
                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader>
                        <CardTitle className="flex items-center text-white">
                            <Trophy className="h-5 w-5 mr-2" />
                            Competitive Events Management ({competitiveEvents.length})
                        </CardTitle>
                        <CardDescription className="text-white/70">Create and manage competitive events where tribes compete for points</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {competitiveEvents.length === 0 ? (
                            <div className="text-center py-8">
                                <Trophy className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70">No competitive events created yet</p>
                                <p className="text-white/50 text-sm">Create your first competitive event using the form above</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {competitiveEvents.map((event, index) => (
                                    <div key={event.id} className="bg-white/10 p-4 rounded border border-white/20 hover:bg-white/15 transition-all duration-300">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white mb-2">{index + 1}. {event.title}</h3>
                                                <p className="text-white/70 text-sm mb-3">{event.description}</p>
                                                <div className="flex items-center space-x-4 text-sm text-white/70 mb-3">
                                                    <div className="flex items-center">
                                                        <CalendarIcon className="h-4 w-4 mr-1" />
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
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                                        Competitive Event
                                                    </Badge>
                                                    <Badge className={`${event.status === 'upcoming' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                        event.status === 'ongoing' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                            event.status === 'completed' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' :
                                                                'bg-red-500/20 text-red-300 border-red-500/30'
                                                        } border`}>
                                                        {event.status}
                                                    </Badge>
                                                    {event.first_place_tribe_id && (
                                                        <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                            🥇 1st: {tribes.find(t => t.id === event.first_place_tribe_id)?.name || `Tribe ${event.first_place_tribe_id}`}
                                                        </Badge>
                                                    )}
                                                    {event.second_place_tribe_id && (
                                                        <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                                            🥈 2nd: {tribes.find(t => t.id === event.second_place_tribe_id)?.name || `Tribe ${event.second_place_tribe_id}`}
                                                        </Badge>
                                                    )}
                                                    {event.third_place_tribe_id && (
                                                        <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                                            🥉 3rd: {tribes.find(t => t.id === event.third_place_tribe_id)?.name || `Tribe ${event.third_place_tribe_id}`}
                                                        </Badge>
                                                    )}
                                                    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        +{event.first_place_points}/{event.second_place_points}/{event.third_place_points} pts
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
                                                    size="sm"
                                                    onClick={() => openCompetitiveModal(event)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200"
                                                    size="sm"
                                                    onClick={() => handleDeleteCompetitiveEvent(event.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Tribe Scoring Section */}
            {mode === 'scoring' && (
                <div className="space-y-6">
                    {/* Tribe Rankings */}
                    <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-white">
                                <div className="flex items-center">
                                    <Users className="h-5 w-5 mr-2" />
                                    Tribe Rankings ({tribeScores.length})
                                </div>
                                <Button onClick={refreshTribeScores} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Recalculate Scores
                                </Button>
                            </CardTitle>
                            <CardDescription className="text-white/70">Tribe rankings based on event participation and completion</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tribeScores.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                    <p className="text-white/70">No tribe scores available</p>
                                    <p className="text-white/50 text-sm">Create events and assign them to tribes to see rankings</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tribeScores.map((tribe, index) => (
                                        <div key={tribe.id} className="bg-white/10 p-4 rounded border border-white/20 hover:bg-white/15 transition-all duration-300">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                                                        index === 1 ? 'bg-gray-400' :
                                                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                                                        }`}>
                                                        {tribe.rank}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white">{tribe.name}</h3>
                                                        <p className="text-white/70 text-sm">Total Score: {tribe.totalScore} points</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-white/70">Completed:</span>
                                                            <p className="font-semibold text-green-300">{tribe.completedEvents}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">Ongoing:</span>
                                                            <p className="font-semibold text-yellow-300">{tribe.ongoingEvents}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">Upcoming:</span>
                                                            <p className="font-semibold text-blue-300">{tribe.upcomingEvents}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">Competitive Wins:</span>
                                                            <p className="font-semibold text-orange-300">{tribe.competitiveWins}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">Event Type Bonus:</span>
                                                            <p className="font-semibold text-purple-300">+{tribe.eventTypeBonus}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">Total:</span>
                                                            <p className="font-semibold text-white">{tribe.totalEvents}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Scoring Guidelines */}
                    <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                        <CardHeader>
                            <CardTitle className="flex items-center text-white">
                                <Users className="h-5 w-5 mr-2" />
                                Scoring Guidelines
                            </CardTitle>
                            <CardDescription className="text-white/70">How tribe scores are calculated</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Event Status Points</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Completed Events:</span>
                                            <span className="font-semibold text-green-300">+100 points</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Ongoing Events:</span>
                                            <span className="font-semibold text-yellow-300">+50 points</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Upcoming Events:</span>
                                            <span className="font-semibold text-blue-300">+0 points</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Competitive Wins:</span>
                                            <span className="font-semibold text-orange-300">+10 points each</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Event Type Bonuses</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Competition Events:</span>
                                            <span className="font-semibold text-orange-300">+25 points each</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Workshop Events:</span>
                                            <span className="font-semibold text-purple-300">+15 points each</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Meeting Events:</span>
                                            <span className="font-semibold text-blue-300">+10 points each</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">General Events:</span>
                                            <span className="font-semibold text-gray-300">+0 points</span>
                                        </div>
                                        <div className="text-xs text-white/50 mt-2">
                                            * Event type bonuses are applied to all events of that type
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                                <label className="text-sm font-medium text-white">Event Title *</label>
                                <Input
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter event title"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">Event Type</label>
                                <Select
                                    value={eventForm.event_type}
                                    onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="competition">Competition</SelectItem>
                                        <SelectItem value="workshop">Workshop</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">Event Status</label>
                                <Select
                                    value={eventForm.status}
                                    onValueChange={(value) => setEventForm(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Select event status" />
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
                        <div>
                            <label className="text-sm font-medium text-white">Description</label>
                            <Textarea
                                value={eventForm.description}
                                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter event description"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-white">Date *</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {eventForm.date ? (
                                                new Date(eventForm.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                            ) : (
                                                <span className="text-white/50">Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white/10 backdrop-blur-md border border-white/20" align="start">
                                        <Calendar
                                            selected={eventForm.date ? new Date(eventForm.date) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setEventForm(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
                                                }
                                            }}
                                            disabled={false}
                                            className="bg-white/10 backdrop-blur-md border border-white/20"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">Time *</label>
                                <TimePicker
                                    value={eventForm.time}
                                    onChange={(time) => setEventForm(prev => ({ ...prev, time }))}
                                    className="bg-white/10 border-white/20 text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-white">Location</label>
                            <Input
                                value={eventForm.location}
                                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Enter event location"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-white">Max Participants</label>
                                <Input
                                    type="number"
                                    value={eventForm.max_participants}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: e.target.value }))}
                                    placeholder="Enter max participants"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">Assigned Tribe</label>
                                <Select
                                    value={eventForm.tribe_id ? eventForm.tribe_id.toString() : ''}
                                    onValueChange={(value) => setEventForm(prev => ({ ...prev, tribe_id: value }))}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Select a tribe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Tribe Assigned</SelectItem>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id.toString()}>
                                                {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowEventModal(false)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                                disabled={!eventForm.title || !eventForm.description || !eventForm.date || !eventForm.time}
                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                            >
                                {editingEvent ? 'Update Event' : 'Create Event'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Competitive Event Modal */}
            <Dialog open={showCompetitiveModal} onOpenChange={setShowCompetitiveModal}>
                <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingCompetitiveEvent ? 'Edit Competitive Event' : 'Create New Competitive Event'}
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                            {editingCompetitiveEvent ? 'Update competitive event details' : 'Create a new competitive event where tribes compete for points'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-white">Event Title *</label>
                            <Input
                                value={competitiveEventForm.title}
                                onChange={(e) => setCompetitiveEventForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., Cultural Festival Game"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-white">Description</label>
                            <Textarea
                                value={competitiveEventForm.description}
                                onChange={(e) => setCompetitiveEventForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the competitive event"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-white">Date *</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {competitiveEventForm.date ? (
                                                new Date(competitiveEventForm.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                            ) : (
                                                <span className="text-white/50">Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white/10 backdrop-blur-md border border-white/20" align="start">
                                        <Calendar
                                            selected={competitiveEventForm.date ? new Date(competitiveEventForm.date) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setCompetitiveEventForm(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
                                                }
                                            }}
                                            disabled={false}
                                            className="bg-white/10 backdrop-blur-md border border-white/20"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">Time *</label>
                                <TimePicker
                                    value={competitiveEventForm.time}
                                    onChange={(time) => setCompetitiveEventForm(prev => ({ ...prev, time }))}
                                    className="bg-white/10 border-white/20 text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-white">Location</label>
                            <Input
                                value={competitiveEventForm.location}
                                onChange={(e) => setCompetitiveEventForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Enter event location"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-white">1st Place Points</label>
                                <Input
                                    type="number"
                                    value={competitiveEventForm.first_place_points}
                                    onChange={(e) => setCompetitiveEventForm(prev => ({ ...prev, first_place_points: parseInt(e.target.value) || 10 }))}
                                    placeholder="10"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">2nd Place Points</label>
                                <Input
                                    type="number"
                                    value={competitiveEventForm.second_place_points}
                                    onChange={(e) => setCompetitiveEventForm(prev => ({ ...prev, second_place_points: parseInt(e.target.value) || 5 }))}
                                    placeholder="5"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">3rd Place Points</label>
                                <Input
                                    type="number"
                                    value={competitiveEventForm.third_place_points}
                                    onChange={(e) => setCompetitiveEventForm(prev => ({ ...prev, third_place_points: parseInt(e.target.value) || 3 }))}
                                    placeholder="3"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-white">🥇 1st Place Tribe</label>
                                <Select
                                    value={competitiveEventForm.first_place_tribe_id ? competitiveEventForm.first_place_tribe_id.toString() : ''}
                                    onValueChange={(value) => setCompetitiveEventForm(prev => ({ ...prev, first_place_tribe_id: value }))}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Select 1st place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Winner Yet</SelectItem>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id.toString()}>
                                                {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">🥈 2nd Place Tribe</label>
                                <Select
                                    value={competitiveEventForm.second_place_tribe_id ? competitiveEventForm.second_place_tribe_id.toString() : ''}
                                    onValueChange={(value) => setCompetitiveEventForm(prev => ({ ...prev, second_place_tribe_id: value }))}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Select 2nd place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Winner Yet</SelectItem>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id.toString()}>
                                                {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white">🥉 3rd Place Tribe</label>
                                <Select
                                    value={competitiveEventForm.third_place_tribe_id ? competitiveEventForm.third_place_tribe_id.toString() : ''}
                                    onValueChange={(value) => setCompetitiveEventForm(prev => ({ ...prev, third_place_tribe_id: value }))}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Select 3rd place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Winner Yet</SelectItem>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id.toString()}>
                                                {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-white">Event Status</label>
                            <Select
                                value={competitiveEventForm.status}
                                onValueChange={(value) => setCompetitiveEventForm(prev => ({ ...prev, status: value }))}
                            >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Select event status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="ongoing">Ongoing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowCompetitiveModal(false)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={editingCompetitiveEvent ? handleUpdateCompetitiveEvent : handleCreateCompetitiveEvent}
                                disabled={!competitiveEventForm.title || !competitiveEventForm.description || !competitiveEventForm.date || !competitiveEventForm.time}
                                className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                            >
                                {editingCompetitiveEvent ? 'Update Competitive Event' : 'Create Competitive Event'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 