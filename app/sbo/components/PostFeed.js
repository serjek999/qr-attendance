"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Edit, Trash2, Plus } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useToast } from "@/hooks/use-toast";

const PostFeed = () => {
    const { posts, loading, fetchPosts, deletePost, createPost } = usePosts();
    const { toast } = useToast();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: 'announcement'
    });

    const handleCreatePost = async (e) => {
        e.preventDefault();

        if (!newPost.title || !newPost.content) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive"
            });
            return;
        }

        try {
            await createPost(newPost);
            setNewPost({ title: '', content: '', category: 'announcement' });
            setShowCreateForm(false);
            toast({
                title: "Post Created",
                description: "Your post has been created successfully"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        }
    };

    const handleDeletePost = async (postId) => {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await deletePost(postId);
                toast({
                    title: "Post Deleted",
                    description: "Post has been deleted successfully"
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete post",
                    variant: "destructive"
                });
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
                    <h2 className="text-2xl font-bold text-foreground">Posts Feed</h2>
                    <p className="text-muted-foreground">Manage announcements and posts</p>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                </Button>
            </div>

            {/* Create Post Form */}
            {showCreateForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                    className="w-full mt-1 p-2 border rounded-md"
                                    placeholder="Enter post title"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Content</label>
                                <textarea
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    className="w-full mt-1 p-2 border rounded-md h-32"
                                    placeholder="Enter post content"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    value={newPost.category}
                                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                    className="w-full mt-1 p-2 border rounded-md"
                                >
                                    <option value="announcement">Announcement</option>
                                    <option value="event">Event</option>
                                    <option value="reminder">Reminder</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">Create Post</Button>
                                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Posts List */}
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                        </CardContent>
                    </Card>
                ) : (
                    posts.map((post) => (
                        <Card key={post.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{post.title}</CardTitle>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(post.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {post.authorName || 'Unknown'}
                                                <Badge variant="outline" className="ml-2">
                                                    {post.authorType}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={post.approved ? 'default' : 'secondary'}>
                                            {post.approved ? 'Approved' : 'Pending'}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeletePost(post.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground">{post.content}</p>
                                {post.category && (
                                    <Badge variant="outline" className="mt-2">
                                        {post.category}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default PostFeed; 