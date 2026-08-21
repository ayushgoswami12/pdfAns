// FILE: app/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";
import { IconDiamond } from "@/components/icons";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError("Please tell us your name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await signup(email.trim(), password, name.trim());
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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

        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />

          <div className="absolute bottom-[-180px] right-[-100px] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />

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

          {/* Main */}
          <div className="max-w-[570px] -mt-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/15 bg-violet-500/[0.08] text-violet-200 text-[11px] font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Build your personal knowledge base
            </div>

            <h2 className="text-[42px] xl:text-[50px] leading-[1.05] font-bold tracking-[-0.035em] max-w-[540px]">
              Turn your documents
              <br />
              <span className="text-violet-300">
                into something useful.
              </span>
            </h2>

            <p className="mt-6 text-[15px] leading-7 text-white/50 max-w-[480px]">
              Create your ScholarAI workspace, upload your materials, and
              start asking questions across your own knowledge base.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-[500px]">

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                  <IconDiamond
                    width={15}
                    height={15}
                    className="text-violet-300"
                  />
                </div>

                <p className="text-[12px] font-semibold text-white/80">
                  Ask your documents
                </p>

                <p className="mt-1.5 text-[10.5px] leading-5 text-white/30">
                  Get answers grounded in the material you upload.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                  <div className="w-3.5 h-3.5 rounded-md border border-violet-300/60" />
                </div>

                <p className="text-[12px] font-semibold text-white/80">
                  Keep everything together
                </p>

                <p className="mt-1.5 text-[10.5px] leading-5 text-white/30">
                  Your sources and conversations stay inside one workspace.
                </p>
              </div>

              <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4 flex items-center gap-4">

                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <div className="flex gap-1 items-end">
                    <span className="w-1 h-2 rounded-full bg-violet-300/50" />
                    <span className="w-1 h-3.5 rounded-full bg-violet-300/70" />
                    <span className="w-1 h-5 rounded-full bg-violet-300" />
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-white/80">
                    Learn faster
                  </p>

                  <p className="mt-1 text-[10.5px] text-white/30">
                    Spend less time searching through notes and more time
                    understanding them.
                  </p>
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
          RIGHT SIGNUP PANEL
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
              Create your workspace
            </h1>

            <p className="mt-2 text-[14px] text-gray-500">
              Set up your ScholarAI account to get started.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-[12.5px] font-semibold text-gray-700 mb-2"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
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

              <p className="text-[11px] text-gray-400 mt-1.5">
                Used to personalize your ScholarAI workspace.
              </p>
            </div>

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
              <label
                htmlFor="password"
                className="block text-[12.5px] font-semibold text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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

              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`h-1 flex-1 rounded-full ${
                    password.length === 0
                      ? "bg-gray-200"
                      : password.length < 6
                      ? "bg-amber-300"
                      : password.length < 10
                      ? "bg-violet-300"
                      : "bg-violet-600"
                  }`}
                />

                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {password.length === 0
                    ? "Minimum 6 characters"
                    : password.length < 6
                    ? "Too short"
                    : password.length < 10
                    ? "Good"
                    : "Strong"}
                </span>
              </div>
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
              {loading ? "Creating workspace..." : "Create account"}
            </button>
          </form>

          {/* Login */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
              Already have an account?
            </span>

            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Link
            href="/login"
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
            Sign in instead
          </Link>

          {/* Terms */}
          <p className="text-center text-[11px] text-gray-400 mt-8 leading-5">
            By creating an account, you agree to ScholarAI&apos;s{" "}
            <span className="text-gray-500">Terms of Service</span> and{" "}
            <span className="text-gray-500">Privacy Policy</span>.
          </p>
        </div>
      </section>
    </main>
  );
}