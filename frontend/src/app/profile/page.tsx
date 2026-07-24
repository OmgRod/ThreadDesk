"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Loader2, Camera, Globe, Lock, Unlock, Upload } from "lucide-react";
import { fixUploadUrl } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [followedOrgs, setFollowedOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Edit state
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [emailPublic, setEmailPublic] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const meData = await meRes.json();
      if (!meData.id) {
        router.push("/auth");
        return;
      }
      setUser(meData);
      setBio(meData.bio || "");
      setWebsite(meData.website || "");
      setIsPublic(meData.isPublic ?? true);
      setEmailPublic(meData.emailPublic ?? false);
      setAvatar(meData.avatar || "");

      const orgsRes = await fetch("/api/followers/my", { credentials: "include" });
      setFollowedOrgs(await orgsRes.json());
      setLoading(false);
    }
    load();
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setAvatar(data.url);
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, website, isPublic, emailPublic, avatar, name: user.name }),
      credentials: "include",
    });

    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setEditing(false);
      toast.success("Profile updated!");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info */}
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold">Your Profile</h1>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-background bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground shadow-sm">
                {avatar ? (
                  <img src={fixUploadUrl(avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)
                )}
                {editing && (
                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                    <span className="text-xs mt-1">Change</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex-grow space-y-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Name</p>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-medium">Email</p>
                <p className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </p>
              </div>

              {editing ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      placeholder="Tell us a bit about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={website} 
                        onChange={(e) => setWebsite(e.target.value)} 
                        placeholder="https://yourwebsite.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t mt-4">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Privacy Settings
                    </label>
                    {/* Profile Visibility */}
                    <div className="flex items-center gap-4 mt-2 bg-muted/50 p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {isPublic ? <Unlock className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-amber-500" />}
                          {isPublic ? "Public Profile" : "Private Profile"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isPublic 
                            ? "Anyone can view your profile." 
                            : "Only you can see your profile."}
                        </p>
                      </div>
                      <Button 
                        variant={isPublic ? "outline" : "default"}
                        onClick={() => setIsPublic(!isPublic)}
                      >
                        {isPublic ? "Make Private" : "Make Public"}
                      </Button>
                    </div>
                    {/* Email Visibility */}
                    <div className="flex items-center gap-4 mt-2 bg-muted/50 p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {emailPublic ? "Email Visible" : "Email Hidden"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {emailPublic 
                            ? "Your email address is shown on your public profile." 
                            : "Your email is private and won't be shown anywhere."}
                        </p>
                      </div>
                      <Button 
                        variant={emailPublic ? "default" : "outline"}
                        onClick={() => setEmailPublic(!emailPublic)}
                      >
                        {emailPublic ? "Hide Email" : "Show Email"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {bio && (
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Bio</p>
                      <p className="mt-1">{bio}</p>
                    </div>
                  )}
                  {website && (
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Website</p>
                      <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-1 text-primary hover:underline">
                        <Globe className="h-4 w-4" />
                        {website}
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    {isPublic ? (
                      <><Unlock className="h-4 w-4" /> Profile is public</>
                    ) : (
                      <><Lock className="h-4 w-4" /> Profile is private</>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Followed Organizations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Organizations You Follow</h2>
          {followedOrgs.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You aren't following any organizations yet.</p>
              <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                Browse organizations
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {followedOrgs.map((org: any) => (
                <Link
                  key={org.id}
                  href={`/orgs/${org.slug}`}
                  className="bg-card rounded-xl border p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold overflow-hidden">
                    {org.logo ? <img src={fixUploadUrl(org.logo)} alt="Logo" className="w-full h-full object-cover" /> : org.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{org.name}</p>
                    {org.verified && (
                      <span className="text-xs text-primary">Verified</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
