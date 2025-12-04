"use client";

import {FormEvent, useState} from "react";
import {useSearchParams} from "next/navigation";
import {resetPasswordConfirm} from "@/lib/recruitApi";
import {useLanguage} from "@/lib/i18n-context";

const TEXT = {
  en: {
    title: "Set a New Password",
    missingToken: "Reset token missing. Please use the link from your email.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    submit: "Update password",
    submitting: "Updating...",
    passwordMismatch: "Passwords do not match",
    success: "Password updated. You can now sign in with your new password.",
    error: "Failed to reset password. Please try again.",
  },
  ko: {
    title: "새 비밀번호 설정",
    missingToken: "재설정 토큰이 없습니다. 이메일에 포함된 링크를 사용해주세요.",
    newPassword: "새 비밀번호",
    confirmPassword: "비밀번호 확인",
    submit: "비밀번호 변경",
    submitting: "변경 중...",
    passwordMismatch: "비밀번호가 일치하지 않습니다",
    success: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.",
    error: "비밀번호 재설정에 실패했습니다. 다시 시도해주세요.",
  },
};

export default function RecruitResetConfirmPage() {
  const {language} = useLanguage();
  const copy = TEXT[language];

  const params = useSearchParams();
  const token = params?.get("token") || "";
  const [message, setMessage] = useState<{text: string; tone: "success" | "error"} | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));
    if (password !== confirm) {
      setMessage({text: copy.passwordMismatch, tone: "error"});
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await resetPasswordConfirm(token, password);
      setMessage({text: copy.success, tone: "success"});
      event.currentTarget.reset();
    } catch (error) {
      setMessage({text: copy.error, tone: "error"});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{copy.title}</h1>
        {!token && (
          <p className="text-sm text-red-500">{copy.missingToken}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-sm font-medium text-gray-700">
            {copy.newPassword}
            <input
              type="password"
              name="password"
              required
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {copy.confirmPassword}
            <input
              type="password"
              name="confirm"
              required
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || !token}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow disabled:bg-gray-300"
          >
            {submitting ? copy.submitting : copy.submit}
          </button>
        </form>
        {message && (
          <p className={`text-sm ${message.tone === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
