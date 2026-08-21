// FILE: components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, AuthUser } from "@/lib/auth";

interface AuthGuardProps {
  children: (user: AuthUser) => React.ReactNode;
}

/**
 * Wrap any protected page's content with this. Usage:
 *
 *   <AuthGuard>
 *     {(user) => <YourExistingPageJSX />}
 *   </AuthGuard>
 *
 * Renders nothing (a blank/loading state) while the session check is in
 * flight, redirects to /login if there's no valid token, and otherwise
 * renders children with the confirmed user — so pages that need the
 * logged-in user's email (e.g. Sidebar) get it without a second fetch.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((u) => {
      if (cancelled) return;
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
        setChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked || !user) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-white">
        <span className="w-6 h-6 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children(user)}</>;
}