"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Send, Loader2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/modal";

// Simple Twemoji mapper
const twemoji = (text: string) => {
  const emojis: Record<string, string> = {
    "👍": "https://twemoji.maxcdn.com/v/14.0.2/72x72/1f44d.png",
    "❤️": "https://twemoji.maxcdn.com/v/14.0.2/72x72/2764.png",
    "😂": "https://twemoji.maxcdn.com/v/14.0.2/72x72/1f602.png",
    "😮": "https://twemoji.maxcdn.com/v/14.0.2/72x72/1f62e.png",
  };
  return [...text].map((char, index) => emojis[char] ? <img key={index} src={emojis[char]} className="inline h-4 w-4 mx-0.5" alt={char} /> : char);
};

export default function PostPage() {
  const { slug, postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any>({ counts: {}, userReactions: [], total: 0 });
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const postRes = await fetch(`/api/posts/${postId}`);
      const postData = await postRes.json();
      setPost(postData);

      // Track view
      if (postData.id && postData.organizationId) {
          fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  organizationId: postData.organizationId,
                  postId: postData.id,
                  event: "view"
              }),
              credentials: "include"
          }).catch(console.error);
      }

      if (postData.id) {
        const [commentsRes, reactionsRes] = await Promise.all([
          fetch(`/api/comments/post/${postData.id}`),
          fetch(`/api/reactions/post/${postData.id}`, { credentials: "include" }),
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
      const reactionsRes = await fetch(`/api/reactions/post/${postId}`, { credentials: "include" });
      setReactions(await reactionsRes.json());
    }
  };

  const deleteComment = async () => {
    if (commentToDelete === null) return;
    const res = await fetch(`/api/comments/${commentToDelete}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setComments(comments.filter(c => c.id !== commentToDelete));
      toast.success("Comment deleted");
      setCommentToDelete(null);
    } else {
      toast.error("Failed to delete comment");
      setCommentToDelete(null);
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Modal isOpen={commentToDelete !== null} onClose={() => setCommentToDelete(null)} title="Delete Comment">
        <p className="text-muted-foreground mb-4">Are you sure you want to delete this comment?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setCommentToDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={deleteComment}>Delete</Button>
        </div>
      </Modal>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/orgs/${slug}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to organization
        </Link>

        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{post?.title}</h1>
          <p className="mb-6">{post?.content}</p>
          
          {post?.attachments?.map((a: any) => (
             <img key={a.id} src={a.url} alt="Attachment" className="mb-4 rounded-lg" />
          ))}

          <div className="flex items-center gap-2 mb-6">
            {["like", "love", "laugh", "wow"].map((type) => {
              const isActive = reactions.userReactions?.includes(type);
              const emojiMap: Record<string, string> = { "like": "👍", "love": "❤️", "laugh": "😂", "wow": "😮" };
              return (
                <button
                  key={type}
                  onClick={() => addReaction(type)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    isActive ? "bg-blue-100 border-blue-400 text-blue-700" : "border-border hover:bg-muted"
                  }`}
                >
                  {twemoji(emojiMap[type])}
                  <span>{reactions.counts?.[type] || 0}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submitComment} className="flex gap-2 mb-6">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-4 py-2 border rounded-lg bg-background" />
            <Button type="submit"><Send className="h-4 w-4" /></Button>
          </form>

          <div className="space-y-4">
            {comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 justify-between">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm shrink-0">{comment.user?.name?.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-sm">{comment.user?.name}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
                {(user?.id === comment.user?.id || post?.organizationId === user?.id) && (
                  <Button variant="ghost" size="icon" onClick={() => setCommentToDelete(comment.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}