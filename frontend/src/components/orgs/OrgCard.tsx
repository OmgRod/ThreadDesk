import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { OptimizedImage } from "../ui/optimized-image";

interface OrgCardProps {
  org: {
    id: string | number;
    slug: string;
    name: string;
    logo?: string;
    description?: string;
    role?: string;
    verified?: boolean;
  };
}

export function OrgCard({ org }: OrgCardProps) {
  return (
    <Link
      href={`/orgs/${org.slug}`}
      className="group flex flex-col p-5 bg-background border rounded-2xl hover:border-primary transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden relative">
          {org.logo ? (
            <OptimizedImage src={org.logo} alt={org.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg truncate flex items-center gap-1">
            {org.name}
            {org.verified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
          </h2>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{org.description || "No description provided."}</p>
      {org.role && <p className="text-xs text-muted-foreground mt-2 capitalize">{org.role}</p>}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
        View Organization <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
