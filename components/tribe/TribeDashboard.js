import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Star, Camera, ArrowUp, ArrowDown } from "lucide-react";

const TribeDashboard = ({ tribeName, tribeScore, tribeRank, members, recentActivity }) => {
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

    return (
        <div className="space-y-6">
            {/* Tribe Header */}
            <Card variant="gradient">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 ${getTribeColor(tribeName)} rounded-full flex items-center justify-center`}>
                                <span className="text-white font-bold text-xl">{tribeName[0]}</span>
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Tribe {tribeName}</CardTitle>
                                <CardDescription className="flex items-center space-x-2">
                                    <Users className="h-4 w-4" />
                                    <span>{members} members</span>
                                </CardDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                                {getRankIcon(tribeRank)}
                                <span className="text-sm text-muted-foreground">Rank #{tribeRank}</span>
                            </div>
                            <div className="text-3xl font-bold text-primary">{tribeScore}</div>
                            <div className="text-sm text-muted-foreground">Total Points</div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Today&apos;s Points</p>
                                <p className="text-2xl font-bold text-green-600">+47</p>
                            </div>
                            <ArrowUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Event Participation</p>
                                <p className="text-2xl font-bold text-blue-600">85%</p>
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
                                <p className="text-2xl font-bold text-purple-600">23</p>
                            </div>
                            <Camera className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest tribe events and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
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
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
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
        </div>
    );
};

export default TribeDashboard;