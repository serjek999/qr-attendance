"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, TrendingUp, Users, Target, Award } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const TribePerformance = () => {
    const [tribes, setTribes] = useState([]);
    const [tribeScores, setTribeScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTribeData();
    }, []);

    const loadTribeData = async () => {
        try {
            // Load tribes
            const { data: tribesData, error: tribesError } = await supabase
                .from('tribes')
                .select('*')
                .order('name');

            if (tribesError) {
                console.error('Error loading tribes:', tribesError);
                return;
            }

            // Load tribe scores
            const { data: scoresData, error: scoresError } = await supabase
                .from('tribe_scores')
                .select('*')
                .order('created_at', { ascending: false });

            if (scoresError) {
                console.error('Error loading tribe scores:', scoresError);
                return;
            }

            // Calculate total scores for each tribe
            const tribesWithScores = tribesData.map(tribe => {
                const tribeScoreRecords = scoresData.filter(score => score.tribe_id === tribe.id);
                const totalScore = tribeScoreRecords.reduce((sum, score) => sum + score.points, 0);

                // Calculate scores by category
                const categoryScores = {
                    academic: tribeScoreRecords.filter(s => s.category === 'academic').reduce((sum, s) => sum + s.points, 0),
                    sports: tribeScoreRecords.filter(s => s.category === 'sports').reduce((sum, s) => sum + s.points, 0),
                    cultural: tribeScoreRecords.filter(s => s.category === 'cultural').reduce((sum, s) => sum + s.points, 0),
                    leadership: tribeScoreRecords.filter(s => s.category === 'leadership').reduce((sum, s) => sum + s.points, 0),
                    general: tribeScoreRecords.filter(s => s.category === 'general').reduce((sum, s) => sum + s.points, 0)
                };

                return {
                    ...tribe,
                    totalScore,
                    categoryScores,
                    recentScores: tribeScoreRecords.slice(0, 5) // Last 5 scores
                };
            });

            // Sort by total score (descending)
            tribesWithScores.sort((a, b) => b.totalScore - a.totalScore);

            setTribes(tribesWithScores);
            setTribeScores(scoresData || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading tribe data:', error);
            setLoading(false);
        }
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
                return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Tribe Performance</h2>
                    <p className="text-white/70">Live rankings and competition standings</p>
                </div>
                <Button onClick={loadTribeData} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Overall Leaderboard */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                        Overall Leaderboard
                    </CardTitle>
                    <CardDescription className="text-white/70">Current tribe rankings based on total points</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tribes.map((tribe, index) => (
                            <div key={tribe.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors bg-white/5 backdrop-blur-sm">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-12 h-12">
                                        {getRankIcon(index + 1)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Tribe {tribe.name}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge className="bg-white/20 text-white/90">
                                                {tribe.recentScores.length} events
                                            </Badge>
                                            <Badge className="bg-green-400/20 text-green-300">
                                                {tribe.totalScore} points
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">
                                        {tribe.totalScore}
                                    </div>
                                    <div className="text-sm text-white/70">total points</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['academic', 'sports', 'cultural', 'leadership', 'general'].map((category) => (
                    <Card key={category} className="bg-white/10 backdrop-blur-md border border-white/20">
                        <CardHeader>
                            <CardTitle className="flex items-center text-white">
                                <Award className="h-5 w-5 mr-2" />
                                {category.charAt(0).toUpperCase() + category.slice(1)} Rankings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {tribes
                                    .map(tribe => ({
                                        ...tribe,
                                        categoryScore: tribe.categoryScores[category]
                                    }))
                                    .filter(tribe => tribe.categoryScore > 0)
                                    .sort((a, b) => b.categoryScore - a.categoryScore)
                                    .slice(0, 3)
                                    .map((tribe, index) => (
                                        <div key={tribe.id} className="flex items-center justify-between p-2 bg-white/10 rounded">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-white">#{index + 1}</span>
                                                <span className="font-medium text-white">Tribe {tribe.name}</span>
                                            </div>
                                            <Badge className={getCategoryColor(category)}>
                                                {tribe.categoryScore} pts
                                            </Badge>
                                        </div>
                                    ))}
                                {tribes.filter(tribe => tribe.categoryScores[category] > 0).length === 0 && (
                                    <p className="text-sm text-white/70 text-center py-4">
                                        No {category} scores yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <Target className="h-5 w-5 mr-2" />
                        Recent Score Activity
                    </CardTitle>
                    <CardDescription className="text-white/70">Latest points awarded to tribes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tribeScores.slice(0, 10).map((score) => (
                            <div key={score.id} className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5 backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <Trophy className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{score.event_name}</p>
                                        <p className="text-sm text-white/70">
                                            {score.description || 'No description'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                        <Badge className={getCategoryColor(score.category)}>
                                            {score.category}
                                        </Badge>
                                        <Badge variant="secondary">
                                            +{score.points} pts
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-white/70 mt-1">
                                        {new Date(score.created_at).toLocaleDateString()}
                                    </p>
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
        </div>
    );
};

export default TribePerformance; 