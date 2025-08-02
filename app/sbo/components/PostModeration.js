"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Check, X, Clock } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useToast } from "@/hooks/use-toast";

const PostModeration = () => {
    const { pendingPosts, loadingPending, approvePost, rejectPost } = usePosts();
    const { toast } = useToast();

    const handleApprove = async (postId) => {
        try {
            await approvePost(postId);
            toast({
                title: "Post Approved",
                description: "Post has been approved and published"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to approve post",
                variant: "destructive"
            });
        }
    };

    const handleReject = async (postId) => {
        if (confirm('Are you sure you want to reject this post?')) {
            try {
                await rejectPost(postId);
                toast({
                    title: "Post Rejected",
                    description: "Post has been rejected"
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to reject post",
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

    if (loadingPending) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-white/20 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-white/20 rounded"></div>
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
                    <h2 className="text-2xl font-bold text-white">Post Moderation</h2>
                    <p className="text-white/70">Review and approve pending posts</p>
                </div>
                <Badge variant="secondary" className="text-sm bg-white/20 text-white">
                    {pendingPosts.length} Pending
                </Badge>
            </div>

            {/* Pending Posts List */}
            <div className="space-y-4">
                {pendingPosts.length === 0 ? (
                    <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                        <CardContent className="text-center py-8">
                            <Clock className="h-12 w-12 text-white/50 mx-auto mb-4" />
                            <p className="text-white/70">No pending posts to moderate</p>
                        </CardContent>
                    </Card>
                ) : (
                    pendingPosts.map((post) => (
                        <Card key={post.id} className="border-l-4 border-l-yellow-500 bg-white/10 backdrop-blur-md border border-white/20">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg text-white">{post.title}</CardTitle>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(post.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {post.authorName || 'Unknown'}
                                                <Badge variant="outline" className="ml-2 bg-white/20 text-white border-white/30">
                                                    {post.authorType}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">Pending Review</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-white mb-4">{post.content}</p>
                                {post.category && (
                                    <Badge variant="outline" className="mb-4 bg-white/20 text-white border-white/30">
                                        {post.category}
                                    </Badge>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleApprove(post.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleReject(post.id)}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default PostModeration; 