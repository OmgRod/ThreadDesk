"use client";

import Link from "next/link";
import { MessageSquare, Bell, Building2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Omnichannel Communication
            <span className="text-primary-600"> Platform</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
            Publish official updates, manage discussions, and distribute messages across multiple channels.
            ThreadDesk helps organizations communicate effectively with their audience.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/auth"}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/feed"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Browse Feed
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <Building2 className="h-10 w-10 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Organization Profiles</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create branded organization pages with logos, banners, and custom content.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <MessageSquare className="h-10 w-10 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Post & Discuss</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Publish updates with rich text, manage discussions with nested comments.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <Bell className="h-10 w-10 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Automations</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automate distribution with webhooks, email, and Discord integrations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ThreadDesk. All rights reserved.
        </div>
      </footer>
    </div>
  );
}