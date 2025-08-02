"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';

const TribeManagementModal = ({ isOpen, onClose }) => {
    const [tribes, setTribes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTribe, setEditingTribe] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchTribes();
        }
    }, [isOpen]);

    const fetchTribes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tribes')
                .select('*')
                .order('name');

            if (error) throw error;
            setTribes(data || []);
        } catch (error) {
            console.error('Error fetching tribes:', error);
            toast({
                title: "Error",
                description: "Failed to load tribes",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Tribe name is required",
                variant: "destructive"
            });
            return;
        }

        try {
            if (editingTribe) {
                // Update existing tribe
                const { error } = await supabase
                    .from('tribes')
                    .update({
                        name: formData.name.trim(),
                        description: formData.description.trim()
                    })
                    .eq('id', editingTribe.id);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Tribe updated successfully",
                });
            } else {
                // Create new tribe
                const { error } = await supabase
                    .from('tribes')
                    .insert([{
                        name: formData.name.trim(),
                        description: formData.description.trim()
                    }]);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Tribe created successfully",
                });
            }

            // Reset form and refresh tribes
            setFormData({ name: '', description: '' });
            setEditingTribe(null);
            await fetchTribes();
        } catch (error) {
            console.error('Error saving tribe:', error);
            toast({
                title: "Error",
                description: "Failed to save tribe",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (tribe) => {
        setEditingTribe(tribe);
        setFormData({
            name: tribe.name,
            description: tribe.description || ''
        });
    };

    const handleDelete = async (tribeId) => {
        if (!confirm('Are you sure you want to delete this tribe? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('tribes')
                .delete()
                .eq('id', tribeId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Tribe deleted successfully",
            });

            await fetchTribes();
        } catch (error) {
            console.error('Error deleting tribe:', error);
            toast({
                title: "Error",
                description: "Failed to delete tribe",
                variant: "destructive"
            });
        }
    };

    const handleCancel = () => {
        setFormData({ name: '', description: '' });
        setEditingTribe(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-white" />
                        <h2 className="text-xl font-semibold text-white">Tribe Management</h2>
                    </div>
                    <Button
                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                        size="icon"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </div>

                <div className="flex h-[calc(90vh-120px)]">
                    {/* Form Section */}
                    <div className="w-1/3 p-6 border-r">
                        <h3 className="font-semibold mb-4">
                            {editingTribe ? 'Edit Tribe' : 'Add New Tribe'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Tribe Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter tribe name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter tribe description"
                                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <Button type="submit" className="flex-1">
                                    {editingTribe ? (
                                        <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Update Tribe
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Tribe
                                        </>
                                    )}
                                </Button>

                                {editingTribe && (
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Tribes List */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <h3 className="font-semibold mb-4">Existing Tribes</h3>

                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tribes.map((tribe) => (
                                    <div key={tribe.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{tribe.name}</h4>
                                                {tribe.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{tribe.description}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(tribe)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(tribe.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {tribes.length === 0 && (
                                    <div className="text-center py-8 text-gray-600">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No tribes found</p>
                                        <p className="text-sm">Create your first tribe to get started</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TribeManagementModal; 