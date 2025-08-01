"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export const usePosts = () => {
    const [posts, setPosts] = useState([]);
    const [pendingPosts, setPendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPending, setLoadingPending] = useState(true);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
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
                .order('created_at', { ascending: false });

            if (error) throw error;

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
    }, []);

    const fetchPendingPosts = useCallback(async () => {
        try {
            setLoadingPending(true);
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    students!posts_author_id_fkey(full_name),
                    sbo_officers!posts_sbo_officer_id_fkey(full_name),
                    faculty!posts_faculty_id_fkey(full_name),
                    admins!posts_admin_id_fkey(full_name)
                `)
                .eq('approved', false)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const processedPosts = data.map(post => {
                let authorName = 'Unknown Author';
                let authorType = 'Unknown';

                // Determine author type based on which ID field is populated
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

            setPendingPosts(processedPosts);
        } catch (error) {
            console.error('Error fetching pending posts:', error);
            toast({
                title: "Error",
                description: "Failed to load pending posts",
                variant: "destructive"
            });
        } finally {
            setLoadingPending(false);
        }
    }, []);

    const createPost = useCallback(async (postData) => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([postData])
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Success",
                description: "Post created successfully",
            });

            // Refresh posts
            await fetchPosts();
            return data;
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post",
                variant: "destructive"
            });
            throw error;
        }
    }, [fetchPosts]);

    const updatePost = useCallback(async (postId, updates) => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .update(updates)
                .eq('id', postId)
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Success",
                description: "Post updated successfully",
            });

            // Refresh posts
            await fetchPosts();
            await fetchPendingPosts();
            return data;
        } catch (error) {
            console.error('Error updating post:', error);
            toast({
                title: "Error",
                description: "Failed to update post",
                variant: "destructive"
            });
            throw error;
        }
    }, [fetchPosts, fetchPendingPosts]);

    const deletePost = useCallback(async (postId) => {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Post deleted successfully",
            });

            // Refresh posts
            await fetchPosts();
            await fetchPendingPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            toast({
                title: "Error",
                description: "Failed to delete post",
                variant: "destructive"
            });
            throw error;
        }
    }, [fetchPosts, fetchPendingPosts]);

    const approvePost = useCallback(async (postId) => {
        return updatePost(postId, { approved: true });
    }, [updatePost]);

    const rejectPost = useCallback(async (postId) => {
        return updatePost(postId, { approved: false });
    }, [updatePost]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        fetchPendingPosts();
    }, [fetchPendingPosts]);

    return {
        // State
        posts,
        pendingPosts,
        loading,
        loadingPending,

        // Functions
        fetchPosts,
        fetchPendingPosts,
        createPost,
        updatePost,
        deletePost,
        approvePost,
        rejectPost
    };
}; 