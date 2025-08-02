"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trophy, TrendingUp, Users, Award, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TribeScoring = () => {
    const [tribes, setTribes] = useState([]);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddScoreDialog, setShowAddScoreDialog] = useState(false);
    const [editingScore, setEditingScore] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        tribe_id: '',
        event_name: '',
        points: '',
        category: 'general',
        description: ''
    });

    useEffect(() => {
        loadTribes();
        loadScores();
    }, []);

    const loadTribes = async () => {
        try {
            const { data, error } = await supabase
                .from('tribes')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setTribes(data || []);
        } catch (error) {
            console.error('Error loading tribes:', error);
            toast.error('Failed to load tribes');
        }
    };

    const loadScores = async () => {
        try {
            const { data, error } = await supabase
                .from('tribe_scores')
                .select(`
                    *,
                    tribes(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setScores(data || []);
        } catch (error) {
            console.error('Error loading scores:', error);
            toast.error('Failed to load scores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const scoreData = {
                ...formData,
                points: parseInt(formData.points),
                created_by: 'admin',
                created_at: new Date().toISOString()
            };

            let result;
            if (editingScore) {
                result = await supabase
                    .from('tribe_scores')
                    .update(scoreData)
                    .eq('id', editingScore.id);
            } else {
                result = await supabase
                    .from('tribe_scores')
                    .insert([scoreData]);
            }

            if (result.error) throw result.error;

            toast.success(editingScore ? 'Score updated successfully' : 'Score added successfully');
            setShowAddScoreDialog(false);
            setEditingScore(null);
            resetForm();
            loadScores();
        } catch (error) {
            console.error('Error saving score:', error);
            toast.error('Failed to save score');
        }
    };

    const handleDelete = async (scoreId) => {
        if (!confirm('Are you sure you want to delete this score entry?')) return;

        try {
            const { error } = await supabase
                .from('tribe_scores')
                .delete()
                .eq('id', scoreId);

            if (error) throw error;

            toast.success('Score deleted successfully');
            loadScores();
        } catch (error) {
            console.error('Error deleting score:', error);
            toast.error('Failed to delete score');
        }
    };

    const handleEdit = (score) => {
        setEditingScore(score);
        setFormData({
            tribe_id: score.tribe_id,
            event_name: score.event_name,
            points: score.points.toString(),
            category: score.category,
            description: score.description
        });
        setShowAddScoreDialog(true);
    };

    const resetForm = () => {
        setFormData({
            tribe_id: '',
            event_name: '',
            points: '',
            category: 'general',
            description: ''
        });
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

    const getTribeTotalScore = (tribeId) => {
        return scores
            .filter(score => score.tribe_id === tribeId)
            .reduce((total, score) => total + score.points, 0);
    };

    const getTribeRanking = () => {
        const tribeTotals = tribes.map(tribe => ({
            ...tribe,
            totalScore: getTribeTotalScore(tribe.id)
        }));

        return tribeTotals
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((tribe, index) => ({
                ...tribe,
                rank: index + 1
            }));
    };

    const tribeRanking = getTribeRanking();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading tribe scores...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tribe Scoring</h2>
                    <p className="text-gray-600">Manage tribe scores and track rankings</p>
                </div>
                <Dialog open={showAddScoreDialog} onOpenChange={setShowAddScoreDialog}>
                    <DialogTrigger asChild>
                        <Button onClick={() => {
                            setEditingScore(null);
                            resetForm();
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Score
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingScore ? 'Edit Score' : 'Add New Score'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="tribe_id">Tribe *</Label>
                                <Select value={formData.tribe_id} onValueChange={(value) => setFormData({ ...formData, tribe_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tribe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tribes.map((tribe) => (
                                            <SelectItem key={tribe.id} value={tribe.id}>
                                                {tribe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="event_name">Event/Activity Name *</Label>
                                <Input
                                    id="event_name"
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    required
                                    placeholder="Enter event or activity name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="points">Points *</Label>
                                    <Input
                                        id="points"
                                        type="number"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                        required
                                        placeholder="Enter points"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter description (optional)"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddScoreDialog(false);
                                        setEditingScore(null);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingScore ? 'Update Score' : 'Add Score'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tribe Rankings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Tribe Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tribeRanking.map((tribe, index) => (
                            <div key={tribe.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                                        {tribe.rank}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{tribe.name}</h3>
                                        <p className="text-sm text-gray-600">{tribe.totalScore} total points</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {index === 0 && (
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                            <Award className="h-3 w-3 mr-1" />
                                            1st Place
                                        </Badge>
                                    )}
                                    {index === 1 && (
                                        <Badge className="bg-gray-100 text-gray-800">
                                            <Award className="h-3 w-3 mr-1" />
                                            2nd Place
                                        </Badge>
                                    )}
                                    {index === 2 && (
                                        <Badge className="bg-orange-100 text-orange-800">
                                            <Award className="h-3 w-3 mr-1" />
                                            3rd Place
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Scores */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Score Entries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {scores.length === 0 ? (
                            <div className="text-center py-8">
                                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No scores yet</h3>
                                <p className="text-gray-600 mb-4">Add the first score entry to get started</p>
                                <Button onClick={() => setShowAddScoreDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Score
                                </Button>
                            </div>
                        ) : (
                            scores.map((score) => (
                                <div key={score.id} className="flex justify-between items-center p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">{score.event_name}</h4>
                                            <Badge className={getCategoryColor(score.category)}>
                                                {score.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {score.tribes?.name} • {score.points} points
                                        </p>
                                        {score.description && (
                                            <p className="text-sm text-gray-500">{score.description}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(score)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(score.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TribeScoring; 