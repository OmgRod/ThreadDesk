import { Navbar } from "@/components/layout/Navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert">
          <p>Last updated: July 24, 2026</p>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Collection</h2>
          <p>We collect information you provide directly to us.</p>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. Data Usage</h2>
          <p>We use your information to provide and improve the service.</p>
        </div>
      </div>
    </div>
  );
}
