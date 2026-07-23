"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Settings2, Save, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");

  useEffect(() => {
    async function loadOrgs() {
      if (authLoading) return;
      if (!user) {
        router.push("/auth");
        return;
      }
      const res = await fetch("/api/orgs/user/mine", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id.toString());
        }
      }
      setLoading(false);
    }
    loadOrgs();
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadOrgDetails() {
      if (!selectedOrgId) return;
      
      const selectedOrg = orgs.find(o => o.id.toString() === selectedOrgId);
      if (!selectedOrg) return;

      const res = await fetch(`/api/orgs/${selectedOrg.slug}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setDescription(data.description || "");
        setWebsite(data.website || "");
        setLogo(data.logo || "");
        setBanner(data.banner || "");
      }
    }
    loadOrgDetails();
  }, [selectedOrgId, orgs]);

  const handleUpload = async (file: File, type: "logo" | "banner") => {
    const setUploading = type === "logo" ? setUploadingLogo : setUploadingBanner;
    const setValue = type === "logo" ? setLogo : setBanner;

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
        setValue(data.url);
        toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully! Don't forget to save.`);
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

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/orgs/${selectedOrgId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, website, logo, banner }),
      credentials: "include",
    });

    if (res.ok) {
      toast.success("Organization settings updated!");
      setOrgs(orgs.map(o => o.id.toString() === selectedOrgId ? { ...o, name } : o));
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update settings");
    }
    setSaving(false);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedOrg = orgs.find((o) => o.id.toString() === selectedOrgId);
  const canEdit = selectedOrg?.role === "owner" || selectedOrg?.role === "admin";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        {orgs.length > 0 && (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background text-sm font-medium w-full sm:w-64"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-12 bg-background border rounded-xl text-muted-foreground">
          <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>You don't belong to any organizations yet.</p>
        </div>
      ) : (
        <div className="bg-background rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-6 pb-4 border-b">Organization Profile</h2>
          
          {!canEdit && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg text-sm">
              You do not have permission to edit settings for this organization.
            </div>
          )}

          <form onSubmit={saveSettings} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Banner Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Banner</label>
                <div className="relative w-full h-40 bg-muted border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center group">
                  {banner ? (
                    <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-sm">Upload Banner</span>
                    </div>
                  )}
                  {canEdit && (
                    <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {uploadingBanner ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                      <span className="text-xs mt-1">Click to Upload</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "banner")} 
                        disabled={uploadingBanner} 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="relative w-32 h-32 bg-muted border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center group">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center text-center p-2">
                        <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                        <span className="text-xs leading-tight">Upload Logo</span>
                      </div>
                    )}
                    {canEdit && (
                      <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        <span className="text-[10px] mt-1">Upload</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")} 
                          disabled={uploadingLogo} 
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-4 py-2 border rounded-lg bg-background disabled:opacity-50 disabled:bg-muted"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={!canEdit}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border rounded-lg bg-background disabled:opacity-50 disabled:bg-muted"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2 border rounded-lg bg-background disabled:opacity-50 disabled:bg-muted"
                rows={3}
              />
            </div>
            
            {canEdit && (
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

