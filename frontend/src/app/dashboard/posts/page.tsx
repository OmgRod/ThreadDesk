"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, Clock, Globe, Loader2, Edit3, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function PostsPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (authLoading) return;
      if (!user) {
        router.push("/auth");
        return;
      }

      const postsRes = await fetch("/api/posts/dashboard/all", { credentials: "include" });
      if (postsRes.ok) {
        setPosts(await postsRes.json());
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  const deletePost = async () => {
    if (!postToDelete) return;

    const res = await fetch(`/api/posts/${postToDelete.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: postToDelete.orgId }),
      credentials: "include",
    });

    if (res.ok) {
      toast.success("Post deleted!");
      setPosts(posts.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete post");
      setPostToDelete(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Modal isOpen={!!postToDelete} onClose={() => setPostToDelete(null)} title="Delete Post">
        <p className="text-muted-foreground mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setPostToDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={deletePost}>Delete</Button>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
        >
          <Edit3 className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>You haven't published any posts yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post: any) => (
              <div key={post.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link href={`/orgs/${post.organization.slug}/posts/${post.id}`} className="font-medium text-lg hover:text-primary line-clamp-1">
                    {post.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">{post.organization.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      post.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground text-sm flex items-center gap-1 mr-2">
                    <Globe className={`h-4 w-4 ${post.visibility === "public" ? "text-green-500" : ""}`} />
                    {post.visibility}
                  </span>
                  <button
                    onClick={() => setPostToDelete({ id: post.id, orgId: post.organizationId })}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
