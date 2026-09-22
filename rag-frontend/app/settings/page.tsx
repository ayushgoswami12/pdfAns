"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AuthGuard from "@/components/AuthGuard";
import { logout } from "@/lib/auth";
import { IconSettings } from "@/components/icons";


export default function SettingsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  return (
    <AuthGuard>
      {(user) => (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 antialiased">
          <Sidebar
            active="settings"
            userEmail={user.email}
            onLogout={() => {
              logout();
              router.push("/login");
            }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 flex flex-col min-w-0 bg-gray-50/40">
            <TopBar
              mode="global"
              activeTab="settings"
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />

            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <IconSettings className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Settings
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      Manage your ScholarAI account.
                    </p>
                  </div>
                </div>

                <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[14px] font-bold text-gray-900">
                      Account
                    </h2>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Email
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[14px] text-gray-700">
                        {user.email}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Password
                      </label>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[14px] tracking-[0.25em] text-gray-500">
                          ••••••••••
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPasswordInfo((value) => !value)}
                          className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-colors"
                        >
                          {showPasswordInfo ? "Hide" : "Why hidden?"}
                        </button>
                      </div>

                      {showPasswordInfo && (
                        <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
                          ScholarAI stores passwords as secure hashes rather than readable passwords, so the original password cannot be displayed. If you do not remember it, use the account password recovery flow when one is added.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="mt-5 rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-red-100">
                    <h2 className="text-[14px] font-bold text-gray-900">
                      Session
                    </h2>
                  </div>

                  <div className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-800">
                        Log out of ScholarAI
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        You will need to sign in again to access your account.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-[13px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
