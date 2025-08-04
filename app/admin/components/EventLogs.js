"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    RefreshCw,
    Search,
    Eye,
    Download,
    Trash2
} from "lucide-react";
import eventLogger from '@/lib/eventLogger';

const EventLogs = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(50);

    useEffect(() => {
        loadEvents();
    }, [filterType, filterSeverity, limit]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const recentEvents = await eventLogger.getRecentEvents(limit, filterType === 'all' ? null : filterType, filterSeverity === 'all' ? null : filterSeverity);
            setEvents(recentEvents);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEventIcon = (eventName) => {
        if (eventName.includes('qr_scan')) return <Activity className="h-4 w-4" />;
        if (eventName.includes('auth')) return <CheckCircle className="h-4 w-4" />;
        if (eventName.includes('error')) return <AlertTriangle className="h-4 w-4" />;
        if (eventName.includes('attendance')) return <Clock className="h-4 w-4" />;
        return <Activity className="h-4 w-4" />;
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const filteredEvents = events.filter(event => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                event.event_name?.toLowerCase().includes(searchLower) ||
                event.event_description?.toLowerCase().includes(searchLower) ||
                event.user_name?.toLowerCase().includes(searchLower) ||
                event.user_email?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const exportLogs = () => {
        const csvContent = [
            ['Timestamp', 'Event Name', 'Description', 'Severity', 'User', 'User Type', 'IP Address'],
            ...filteredEvents.map(event => [
                formatTimestamp(event.created_at),
                event.event_name,
                event.event_description || '',
                event.severity_level,
                event.user_name || event.user_email || 'System',
                event.user_type || 'system',
                event.ip_address || ''
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        System Event Logs
                    </CardTitle>
                    <CardDescription>
                        Monitor system events, errors, and user activities
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Event Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="qr_scan">QR Scans</SelectItem>
                                    <SelectItem value="auth">Authentication</SelectItem>
                                    <SelectItem value="attendance">Attendance</SelectItem>
                                    <SelectItem value="error">Errors</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                                <SelectTrigger className="w-full sm:w-32">
                                    <SelectValue placeholder="Limit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={loadEvents} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button onClick={exportLogs} variant="outline">
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Events List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Events</CardTitle>
                            <CardDescription>
                                Showing {filteredEvents.length} of {events.length} events
                            </CardDescription>
                        </div>
                        <Badge variant="outline">
                            {loading ? 'Loading...' : `${filteredEvents.length} events`}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px]">
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin" />
                                    <span className="ml-2">Loading events...</span>
                                </div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No events found</p>
                                    <p className="text-sm">Try adjusting your filters or search terms</p>
                                </div>
                            ) : (
                                filteredEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <div className="mt-1">
                                                    {getEventIcon(event.event_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h4 className="font-medium text-sm truncate">
                                                            {event.event_name}
                                                        </h4>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-xs ${getSeverityColor(event.severity_level)}`}
                                                        >
                                                            {event.severity_level}
                                                        </Badge>
                                                    </div>
                                                    {event.event_description && (
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {event.event_description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <span className="flex items-center">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {formatTimestamp(event.created_at)}
                                                        </span>
                                                        {event.user_name && (
                                                            <span>by {event.user_name}</span>
                                                        )}
                                                        {event.user_type && event.user_type !== 'system' && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {event.user_type}
                                                            </Badge>
                                                        )}
                                                        {event.ip_address && (
                                                            <span>IP: {event.ip_address}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Event Data (if available) */}
                                        {event.event_data && Object.keys(event.event_data).length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <details className="text-xs">
                                                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                                        View Event Data
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                                        {JSON.stringify(event.event_data, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default EventLogs; 