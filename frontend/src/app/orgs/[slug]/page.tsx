"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Globe, Users, Calendar, Heart, ExternalLink, Loader2, Rss } from "lucide-react";
import { formatDate, fixUploadUrl } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

export default function OrgPage() {
  const { slug } = useParams();
  const [org, setOrg] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const orgRes = await fetch(`/api/orgs/${slug}`);
      const orgData = await orgRes.json();
      setOrg(orgData);

      if (orgData.id) {
        const postsRes = await fetch(`/api/posts/org/${orgData.id}`);
        const postsData = await postsRes.json();
        setPosts(postsData);

        const followRes = await fetch(`/api/followers/${orgData.id}/check`, {
          credentials: "include",
        });
        const followData = await followRes.json();
        setFollowing(followData.following);
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  const toggleFollow = async () => {
    const res = await fetch(`/api/followers/${org.id}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setFollowing(data.following);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold">Organization not found</h2>
          <p className="text-muted-foreground mt-2">The organization "{slug}" doesn't exist.</p>
          <Button className="mt-4" onClick={() => window.location.href = "/"}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-48 bg-gradient-to-r from-primary/80 to-primary relative">
            {org.banner && (
              <img src={fixUploadUrl(org.banner)} alt="" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Org Info */}
          <div className="px-6 sm:px-10 pb-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-6 -mt-16">
              <div className="w-32 h-32 bg-card rounded-xl shadow-md flex items-center justify-center text-4xl font-bold text-primary border-4 border-card overflow-hidden shrink-0">
                {org.logo ? (
                  <img src={fixUploadUrl(org.logo)} alt={org.name} className="w-full h-full object-cover" />
                ) : (
                  org.name.charAt(0)
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{org.name}</h1>
                  {org.verified && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {org.followerCount} followers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(org.createdAt)}
                  </span>
                </div>
              </div>
              <Button
                onClick={toggleFollow}
                variant={following ? "secondary" : "default"}
                className="w-full sm:w-auto rounded-full font-semibold px-8"
              >
                {following ? "Following" : "Follow"}
              </Button>
              <a 
                href={`/api/rss/${slug}`} 
                target="_blank" 
                className="flex items-center justify-center w-10 h-10 rounded-full border border-input bg-background hover:bg-muted transition-colors"
                title="RSS Feed"
              >
                <Rss className="h-5 w-5 text-muted-foreground" />
              </a>
            </div>

            {/* Description */}
            {org.description && (
              <div className="mb-6">
                <p className="text-lg leading-relaxed">{org.description}</p>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline mt-3 font-medium"
                  >
                    <Globe className="h-4 w-4" />
                    {org.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Posts) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold border-b pb-2">Latest Updates</h2>
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No posts yet</p>
                <p className="text-sm mt-1">Check back later for updates from {org.name}.</p>
              </div>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/orgs/${slug}/posts/${post.id}`}
                  className="block bg-card text-card-foreground rounded-2xl shadow-sm border p-6 hover:border-primary/50 transition-colors group"
                >
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground font-medium pt-4 border-t">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold overflow-hidden">
                        {post.author?.avatar ? <img src={fixUploadUrl(post.author.avatar)} alt="" /> : post.author?.name?.charAt(0)}
                      </div>
                      {post.author.name}
                    </span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Sidebar (Public Members) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-2">Team</h2>
            <div className="bg-card text-card-foreground rounded-2xl shadow-sm border p-4 space-y-3">
              {org.publicMembers && org.publicMembers.length > 0 ? (
                org.publicMembers.map((member: any) => (
                  <Link 
                    key={member.id} 
                    href={`/users/${member.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 overflow-hidden">
                      {member.avatar ? <img src={fixUploadUrl(member.avatar)} alt="" className="w-full h-full object-cover" /> : member.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize font-medium">{member.role}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No public members.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
