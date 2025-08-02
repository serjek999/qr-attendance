"use client";

import { useState, useEffect, useRef } from 'react';
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
    const fileInputRef = useRef(null);
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
    };

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
                    sbo_officer_id: user.id,
                    author_type: 'sbo_officer',
                    approved: true, // SBO officers can post directly without approval
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
            // Check if user already liked the post
            const { data: existingLike, error: checkError } = await supabase
                .from('post_likes')
                .select('*')
                .eq('post_id', postId)
                .eq('sbo_officer_id', user.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError;

            if (existingLike) {
                // Unlike the post
                const { error: unlikeError } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('sbo_officer_id', user.id);

                if (unlikeError) throw unlikeError;

                toast({
                    title: "Post Unliked",
                    description: "You unliked this post",
                });
            } else {
                // Like the post
                const { error: likeError } = await supabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        sbo_officer_id: user.id
                    });

                if (likeError) throw likeError;

                toast({
                    title: "Post Liked",
                    description: "You liked this post",
                });
            }

            // Refresh posts to update like count
            fetchPosts();
        } catch (error) {
            console.error('Error handling like:', error);
            toast({
                title: "Error",
                description: "Failed to update like",
                variant: "destructive"
            });
        }
    };

    const checkIfLiked = (postId) => {
        // This would need to be implemented with a separate query to check if current user liked the post
        // For now, we'll return false and implement this later
        return false;
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
                            className="bg-green-600 hover:bg-green-700"
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
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
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
                                                            className="w-20 h-20 object-cover rounded-lg border-2 border-white/30 hover:border-blue-300 transition-colors"
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
                                            <p className="text-sm text-white/70 mt-1">
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
                                                className="text-white/70 hover:text-white hover:bg-white/10"
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
                                                className="text-white/70 hover:text-white hover:bg-white/10"
                                            >
                                                <Smile className="h-4 w-4 mr-1" />
                                                Emoji
                                            </Button>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={(!newPost.trim() && selectedImages.length === 0) || uploading}
                                            className="bg-blue-600 hover:bg-blue-700"
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
                                <Card key={post.id} className="bg-white/5 backdrop-blur-sm border border-white/20">
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                                                                className="hidden w-full h-32 bg-white/20 rounded-lg items-center justify-center text-white/70 text-sm"
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
                                                className={`text-white/70 hover:text-white hover:bg-white/10 ${checkIfLiked(post.id) ? 'text-red-400' : ''}`}
                                            >
                                                <Heart className={`h-4 w-4 mr-1 ${checkIfLiked(post.id) ? 'fill-current' : ''}`} />
                                                {post.likes_count || 0}
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                                                <MessageCircle className="h-4 w-4 mr-1" />
                                                Comment
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
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