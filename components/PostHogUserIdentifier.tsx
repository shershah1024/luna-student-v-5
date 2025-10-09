"use client";

import { useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogUserIdentifier() {
  const { user, isLoaded } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (isLoaded && user) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        createdAt: user.createdAt,
      });
    } else if (isLoaded && !user) {
      posthog.reset();
    }
  }, [user, isLoaded, posthog]);

  return null;
}