// FILE: app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { IconDiamond } from "@/components/icons";
import { ACCENT_GRADIENT } from "@/lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0B0618] flex items-center justify-center px-4 py-10">
      {/* Purple ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-48 -right-32 w-[560px] h-[560px] rounded-full bg-fuchsia-600/15 blur-[130px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-[22px] bg-violet-500/40 blur-xl" />

            <div
              className="relative w-16 h-16 rounded-[22px] flex items-center justify-center text-white border border-white/15 shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #C026D3 100%)",
              }}
            >
              <IconDiamond width={29} height={29} />
            </div>
          </div>

          <h1 className="text-[30px] font-black tracking-tight text-white">
            Welcome back
          </h1>

          <p className="text-[14px] text-violet-200/70 mt-2">
            Sign in to continue to{" "}
            <span className="text-violet-200 font-semibold">
              ScholarAI
            </span>
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-[30px] border border-violet-300/15 bg-white/[0.07] backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] p-7 sm:p-9">
          <div className="mb-7">
            <h2 className="text-[18px] font-bold text-white">
              Sign in
            </h2>

            <p className="text-[12.5px] text-violet-200/55 mt-1">
              Enter your account details below.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-[12.5px] font-semibold text-violet-100/80 mb-2 block"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 bg-black/20 border border-violet-200/15 rounded-2xl px-4 text-[14px] text-white placeholder:text-violet-100/30 outline-none transition-all focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/10 focus:bg-black/25"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-[12.5px] font-semibold text-violet-100/80 mb-2 block"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-12 bg-black/20 border border-violet-200/15 rounded-2xl px-4 text-[14px] text-white placeholder:text-violet-100/30 outline-none transition-all focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/10 focus:bg-black/25"
              />
            </div>

            {error && (
              <p className="text-[12.5px] text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3.5 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-12 w-full rounded-2xl text-white text-[14px] font-bold shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(124,58,237,0.45)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background:
                  "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #C026D3 100%)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-violet-200/10" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/35">
              ScholarAI
            </span>

            <div className="h-px flex-1 bg-violet-200/10" />
          </div>

          <p className="text-[13px] text-violet-100/55 text-center">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-violet-300 hover:text-white transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-[10.5px] text-violet-200/25 mt-6">
          Secure access to your personal AI workspace
        </p>
      </div>
    </main>
  );
}