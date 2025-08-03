"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, User, Calendar, MessageCircle, Plus, Heart, Share2, Image, Smile, X, Upload } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';

const PostsFeed = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [comments, setComments] = useState({});
    const [showComments, setShowComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    const fetchPosts = useCallback(async () => {
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
                    authorType,
                    images: post.images || []
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
    }, [toast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Check if supabase client is available
    if (!supabase) {
        console.error('Supabase client is not available in PostsFeed component');
        return (
            <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h3 className="text-red-400 font-semibold">Configuration Error</h3>
                    <p className="text-red-300">Database client not properly configured.</p>
                </div>
            </div>
        );
    }

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);

        if (selectedImages.length + files.length > 3) {
            toast({
                title: "Too Many Images",
                description: "You can only upload up to 3 images per post",
                variant: "destructive"
            });
            return;
        }

        const validFiles = files.filter(file => {
            // Define accepted image types - support ALL image formats
            const acceptedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/bmp',
                'image/tiff',
                'image/tif',
                'image/svg+xml',
                'image/avif',
                'image/heic',
                'image/heif',
                'image/ico',
                'image/cur',
                'image/apng',
                'image/jfif',
                'image/pjpeg',
                'image/pjp'
            ];

            if (!acceptedTypes.includes(file.type)) {
                toast({
                    title: "Invalid File Type",
                    description: `${file.name} is not a valid image file. Please select an image file.`,
                    variant: "destructive"
                });
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File Too Large",
                    description: `${file.name} is larger than 5MB. Please choose a smaller image.`,
                    variant: "destructive"
                });
                return false;
            }
            return true;
        });

        setSelectedImages(prev => [...prev, ...validFiles]);
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async () => {
        if (selectedImages.length === 0) return [];

        const uploadedUrls = [];
        setUploading(true);

        try {
            for (const image of selectedImages) {
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name}`;
                const { data, error } = await supabase.storage
                    .from('post-images')
                    .upload(fileName, image);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast({
                title: "Upload Error",
                description: "Failed to upload images",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }

        return uploadedUrls;
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim() && selectedImages.length === 0) {
            toast({
                title: "Error",
                description: "Please enter some content or add images for your post",
                variant: "destructive"
            });
            return;
        }

        try {
            setUploading(true);
            const imageUrls = await uploadImages();

            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert({
                    content: newPost,
                    admin_id: user.id,
                    author_type: 'admin',
                    approved: true, // Admins can post directly without approval
                    images: imageUrls
                })
                .select()
                .single();

            if (postError) throw postError;

            toast({
                title: "Success",
                description: "Post created successfully!",
            });

            setNewPost("");
            setSelectedImages([]);
            setShowCreateForm(false);
            fetchPosts(); // Refresh posts
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            console.log('Handling like for post:', postId, 'User:', user);
            console.log('Supabase client:', supabase);

            // Check if supabase client is properly initialized
            if (!supabase) {
                console.error('Supabase client is not initialized');
                toast({
                    title: "Configuration Error",
                    description: "Database client not properly configured.",
                    variant: "destructive"
                });
                return;
            }

            // Test the connection first
            console.log('Testing database connection...');
            const { data: testData, error: testError } = await supabase
                .from('post_likes')
                .select('id')
                .limit(1);

            if (testError) {
                console.error('Connection test failed:', testError);
                console.error('Test error details:', {
                    message: testError.message,
                    code: testError.code,
                    details: testError.details,
                    hint: testError.hint
                });
                toast({
                    title: "Connection Error",
                    description: "Unable to connect to database. Please check your connection.",
                    variant: "destructive"
                });
                return;
            }

            console.log('Connection test successful, proceeding with like operation...');

            // First, try to check if the admin_id column exists by attempting a simple query
            const { data: testQuery, error: testError2 } = await supabase
                .from('post_likes')
                .select('admin_id')
                .limit(1);

            if (testError2 && testError2.message && testError2.message.includes('column "admin_id" does not exist')) {
                // The admin_id column doesn't exist, so we'll use a fallback approach
                console.log('admin_id column not found, using fallback approach');

                // For now, just show a toast that the feature is being set up
                toast({
                    title: "Feature Coming Soon",
                    description: "Like functionality is being set up. Please try again later.",
                });
                return;
            }

            // Check if user already liked the post
            console.log('Checking if user already liked the post...');
            const { data: existingLike, error: checkError } = await supabase
                .from('post_likes')
                .select('*')
                .eq('post_id', postId)
                .eq('admin_id', user.id)
                .single();

            console.log('Check existing like result:', { existingLike, checkError });

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing like:', checkError);
                console.error('Check error details:', {
                    message: checkError.message,
                    code: checkError.code,
                    details: checkError.details,
                    hint: checkError.hint
                });
                throw checkError;
            }

            if (existingLike) {
                // Unlike the post
                console.log('Unliking post:', postId);
                const { error: unlikeError } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('admin_id', user.id);

                if (unlikeError) {
                    console.error('Error unliking post:', unlikeError);
                    console.error('Unlike error details:', {
                        message: unlikeError.message,
                        code: unlikeError.code,
                        details: unlikeError.details,
                        hint: unlikeError.hint
                    });
                    throw unlikeError;
                }

                toast({
                    title: "Post Unliked",
                    description: "You unliked this post",
                });
            } else {
                // Like the post
                console.log('Liking post:', postId);
                const { error: likeError } = await supabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        admin_id: user.id
                    });

                if (likeError) {
                    console.error('Error liking post:', likeError);
                    console.error('Like error details:', {
                        message: likeError.message,
                        code: likeError.code,
                        details: likeError.details,
                        hint: likeError.hint
                    });
                    throw likeError;
                }

                toast({
                    title: "Post Liked",
                    description: "You liked this post",
                });
            }

            // Refresh posts to update like count
            fetchPosts();
        } catch (error) {
            console.error('Error handling like:', error);
            console.error('Error type:', typeof error);
            console.error('Error constructor:', error.constructor.name);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                name: error.name
            });

            // Show a more user-friendly error message
            let errorMessage = "Failed to update like";
            if (error.message) {
                if (error.message.includes('column "admin_id" does not exist')) {
                    errorMessage = "Like feature is being set up. Please try again later.";
                } else if (error.message.includes('permission denied')) {
                    errorMessage = "You don't have permission to like posts.";
                } else if (error.message.includes('fetch')) {
                    errorMessage = "Network error. Please check your internet connection.";
                } else if (error.message.includes('timeout')) {
                    errorMessage = "Request timed out. Please try again.";
                } else {
                    errorMessage = error.message;
                }
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const checkIfLiked = (postId) => {
        // This would need to be implemented with a separate query to check if current user liked the post
        // For now, we'll return false and implement this later
        return false;
    };

    const handleComment = async (postId, commentText) => {
        try {
            const newComment = {
                id: Date.now(),
                postId,
                userId: user.id,
                userName: user.full_name,
                content: commentText,
                createdAt: new Date().toISOString()
            };

            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));

            toast({
                title: "Comment Added",
                description: "Your comment has been posted",
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            toast({
                title: "Error",
                description: "Failed to add comment",
                variant: "destructive"
            });
        }
    };

    const toggleComments = (postId) => {
        setShowComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    if (loading) {
        return (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="border border-white/20 rounded-lg p-4 bg-white/5">
                                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
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
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
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
                                        className="mb-3 bg-transparent border border-white/20 text-white placeholder:text-white/50"
                                    />

                                    {/* Image Preview */}
                                    {selectedImages.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedImages.map((image, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={URL.createObjectURL(image)}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                                            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-sm text-white/50 mt-1">
                                                {selectedImages.length}/3 images selected • {selectedImages.reduce((total, img) => total + img.size, 0).toFixed(1)} MB total
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex space-x-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={selectedImages.length >= 3}
                                            >
                                                <Image className="h-4 w-4 mr-1" />
                                                Photo ({selectedImages.length}/3)
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
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
                                        <Button
                                            type="submit"
                                            disabled={(!newPost.trim() && selectedImages.length === 0) || uploading}
                                        >
                                            {uploading ? 'Posting...' : 'Post'}
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
                                <FileText className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70">No posts yet. Create your first post!</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <Card key={post.id} className="bg-white/10 backdrop-blur-md border border-white/20">
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{post.authorName}</p>
                                                <p className="text-sm text-white/70">
                                                    {new Date(post.created_at).toLocaleDateString()} • {post.authorType}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-white mb-4">{post.content}</p>

                                        {/* Post Images */}
                                        {post.images && post.images.length > 0 && (
                                            <div className="mb-4">
                                                <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' :
                                                    post.images.length === 2 ? 'grid-cols-2' :
                                                        'grid-cols-3'
                                                    }`}>
                                                    {post.images.map((imageUrl, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Post image ${index + 1}`}
                                                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                                loading="lazy"
                                                            />
                                                            <div
                                                                className="hidden w-full h-32 bg-gray-200 rounded-lg items-center justify-center text-gray-500 text-sm"
                                                                style={{ display: 'none' }}
                                                            >
                                                                <span>Image not available</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleLike(post.id)}
                                                className={checkIfLiked(post.id) ? 'text-red-500' : ''}
                                            >
                                                <Heart className={`h-4 w-4 mr-1 ${checkIfLiked(post.id) ? 'fill-current' : ''}`} />
                                                {post.likes_count || 0}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleComments(post.id)}
                                            >
                                                <MessageCircle className="h-4 w-4 mr-1" />
                                                {comments[post.id]?.length || 0} Comments
                                            </Button>
                                        </div>

                                        {/* Comments Section */}
                                        {showComments[post.id] && (
                                            <div className="mt-4 space-y-3">
                                                {/* Display existing comments */}
                                                {comments[post.id]?.map((comment) => (
                                                    <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                {comment.userName?.split(' ').map(n => n[0]).join('') || 'U'}
                                                            </div>
                                                            <span className="font-semibold text-white text-sm">{comment.userName}</span>
                                                            <span className="text-white/50 text-xs">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-white/80 text-sm">{comment.content}</p>
                                                    </div>
                                                ))}

                                                {/* Add new comment */}
                                                <div className="flex space-x-2">
                                                    <Input
                                                        placeholder="Write a comment..."
                                                        value={newComment[post.id] || ''}
                                                        onChange={(e) => setNewComment(prev => ({
                                                            ...prev,
                                                            [post.id]: e.target.value
                                                        }))}
                                                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            if (newComment[post.id]?.trim()) {
                                                                handleComment(post.id, newComment[post.id]);
                                                                setNewComment(prev => ({
                                                                    ...prev,
                                                                    [post.id]: ''
                                                                }));
                                                            }
                                                        }}
                                                        disabled={!newComment[post.id]?.trim()}
                                                    >
                                                        Post
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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