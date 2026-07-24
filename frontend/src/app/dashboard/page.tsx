"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit3, Eye, Clock, Globe, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrgCard } from "@/components/orgs/OrgCard";
import { Integrations } from "@/lib/integrations";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [postOrgId, setPostOrgId] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [overrideAutomation, setOverrideAutomation] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (authLoading) return;
      if (!user) {
        router.push("/auth");
        return;
      }

      const [orgsRes, postsRes] = await Promise.all([
        fetch("/api/orgs/user/mine", { credentials: "include" }),
        fetch("/api/posts/dashboard/all", { credentials: "include" }),
      ]);
      setOrgs(await orgsRes.json());
      setPosts(await postsRes.json());
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName, slug: orgSlug, description: orgDesc }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Organization created!");
      setShowCreateOrg(false);
      setOrgName("");
      setOrgSlug("");
      setOrgDesc("");
      const orgsRes = await fetch("/api/orgs/user/mine", { credentials: "include" });
      setOrgs(await orgsRes.json());
    } else {
      toast.error(data.error);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: parseInt(postOrgId),
        title: postTitle,
        content: postContent,
        published: true,
        overrideAutomation,
        selectedPlatforms: overrideAutomation ? selectedPlatforms : [],
      }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Post published!");
      setShowCreatePost(false);
      setPostTitle("");
      setPostContent("");
      setOverrideAutomation(false);
      setSelectedPlatforms([]);
      const postsRes = await fetch("/api/posts/dashboard/all", { credentials: "include" });
      setPosts(await postsRes.json());
    } else {
      toast.error(data.error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-transparent">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Organizations */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Organizations</h2>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New Organization
            </button>
          </div>

          <Modal isOpen={showCreateOrg} onClose={() => setShowCreateOrg(false)} title="Create Organization">
            <form onSubmit={createOrg} className="space-y-4">
              <Input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Organization name"
                required
              />
              <Input
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="slug (e.g., my-org)"
                required
              />
              <Textarea
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Modal>

          <div className="grid md:grid-cols-3 gap-4">
            {orgs.map((org: any) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        </section>

        {/* Posts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Posts</h2>
            {orgs.length > 0 && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
              >
                <Edit3 className="h-4 w-4" />
                New Post
              </button>
            )}
          </div>

          <Modal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} title="Create Post">
            <form onSubmit={createPost} className="space-y-4">
              <select
                value={postOrgId}
                onChange={(e) => setPostOrgId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                required
              >
                <option value="">Select organization</option>
                {orgs.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <Input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Post title"
                required
              />
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Post content (Markdown supported)"
                rows={4}
                required
              />
              
              <div className="space-y-2 border p-3 rounded-lg">
                <label className="flex items-center gap-2 font-medium text-sm">
                  <input type="checkbox" checked={overrideAutomation} onChange={(e) => setOverrideAutomation(e.target.checked)} />
                  Override Automation
                </label>
                {overrideAutomation && (
                  <div className="space-y-1 mt-2 text-sm">
                    {Object.values(Integrations).map(platform => (
                      <label key={platform.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPlatforms([...selectedPlatforms, platform.id]);
                            else setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                          }}
                        />
                        {platform.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreatePost(false)}>Cancel</Button>
                <Button type="submit">Publish</Button>
              </div>
            </form>
          </Modal>

          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No posts yet. Create your first post!</p>
              </div>
            ) : (
              posts.map((post: any) => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/orgs/${post.organization.slug}/posts/${post.id}`} className="font-medium hover:text-primary-600">
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{post.organization.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          post.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                    <Globe className={`h-4 w-4 ${post.visibility === "public" ? "text-green-500" : "text-gray-400"}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}