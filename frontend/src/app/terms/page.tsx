import { Navbar } from "@/components/layout/Navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert">
          <p>Last updated: July 24, 2026</p>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using ThreadDesk, you agree to be bound by these Terms.</p>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of Service</h2>
          <p>You agree to use the service only for lawful purposes.</p>
        </div>
      </div>
    </div>
  );
}
