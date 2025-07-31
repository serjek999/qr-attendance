import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Star, Camera, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { authUtils } from "../../app/lib/auth";

const TribeDashboard = ({ tribeId, tribeName }) => {
    const [tribeData, setTribeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const getTribeColor = (name) => {
        const colors = {
            Alpha: "bg-red-500",
            Beta: "bg-blue-500",
            Gamma: "bg-green-500",
            Delta: "bg-purple-500",
            Epsilon: "bg-orange-500",
            Zeta: "bg-pink-500"
        };
        return colors[name] || "bg-gray-500";
    };

    const getRankIcon = (rank) => {
        if (rank <= 3) {
            return <Trophy className="h-5 w-5 text-yellow-500" />;
        }
        return <Star className="h-5 w-5 text-muted-foreground" />;
    };

    // Fetch tribe data
    const fetchTribeData = useCallback(async () => {
        if (!tribeId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await authUtils.getTribeDetails(tribeId);

            if (result.success) {
                setTribeData(result.data);
            } else {
                setError(result.message);
            }
        } catch (error) {
            console.error('Error fetching tribe data:', error);
            setError('Failed to load tribe data');
        } finally {
            setLoading(false);
        }
    }, [tribeId]);

    // Load data on component mount
    useEffect(() => {
        fetchTribeData();
    }, [fetchTribeData]);

    return (
        <div className="space-y-6">
            {/* Loading State */}
            {loading && (
                <Card variant="elevated">
                    <CardContent className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Loading tribe data...</p>
                        <p className="text-sm text-muted-foreground">Please wait while we fetch the latest information</p>
                    </CardContent>
                </Card>
            )}

            {/* Error State */}
            {error && !loading && (
                <Card variant="elevated" className="border-red-200 bg-red-50">
                    <CardContent className="p-8 text-center">
                        <p className="text-lg font-medium text-red-800 mb-2">Error Loading Data</p>
                        <p className="text-sm text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchTribeData}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </CardContent>
                </Card>
            )}

            {/* Tribe Header */}
            {tribeData && !loading && !error && (
                <Card variant="gradient">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`w-16 h-16 ${getTribeColor(tribeData.name)} rounded-full flex items-center justify-center`}>
                                    <span className="text-white font-bold text-xl">{tribeData.name[0]}</span>
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Tribe {tribeData.name}</CardTitle>
                                    <CardDescription className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>{tribeData.stats.memberCount} members</span>
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center space-x-2 mb-1">
                                    <button
                                        onClick={fetchTribeData}
                                        disabled={loading}
                                        className="text-primary hover:text-primary/80 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="text-3xl font-bold text-primary">{tribeData.stats.totalScore}</div>
                                <div className="text-sm text-muted-foreground">Total Points</div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Stats Cards */}
            {tribeData && !loading && !error && (
                <div className="grid md:grid-cols-3 gap-4">
                    <Card variant="elevated">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Today&apos;s Points</p>
                                    <p className="text-2xl font-bold text-green-600">+{tribeData.stats.todayScore}</p>
                                </div>
                                <ArrowUp className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                    <p className="text-2xl font-bold text-blue-600">{tribeData.stats.attendanceRate}%</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Media Posts</p>
                                    <p className="text-2xl font-bold text-purple-600">{tribeData.stats.postsCount}</p>
                                </div>
                                <Camera className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Activity */}
            {tribeData && !loading && !error && (
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest tribe events and achievements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tribeData.recentActivity && tribeData.recentActivity.length > 0 ? (
                                tribeData.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.message}</p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                        {activity.points && (
                                            <Badge variant={activity.points > 0 ? "default" : "destructive"}>
                                                {activity.points > 0 ? "+" : ""}{activity.points} pts
                                            </Badge>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No recent activity</p>
                                    <p className="text-sm">Activity will appear here as members participate</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            {tribeData && !loading && !error && (
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="gradient" className="h-16">
                        <div className="text-center">
                            <Camera className="h-6 w-6 mx-auto mb-1" />
                            <div className="text-sm">Share Photo</div>
                        </div>
                    </Button>
                    <Button variant="outline" className="h-16">
                        <div className="text-center">
                            <Trophy className="h-6 w-6 mx-auto mb-1" />
                            <div className="text-sm">View Leaderboard</div>
                        </div>
                    </Button>
                </div>
            )}
        </div>
    );
};

export default TribeDashboard;