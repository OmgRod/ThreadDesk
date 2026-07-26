import { Navbar } from "@/components/layout/Navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12 prose dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: July 26, 2026</p>
        <p>ThreadDesk ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose information about you when you use our services.</p>
        
        <h2>1. Data We Collect</h2>
        <p>We only collect data necessary to provide our services, including:</p>
        <ul>
          <li><strong>Account Information:</strong> Email addresses and passwords (hashed) for authentication.</li>
          <li><strong>Profile Information:</strong> User names, avatars, and bios that you choose to provide.</li>
          <li><strong>Organization Data:</strong> Information required to manage organizations and teams.</li>
          <li><strong>Content:</strong> Posts, comments, and other content you create and distribute using our platform.</li>
          <li><strong>Analytics Data:</strong> Usage data including events triggered, metadata, user agents, and IP addresses, collected to improve our service performance and features.</li>
        </ul>

        <h2>2. How We Use Data</h2>
        <p>We use your data solely for the following purposes:</p>
        <ul>
          <li>To provide, maintain, and improve our services.</li>
          <li>To facilitate communication and automation across integrated platforms.</li>
          <li>To secure your account and comply with legal obligations.</li>
          <li>To analyze service usage trends and performance.</li>
        </ul>

        <h2>3. Data Protection and Sharing</h2>
        <p>We do not sell, rent, or trade your personal data. We do not use your data for advertising or profiling. We only share information with third-party services you explicitly connect (e.g., Discord or Slack) to perform actions you have requested.</p>

        <h2>4. Your Rights</h2>
        <p>You have the right to access, update, or delete your account information at any time through your dashboard settings.</p>

        <h2>5. Changes to This Policy</h2>
        <p>We may update this policy periodically. Your continued use of the service constitutes acceptance of these changes.</p>
      </main>
    </div>
  );
}
