"use client";

import { Navbar } from "@/components/Navbar";
import { ExamStoreProvider } from "@/lib/store";
import { usePathname } from "next/navigation"; // Keep for now, might be useful for other layout logic
import { PostHogProvider } from "@/components/PostHogProvider";
import { Toaster } from "sonner";
import QueryProvider from "@/components/QueryClientProvider";
import { OrganizationTracker } from "@/components/OrganizationTracker";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const pathname = usePathname() // No longer needed for Navbar logic
  // const isLandingPage = pathname === '/' // No longer needed for Navbar logic

  return (
    <PostHogProvider>
      <QueryProvider>
        <ExamStoreProvider>
          <OrganizationTracker />
          <div className="relative min-h-screen">
            <Navbar />
            <div className="pt-16">
              {children}
            </div>
          </div>
          <Toaster position="top-right" />
        </ExamStoreProvider>
      </QueryProvider>
    </PostHogProvider>
  );
}
