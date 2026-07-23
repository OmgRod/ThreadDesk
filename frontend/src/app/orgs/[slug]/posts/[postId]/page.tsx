"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PostPage() {
  const { slug, postId } = useParams();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any>({ counts: {}, total: 0 });
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const postRes = await fetch(`/api/posts/${postId}`);
      const postData = await postRes.json();
      setPost(postData);

      if (postData.id) {
        const [commentsRes, reactionsRes] = await Promise.all([
          fetch(`/api/comments/post/${postData.id}`),
          fetch(`/api/reactions/post/${postData.id}`),
        ]);
        setComments(await commentsRes.json());
        setReactions(await reactionsRes.json());
      }

      setLoading(false);
    }
    load();
  }, [postId]);

  const addReaction = async (type: string) => {
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: parseInt(postId as string), type }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.id || data.action === "removed") {
      const reactionsRes = await fetch(`/api/reactions/post/${postId}`);
      setReactions(await reactionsRes.json());
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: parseInt(postId as string), content: newComment }),
      credentials: "include",
    });

    if (res.ok) {
      setNewComment("");
      const commentsRes = await fetch(`/api/comments/post/${postId}`);
      setComments(await commentsRes.json());
      toast.success("Comment added");
    } else {
      toast.error("Failed to add comment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Post not found</h2>
          <Link href={`/orgs/${slug}`} className="text-primary-600 hover:underline mt-4 inline-block">
            Back to organization
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/orgs/${slug}`}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {post.organization.name}
        </Link>

        {/* Post */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 font-bold">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <div className="prose dark:prose-invert max-w-none mb-6">
            {post.content}
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-2 mb-6">
            {["like", "love", "laugh", "wow"].map((type) => (
              <button
                key={type}
                onClick={() => addReaction(type)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                {type === "like" && "👍"}
                {type === "love" && "❤️"}
                {type === "laugh" && "😂"}
                {type === "wow" && "😮"}
                <span>{reactions.counts[type] || 0}</span>
              </button>
            ))}
          </div>

          {/* Comment form */}
          <form onSubmit={submitComment} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Comments */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No comments yet</p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {comment.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.user.name}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}