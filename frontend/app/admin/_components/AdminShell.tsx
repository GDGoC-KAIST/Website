"use client";

import {ReactNode} from "react";
import CardDense from "@/components/ui/cards/CardDense";
import {BRAND} from "@/lib/brand";

interface AdminShellProps<T extends string> {
  adminId: string;
  onAdminIdChange: (value: string) => void;
  activeTab: T;
  tabs: {id: T; label: string}[];
  onTabChange: (tab: T) => void;
  feedback: {type: "success" | "error"; message: string} | null;
  children: ReactNode;
}

export default function AdminShell<T extends string>({
  adminId,
  onAdminIdChange,
  activeTab,
  tabs,
  onTabChange,
  feedback,
  children,
}: AdminShellProps<T>) {
  return (
    <div className="space-y-8 px-6 py-12 lg:px-10">
      <header className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          {BRAND.shortName} Admin Panel
        </p>
        <h1 className="text-4xl font-semibold text-gray-900">Manage Seminars & Projects</h1>
        <p className="text-gray-600">
          Paste your admin ID from Firestore to authorize protected actions.
        </p>
      </header>

      <CardDense pad="lg">
        <label className="block text-sm font-semibold text-gray-700">
          Admin Secret ID
          <input
            type="text"
            value={adminId}
            onChange={(event) => onAdminIdChange(event.target.value)}
            placeholder="e.g. FIREBASE_USER_ID"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
        </label>
      </CardDense>

      <div className="flex flex-wrap gap-3 md:gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`min-w-[120px] rounded-2xl px-5 py-3 text-sm font-semibold text-center transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {children}
    </div>
  );
}
