"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, User, Calendar, MessageCircle, Plus, Heart, Share2, Image, Smile } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';

const PostsFeed = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    students!posts_author_id_fkey(full_name),
                    sbo_officers!posts_sbo_officer_id_fkey(full_name),
                    faculty!posts_faculty_id_fkey(full_name),
                    admins!posts_admin_id_fkey(full_name)
                `)
                .eq('approved', true)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Process posts to get author names
            const processedPosts = data.map(post => {
                let authorName = 'Unknown Author';
                let authorType = 'Unknown';

                if (post.students?.full_name) {
                    authorName = post.students.full_name;
                    authorType = 'Student';
                } else if (post.sbo_officers?.full_name) {
                    authorName = post.sbo_officers.full_name;
                    authorType = 'SBO Officer';
                } else if (post.faculty?.full_name) {
                    authorName = post.faculty.full_name;
                    authorType = 'Faculty';
                } else if (post.admins?.full_name) {
                    authorName = post.admins.full_name;
                    authorType = 'Admin';
                }

                return {
                    ...post,
                    authorName,
                    authorType
                };
            });

            setPosts(processedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast({
                title: "Error",
                description: "Failed to load posts",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) {
            toast({
                title: "Error",
                description: "Please enter some content for your post",
                variant: "destructive"
            });
            return;
        }

        try {
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert({
                    content: newPost,
                    admin_id: user.id,
                    author_type: 'admin',
                    approved: true // Admins can post directly without approval
                })
                .select()
                .single();

            if (postError) {
                console.error('Error creating post:', postError);
                toast({
                    title: "Error",
                    description: "Failed to create post",
                    variant: "destructive"
                });
                return;
            }

            setNewPost("");
            setShowCreateForm(false);
            toast({
                title: "Post Created",
                description: "Your post has been published",
            });

            // Reload posts
            await fetchPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        }
    };

    const handleLike = async (postId) => {
        // Like functionality is currently only available for students
        toast({
            title: "Feature Unavailable",
            description: "Like functionality is currently only available for students",
            variant: "destructive"
        });
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="border rounded-lg p-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Create Post */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Posts Feed</span>
                        <Button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {showCreateForm ? 'Cancel' : 'Create Post'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {showCreateForm && (
                        <form onSubmit={handleCreatePost} className="space-y-4 mb-6">
                            <div className="flex space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                                </div>
                                <div className="flex-1">
                                    <Input
                                        placeholder="What's on your mind?"
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        className="mb-3"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="flex space-x-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    toast({
                                                        title: "Photo Upload",
                                                        description: "Photo upload feature will be available soon."
                                                    });
                                                }}
                                            >
                                                <Image className="h-4 w-4 mr-1" />
                                                Photo
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    toast({
                                                        title: "Emoji Picker",
                                                        description: "Emoji picker will be available soon."
                                                    });
                                                }}
                                            >
                                                <Smile className="h-4 w-4 mr-1" />
                                                Emoji
                                            </Button>
                                        </div>
                                        <Button type="submit" disabled={!newPost.trim()}>
                                            Post
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Posts List */}
                    <div className="space-y-4">
                        {posts.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <Card key={post.id}>
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{post.authorName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(post.created_at).toLocaleDateString()} • {post.authorType}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-800 mb-4">{post.content}</p>
                                        <div className="flex items-center space-x-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleLike(post.id)}
                                            >
                                                <Heart className="h-4 w-4 mr-1" />
                                                {post.likes_count || 0}
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <MessageCircle className="h-4 w-4 mr-1" />
                                                Comment
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Share2 className="h-4 w-4 mr-1" />
                                                Share
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PostsFeed; 