"use client";

import { Check, Loader2, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: "£0",
    description: "Perfect for getting started",
    features: ["1 organisation", "50 posts/month", "Basic integrations"],
    variantId: null,
  },
  {
    name: "Starter",
    price: "£5",
    description: "For growing communities",
    features: ["3 organisations", "1,000 posts/month", "Email sending", "Analytics"],
    variantId: process.env.NEXT_PUBLIC_LS_STARTER_VARIANT_ID,
  },
  {
    name: "Pro",
    price: "£15",
    description: "Power tools for professionals",
    features: ["Unlimited organisations", "Automation", "API access", "Team members"],
    variantId: process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID,
  },
  {
    name: "Business",
    price: "£50+",
    description: "Enterprise-grade features",
    features: ["Priority support", "Custom integrations", "Higher limits"],
    variantId: process.env.NEXT_PUBLIC_LS_BUSINESS_VARIANT_ID,
  },
];

export default function PricingPage() {
  const { user, loading: authLoading, checkAuth } = useAuth();
  const [loading, setLoading] = useState(null as string | null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setCurrentPlan(user.plan);
    }
  }, [user]);

  const handleContact = () => {
    window.location.href = "mailto:rod@omgrod.me";
  };

  const handleUpgrade = async (variantId: string | null, planName: string) => {
    // For now, prevent all upgrades
    toast.info("Upgrades are currently unavailable. Please contact us for custom plans.");
    return;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Temporarily Limited Plan Availability</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We are currently only offering the Free plan while we finalize our payment system.
            If you need higher limits or a custom plan, please contact us!
          </p>
          <Button onClick={handleContact}>
            <Mail className="mr-2 h-4 w-4" />
            Contact Us via Email
          </Button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that's right for your organization
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.name.toLowerCase();
            return (
              <div
                key={plan.name}
                className={`flex flex-col p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border ${
                  isCurrentPlan
                    ? "border-primary-500 ring-2 ring-primary-500"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    {plan.price !== "Free" && plan.name !== "Business" && (
                      <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-8 space-y-4 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-primary-600 shrink-0 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "ghost"}
                  disabled={true}
                  onClick={() => handleUpgrade(plan.variantId || null, plan.name)}
                >
                  {isCurrentPlan ? "Current Plan" : "Unavailable"}
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
