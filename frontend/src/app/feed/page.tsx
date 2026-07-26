"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { formatRelativeDate, fixUploadUrl } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.id) {
          router.push("/auth");
          return;
        }
        setUser(data);
        loadFeed(1);
      });
  }, [router]);

  const loadFeed = async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/feed?page=${p}&limit=10`, {
      credentials: "include",
    });
    const data = await res.json();
    if (p === 1) {
      setPosts(data.posts);
    } else {
      setPosts((prev) => [...prev, ...data.posts]);
    }
    setHasMore(data.hasMore);
    setPage(p);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <button
            onClick={() => loadFeed(1)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {posts.length === 0 && !loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Follow some organizations to see their posts here.</p>
            <Link
              href="/orgs"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              Browse Organizations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/orgs/${post.organization.slug}/posts/${post.id}`}
                className="block bg-card rounded-xl shadow-sm border p-6 hover:border-primary transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                    {post.organization.logo ? <img src={fixUploadUrl(post.organization.logo)} alt="Logo" className="w-full h-full object-cover" /> : post.organization.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{post.organization.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.author.name} &middot; {formatRelativeDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{post.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {post.content}
                </p>
              </Link>
            ))}

            {hasMore && (
              <div className="text-center py-4 col-span-full">
                <button
                  onClick={() => loadFeed(page + 1)}
                  disabled={loading}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-muted"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}