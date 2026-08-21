// FILE: app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { IconDiamond } from "@/components/icons";

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
    <main className="min-h-screen bg-[#F8F7FB] flex">

      {/* =========================================================
          LEFT PRODUCT PANEL
      ========================================================= */}
      <section className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#171027] text-white">

        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
          <div className="absolute bottom-[-180px] right-[-100px] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />

          <div className="absolute top-[18%] right-[12%] w-24 h-24 rounded-full border border-white/5" />
          <div className="absolute top-[20%] right-[15%] w-12 h-12 rounded-full border border-violet-400/10" />

          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between px-12 xl:px-16 py-10">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-950/50">
              <IconDiamond
                width={19}
                height={19}
                className="text-white"
              />
            </div>

            <span className="text-[18px] font-bold tracking-tight">
              ScholarAI
            </span>
          </div>

          {/* Main content */}
          <div className="max-w-[570px] -mt-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/15 bg-violet-500/[0.08] text-violet-200 text-[11px] font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              AI-powered study workspace
            </div>

            <h2 className="text-[42px] xl:text-[50px] leading-[1.05] font-bold tracking-[-0.035em] max-w-[520px]">
              Your knowledge.
              <br />
              <span className="text-violet-300">
                One intelligent workspace.
              </span>
            </h2>

            <p className="mt-6 text-[15px] leading-7 text-white/50 max-w-[480px]">
              Upload your study material, ask questions about your documents,
              and turn scattered information into something you can actually
              understand.
            </p>

            {/* Product preview */}
            <div className="mt-10 w-full max-w-[500px]">

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/20">

                {/* Window header */}
                <div className="h-10 px-4 flex items-center border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>

                  <div className="mx-auto text-[9px] text-white/25 font-medium">
                    scholarai.app
                  </div>
                </div>

                {/* App mockup */}
                <div className="flex h-[240px]">

                  {/* Mini sidebar */}
                  <div className="w-[115px] border-r border-white/[0.06] p-3">

                    <div className="h-6 w-20 rounded-md bg-violet-500/15 mb-5" />

                    <div className="space-y-2">
                      <div className="h-7 rounded-lg bg-violet-500/15" />
                      <div className="h-7 rounded-lg bg-white/[0.025]" />
                      <div className="h-7 rounded-lg bg-white/[0.025]" />
                    </div>

                    <div className="mt-7 h-2.5 w-14 rounded bg-white/[0.06]" />
                    <div className="mt-2 h-2.5 w-20 rounded bg-white/[0.04]" />
                    <div className="mt-2 h-2.5 w-16 rounded bg-white/[0.04]" />
                  </div>

                  {/* Chat */}
                  <div className="flex-1 p-5">

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-3 w-24 rounded bg-white/10" />
                        <div className="mt-2 h-2 w-16 rounded bg-white/[0.04]" />
                      </div>

                      <div className="h-7 w-7 rounded-lg bg-violet-500/10" />
                    </div>

                    <div className="mt-7 space-y-4">

                      <div className="flex justify-end">
                        <div className="w-[145px] h-8 rounded-xl bg-violet-500/20" />
                      </div>

                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 shrink-0" />

                        <div className="space-y-2 pt-1">
                          <div className="h-2 w-44 rounded bg-white/10" />
                          <div className="h-2 w-36 rounded bg-white/[0.06]" />
                          <div className="h-2 w-40 rounded bg-white/[0.06]" />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="w-[110px] h-8 rounded-xl bg-white/[0.05]" />
                      </div>

                    </div>

                    <div className="mt-6 h-9 rounded-xl border border-white/[0.06] bg-white/[0.025] flex items-center px-3">
                      <div className="h-2 w-24 rounded bg-white/[0.05]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product points */}
              <div className="flex items-center gap-6 mt-5 text-[11px] text-white/35">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  Document-aware answers
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  Personal knowledge base
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10.5px] text-white/20">
            © {new Date().getFullYear()} ScholarAI
          </p>
        </div>
      </section>

      {/* =========================================================
          RIGHT LOGIN PANEL
      ========================================================= */}
      <section className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">

        <div className="w-full max-w-[390px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center mb-10">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center mr-3">
              <IconDiamond
                width={18}
                height={18}
                className="text-white"
              />
            </div>

            <span className="text-[18px] font-bold text-gray-900">
              ScholarAI
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">

            <h1 className="text-[29px] font-bold tracking-[-0.025em] text-gray-900">
              Welcome back
            </h1>

            <p className="mt-2 text-[14px] text-gray-500">
              Sign in to access your workspace.
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[12.5px] font-semibold text-gray-700 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="
                  w-full
                  h-12
                  px-4
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  text-[14px]
                  text-gray-900
                  placeholder:text-gray-400
                  outline-none
                  transition-all
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-[12.5px] font-semibold text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-[11.5px] font-medium text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="
                  w-full
                  h-12
                  px-4
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  text-[14px]
                  text-gray-900
                  placeholder:text-gray-400
                  outline-none
                  transition-all
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[12.5px] leading-5 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-12
                rounded-xl
                bg-violet-600
                hover:bg-violet-700
                active:bg-violet-800
                text-white
                text-[13.5px]
                font-semibold
                shadow-sm
                transition-all
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
              New to ScholarAI?
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Signup */}
          <Link
            href="/signup"
            className="
              flex
              items-center
              justify-center
              w-full
              h-12
              rounded-xl
              border
              border-gray-300
              bg-white
              text-[13.5px]
              font-semibold
              text-gray-700
              hover:border-violet-300
              hover:text-violet-700
              hover:bg-violet-50/40
              transition-all
            "
          >
            Create an account
          </Link>

          {/* Small footer */}
          <p className="text-center text-[11px] text-gray-400 mt-8">
            By continuing, you agree to ScholarAI's terms and privacy policy.
          </p>
        </div>
      </section>
    </main>
  );
}