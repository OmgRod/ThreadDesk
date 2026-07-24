import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, Globe, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { fixUploadUrl } from "@/lib/utils";
import { OrgCard } from "@/components/orgs/OrgCard";

async function getUser(id: string) {
  try {
    const res = await fetch(`http://127.0.0.1:${process.env.PORT || 3002}/api/users/${id}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border overflow-hidden">
          {/* Header Banner Area */}
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5"></div>
          
          <div className="px-6 sm:px-10 pb-10">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-card bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground shadow-sm bg-white shrink-0">
                {user.avatar ? (
                  <img src={fixUploadUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {user.email && (
                  <p className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {user.email}
                  </p>
                )}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-2 text-primary hover:underline text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              
                <div className="pb-2 w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full" onClick={() => window.location.href = `/messages?userId=${user.id}`}>
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mb-10">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</h2>
                <p className="text-lg leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Organizations */}
            {user.organizations && user.organizations.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Organizations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {user.organizations.map((org: any) => (
                    <OrgCard key={org.id} org={org} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
