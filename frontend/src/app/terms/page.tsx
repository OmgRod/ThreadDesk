import { Navbar } from "@/components/layout/Navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12 prose dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>Last updated: July 24, 2026</p>
        <p>By accessing or using ThreadDesk, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

        <h2>1. Service Description</h2>
        <p>ThreadDesk provides a platform for omnichannel communication, allowing you to create posts and distribute them across various integrated platforms.</p>

        <h2>2. User Responsibilities</h2>
        <p>You are responsible for the content you post and distribute using ThreadDesk. You must ensure that your content and actions comply with the terms of service of any third-party platforms you connect (e.g., Discord, Slack, Email providers).</p>

        <h2>3. Acceptable Use</h2>
        <p>You agree not to use the service for:</p>
        <ul>
          <li>Any illegal activities.</li>
          <li>Distributing spam, malware, or harmful content.</li>
          <li>Impersonating others or misrepresenting your organization.</li>
        </ul>

        <h2>4. Account Security</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. We are not liable for any unauthorized access resulting from your failure to secure your account.</p>

        <h2>5. Limitation of Liability</h2>
        <p>ThreadDesk is provided "as is" without warranties of any kind. We are not responsible for any direct, indirect, or consequential damages resulting from your use of the service or its integrations.</p>

        <h2>6. Termination</h2>
        <p>We reserve the right to terminate or suspend your account for violations of these terms.</p>
      </main>
    </div>
  );
}
