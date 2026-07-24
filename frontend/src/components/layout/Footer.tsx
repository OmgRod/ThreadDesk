import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
            Privacy Policy
          </Link>
        </div>
        <div className="mt-8 md:order-1 md:mt-0 flex items-center justify-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ThreadDesk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
