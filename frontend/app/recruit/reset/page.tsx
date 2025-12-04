"use client";

import {FormEvent, useState} from "react";
import {resetPasswordRequest} from "@/lib/recruitApi";
import {useLanguage} from "@/lib/i18n-context";

const TEXT = {
  en: {
    title: "Reset Password",
    description:
      "Enter your KAIST email. If it matches an application, we'll send a temporary password.",
    emailLabel: "KAIST Email",
    button: "Send reset email",
    submitting: "Sending...",
    success: "If the email exists, a temporary password has been sent.",
    error: "Failed to submit",
  },
  ko: {
    title: "비밀번호 재설정",
    description: "KAIST 이메일을 입력하면 해당 계정으로 임시 비밀번호가 전송됩니다.",
    emailLabel: "KAIST 이메일",
    button: "임시 비밀번호 보내기",
    submitting: "전송 중...",
    success: "계정이 존재한다면 임시 비밀번호가 전송되었습니다.",
    error: "전송에 실패했습니다",
  },
};

export default function RecruitResetPage() {
  const {language} = useLanguage();
  const copy = TEXT[language];
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const kaistEmail = String(formData.get("kaistEmail"));
    setSubmitting(true);
    setStatus(null);
    try {
      await resetPasswordRequest(kaistEmail);
      setStatus(copy.success);
      event.currentTarget.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.error;
      setStatus(message || copy.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{copy.title}</h1>
        <p className="text-sm text-gray-500">{copy.description}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-sm font-medium text-gray-700">
            {copy.emailLabel}
            <input
              type="email"
              name="kaistEmail"
              required
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow disabled:bg-gray-300"
          >
            {submitting ? copy.submitting : copy.button}
          </button>
        </form>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </div>
    </section>
  );
}
