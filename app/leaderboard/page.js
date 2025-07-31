"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

const Leaderboard = () => {
    const mockTribes = [
        { name: "Beta", score: 1356, members: 26, rank: 1, change: "+2" },
        { name: "Alpha", score: 1247, members: 28, rank: 2, change: "-1" },
        { name: "Gamma", score: 1189, members: 27, rank: 3, change: "+1" },
        { name: "Delta", score: 1098, members: 25, rank: 4, change: "-2" },
        { name: "Epsilon", score: 1034, members: 24, rank: 5, change: "0" },
        { name: "Zeta", score: 987, members: 26, rank: 6, change: "0" }
    ];

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8">
            <div className="container mx-auto px-4">
                <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Link>

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

                    {/* Podium - Top 3 */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {mockTribes.slice(0, 3).map((tribe, index) => (
                            <Card
                                key={tribe.name}
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
                                    <p className="text-3xl font-bold text-primary mb-2">{tribe.score}</p>
                                    <p className="text-sm text-muted-foreground">{tribe.members} members</p>
                                    {getChangeIndicator(tribe.change)}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Full Rankings */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="h-5 w-5 mr-2" />
                                Complete Rankings
                            </CardTitle>
                            <CardDescription>
                                Updated in real-time based on event participation and scores
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockTribes.map((tribe) => (
                                    <div
                                        key={tribe.name}
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
                                                <p className="text-sm text-muted-foreground">{tribe.members} members</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            {getChangeIndicator(tribe.change)}
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">{tribe.score}</p>
                                                <p className="text-sm text-muted-foreground">points</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Total Events</p>
                                <p className="text-2xl font-bold">12</p>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Active Participants</p>
                                <p className="text-2xl font-bold">156</p>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Total Points</p>
                                <p className="text-2xl font-bold">7,911</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;