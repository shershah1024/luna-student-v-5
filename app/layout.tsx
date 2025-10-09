import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import ClientLayout from "./client-layout";

export function generateMetadata(): Metadata {
  return {
    title: "Luna - AI Teaching Assistant for Language Educators",
    description:
      "AI-powered teaching assistant helping language educators create engaging lessons, assignments, and provide personalized student support",
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_URL || "https://luna.thesmartlanguage.com",
    ),
    openGraph: {
      title: "Luna - AI Teaching Assistant for Language Educators",
      description:
        "AI-powered teaching assistant helping language educators create engaging lessons, assignments, and provide personalized student support",
      images: [
        {
          url: "/og-image.png?v=2",
          width: 1200,
          height: 630,
          alt: "Luna - AI Teaching Assistant for Language Educators",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Luna - AI Teaching Assistant for Language Educators",
      description:
        "AI-powered teaching assistant helping language educators create engaging lessons, assignments, and provide personalized student support",
      images: ["/og-image.png?v=2"],
    },
    other: {},
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/lessons"
      afterSignUpUrl="/lessons"
    >
      <html lang="en">
        <body className={`min-h-screen bg-[#f5f2e8]`}>
          <ClientLayout>{children}</ClientLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}
