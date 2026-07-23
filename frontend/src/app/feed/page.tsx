"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, RefreshCw } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

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
    const res = await fetch(`/api/feed?page=${p}&limit=20`, {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            <span className="font-bold">ThreadDesk</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <button
            onClick={() => loadFeed(1)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {posts.length === 0 && !loading ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Follow some organizations to see their posts here.</p>
            <Link
              href="/orgs"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Browse Organizations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/orgs/${post.organization.slug}/posts/${post.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                    {post.organization.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{post.organization.name}</p>
                    <p className="text-xs text-gray-500">
                      {post.author.name} &middot; {formatRelativeDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                  {post.content}
                </p>
              </Link>
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => loadFeed(page + 1)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
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