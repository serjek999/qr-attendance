"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Users, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { authUtils } from "../lib/auth";

const Leaderboard = () => {
    const [tribes, setTribes] = useState([]);
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
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-500" />;
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />;
            case 3:
                return <Medal className="h-6 w-6 text-orange-500" />;
            default:
                return <Star className="h-6 w-6 text-muted-foreground" />;
        }
    };

    const getChangeIndicator = (change) => {
        if (change === "0") return null;

        const isPositive = change.startsWith("+");
        return (
            <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                {change}
            </Badge>
        );
    };

    // Fetch tribes data
    const fetchTribes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await authUtils.getAllTribes();

            if (result.success) {
                setTribes(result.data);
            } else {
                setError(result.message);
            }
        } catch (error) {
            console.error('Error fetching tribes:', error);
            setError('Failed to load tribe data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on component mount
    useEffect(() => {
        fetchTribes();
    }, [fetchTribes]);

    // Calculate total statistics
    const totalStats = {
        totalEvents: 12, // This could be made dynamic later
        activeParticipants: tribes.reduce((sum, tribe) => sum + tribe.stats.memberCount, 0),
        totalPoints: tribes.reduce((sum, tribe) => sum + tribe.stats.totalScore, 0)
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Link>

                    <button
                        onClick={fetchTribes}
                        disabled={loading}
                        className="inline-flex items-center text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <Card variant="gradient" className="mb-8">
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center mb-4">
                                <Trophy className="h-12 w-12 text-primary" />
                            </div>
                            <CardTitle className="text-3xl text-primary">Tribe Leaderboard</CardTitle>
                            <CardDescription className="text-lg">
                                Live rankings and competition standings
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Loading State */}
                    {loading && (
                        <Card variant="elevated" className="mb-8">
                            <CardContent className="p-8 text-center">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                <p className="text-lg font-medium">Loading tribe data...</p>
                                <p className="text-sm text-muted-foreground">Please wait while we fetch the latest rankings</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <Card variant="elevated" className="mb-8 border-red-200 bg-red-50">
                            <CardContent className="p-8 text-center">
                                <p className="text-lg font-medium text-red-800 mb-2">Error Loading Data</p>
                                <p className="text-sm text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={fetchTribes}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Podium - Top 3 */}
                    {!loading && !error && tribes.length > 0 && (
                        <div className="grid md:grid-cols-3 gap-4 mb-8">
                            {tribes.slice(0, 3).map((tribe, index) => (
                                <Card
                                    key={tribe.id}
                                    variant={index === 0 ? "gradient" : "elevated"}
                                    className={index === 0 ? "md:order-2 transform scale-105" : index === 1 ? "md:order-1" : "md:order-3"}
                                >
                                    <CardContent className="p-6 text-center">
                                        <div className="mb-4">
                                            {getRankIcon(tribe.rank)}
                                        </div>
                                        <div className={`w-16 h-16 ${getTribeColor(tribe.name)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                            <span className="text-white font-bold text-xl">{tribe.name[0]}</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Tribe {tribe.name}</h3>
                                        <p className="text-3xl font-bold text-primary mb-2">{tribe.stats.totalScore}</p>
                                        <p className="text-sm text-muted-foreground">{tribe.stats.memberCount} members</p>
                                        <div className="mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                +{tribe.stats.todayScore} today
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Full Rankings */}
                    {!loading && !error && (
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Users className="h-5 w-5 mr-2" />
                                    Complete Rankings
                                </CardTitle>
                                <CardDescription>
                                    Updated in real-time based on attendance and participation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tribes.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No tribes found</p>
                                        <p className="text-sm">Tribes will appear here once they have members and activity</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tribes.map((tribe) => (
                                            <div
                                                key={tribe.id}
                                                className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${tribe.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-accent/5' : 'bg-muted/30'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        {getRankIcon(tribe.rank)}
                                                        <span className="text-2xl font-bold text-muted-foreground">#{tribe.rank}</span>
                                                    </div>

                                                    <div className={`w-12 h-12 ${getTribeColor(tribe.name)} rounded-full flex items-center justify-center`}>
                                                        <span className="text-white font-bold">{tribe.name[0]}</span>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-lg font-semibold">Tribe {tribe.name}</h4>
                                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                            <span>{tribe.stats.memberCount} members</span>
                                                            <span>•</span>
                                                            <span>{tribe.stats.attendanceRate}% attendance</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-primary">{tribe.stats.totalScore}</p>
                                                        <p className="text-sm text-muted-foreground">points</p>
                                                        <div className="text-xs text-green-600">
                                                            +{tribe.stats.todayScore} today
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Statistics */}
                    {!loading && !error && (
                        <div className="grid md:grid-cols-3 gap-6 mt-8">
                            <Card variant="elevated">
                                <CardContent className="p-6 text-center">
                                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Total Events</p>
                                    <p className="text-2xl font-bold">{totalStats.totalEvents}</p>
                                </CardContent>
                            </Card>

                            <Card variant="elevated">
                                <CardContent className="p-6 text-center">
                                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Active Participants</p>
                                    <p className="text-2xl font-bold">{totalStats.activeParticipants}</p>
                                </CardContent>
                            </Card>

                            <Card variant="elevated">
                                <CardContent className="p-6 text-center">
                                    <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Total Points</p>
                                    <p className="text-2xl font-bold">{totalStats.totalPoints.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;