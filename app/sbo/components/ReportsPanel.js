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
                    <div className="h-8 bg-white/20 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-white/20 rounded"></div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-white/20 rounded"></div>
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
                    <h2 className="text-2xl font-bold text-white">Attendance Reports</h2>
                    <p className="text-white/70">View attendance statistics and tribe performance</p>
                </div>
                <Button onClick={handleExportCSV} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Today&apos;s Attendance</CardTitle>
                        <Calendar className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.todayAttendance || 0}</div>
                        <p className="text-xs text-white/70">
                            {formatPercentage(stats.todayAttendance || 0, stats.totalStudents || 1)} of total students
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalStudents || 0}</div>
                        <p className="text-xs text-white/70">
                            Registered students
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Attendance Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-white/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {formatPercentage(stats.todayAttendance || 0, stats.totalStudents || 1)}
                        </div>
                        <p className="text-xs text-white/70">
                            Today&apos;s overall rate
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tribe Performance */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <BarChart3 className="h-5 w-5" />
                        Tribe Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tribeStats.length === 0 ? (
                            <div className="text-center py-8">
                                <BarChart3 className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70">No tribe data available</p>
                            </div>
                        ) : (
                            tribeStats.map((tribe) => (
                                <div key={tribe.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-white">{tribe.name}</h3>
                                            <Badge variant="outline" className="bg-white/20 text-white border-white/30">{tribe.student_count} students</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-white/70">
                                            <span>Today: {tribe.today_attendance || 0}</span>
                                            <span>Rate: {formatPercentage(tribe.today_attendance || 0, tribe.student_count || 1)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-white/20 rounded-full h-2">
                                            <div
                                                className="bg-blue-400 h-2 rounded-full"
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
                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader>
                        <CardTitle className="text-white">Weekly Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-white/70">Average Daily Attendance</span>
                                <span className="font-medium text-white">{stats.weeklyAverage || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-white/70">Best Day</span>
                                <span className="font-medium text-white">{stats.weeklyBestDay || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                    <CardHeader>
                        <CardTitle className="text-white">Monthly Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-white/70">Total Attendance</span>
                                <span className="font-medium text-white">{stats.monthlyTotal || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-white/70">Average Rate</span>
                                <span className="font-medium text-white">{formatPercentage(stats.monthlyAverage || 0, 100)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPanel; 