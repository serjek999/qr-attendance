"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Calendar, TrendingUp, Download } from "lucide-react";
import { useAttendanceStats } from "@/hooks/useAttendanceStats";
import { useToast } from "@/hooks/use-toast";

const ReportsPanel = () => {
    const { stats, tribeStats, loading, fetchStats, fetchTribeStats } = useAttendanceStats();
    const { toast } = useToast();

    const handleExportCSV = async () => {
        try {
            // This would typically call an API endpoint to generate and download CSV
            toast({
                title: "Export Started",
                description: "CSV report is being generated..."
            });
        } catch (error) {
            toast({
                title: "Export Failed",
                description: "Failed to export report",
                variant: "destructive"
            });
        }
    };

    const formatPercentage = (value, total) => {
        if (total === 0) return "0%";
        return `${Math.round((value / total) * 100)}%`;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
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
                    <h2 className="text-2xl font-bold text-foreground">Attendance Reports</h2>
                    <p className="text-muted-foreground">View attendance statistics and tribe performance</p>
                </div>
                <Button onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todayAttendance || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatPercentage(stats.todayAttendance || 0, stats.totalStudents || 1)} of total students
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered students
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPercentage(stats.todayAttendance || 0, stats.totalStudents || 1)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Today's overall rate
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tribe Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Tribe Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tribeStats.length === 0 ? (
                            <div className="text-center py-8">
                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No tribe data available</p>
                            </div>
                        ) : (
                            tribeStats.map((tribe) => (
                                <div key={tribe.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">{tribe.name}</h3>
                                            <Badge variant="outline">{tribe.student_count} students</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Today: {tribe.today_attendance || 0}</span>
                                            <span>Rate: {formatPercentage(tribe.today_attendance || 0, tribe.student_count || 1)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{
                                                    width: `${Math.round(((tribe.today_attendance || 0) / (tribe.student_count || 1)) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Weekly/Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Average Daily Attendance</span>
                                <span className="font-medium">{stats.weeklyAverage || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Best Day</span>
                                <span className="font-medium">{stats.weeklyBestDay || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Total Attendance</span>
                                <span className="font-medium">{stats.monthlyTotal || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Average Rate</span>
                                <span className="font-medium">{formatPercentage(stats.monthlyAverage || 0, 100)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPanel; 