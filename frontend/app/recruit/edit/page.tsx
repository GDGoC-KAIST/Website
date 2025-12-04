"use client";

import {FormEvent, useEffect, useState} from "react";
import RecruitForm from "@/app/components/recruit/RecruitForm";
import {
  RecruitApiError,
  RecruitApplication,
  RecruitUpdateInput,
  getMyApplication,
  loginRecruit,
  updateRecruit,
} from "@/lib/recruitApi";
import {useLanguage} from "@/lib/i18n-context";

const STORAGE_KEY = "gdgocRecruitToken";

const TEXT = {
  en: {
    title: "View or Edit Your Application",
    loginEmail: "KAIST Email",
    loginPassword: "Password",
    loginButton: "Sign In",
    loggingIn: "Signing in...",
    forgot: "Forgot your password?",
    reset: "Reset it here.",
    locked: "Account locked until {{time}}",
    invalid: "Invalid credentials",
    fetchError: "Failed to load application",
    loginError: "Login failed",
    updateError: "Update failed",
    sessionExpired: "Session expired. Please sign in again.",
  },
  ko: {
    title: "지원서 확인/수정",
    loginEmail: "KAIST 이메일",
    loginPassword: "비밀번호",
    loginButton: "로그인",
    loggingIn: "로그인 중...",
    forgot: "비밀번호를 잊으셨나요?",
    reset: "여기에서 재설정",
    locked: "{{time}} 까지 계정이 잠겨 있습니다",
    invalid: "이메일 또는 비밀번호가 올바르지 않습니다",
    fetchError: "지원서를 불러오지 못했습니다",
    loginError: "로그인에 실패했습니다",
    updateError: "저장에 실패했습니다",
    sessionExpired: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  },
};

function formatLockedTime(raw: string, language: string): string {
  if (!raw) return "";
  const timestamp = Date.parse(raw);
  if (!Number.isNaN(timestamp)) {
    const locale = language === "ko" ? "ko-KR" : "en-US";
    return new Date(timestamp).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  return raw;
}

export default function RecruitEditPage() {
  const {language} = useLanguage();
  const copy = TEXT[language];

  const [step, setStep] = useState<"login" | "edit">("login");
  const [token, setToken] = useState<string | null>(null);
  const [application, setApplication] = useState<RecruitApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedInfo, setLockedInfo] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (savedToken) {
      setToken(savedToken);
      fetchApplication(savedToken);
    }
  }, []);

  const fetchApplication = async (sessionToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyApplication(sessionToken);
      setApplication(data);
      setStep("edit");
    } catch (err) {
      if (err instanceof RecruitApiError && err.status === 401) {
        setError(copy.sessionExpired);
      } else {
        setError(copy.fetchError);
      }
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setStep("login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const kaistEmail = String(formData.get("kaistEmail"));
    const password = String(formData.get("password"));

    setError(null);
    setLockedInfo(null);
    setLoading(true);
    try {
      const result = await loginRecruit({kaistEmail, password});
      if (!result.success) {
        if (result.lockedUntil) {
          const formatted = formatLockedTime(result.lockedUntil, language);
          setLockedInfo(copy.locked.replace("{{time}}", formatted));
        } else {
          setError(copy.invalid);
        }
        return;
      }
      if (result.token) {
        localStorage.setItem(STORAGE_KEY, result.token);
        setToken(result.token);
        await fetchApplication(result.token);
      }
    } catch (err) {
      if (err instanceof RecruitApiError && err.status === 401) {
        setError(copy.invalid);
      } else {
        setError(copy.loginError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (input: RecruitUpdateInput) => {
    if (!token) return;
    setUpdating(true);
    setError(null);
    try {
      await updateRecruit(token, input);
    } catch (err) {
      if (err instanceof RecruitApiError && err.status === 401) {
        setError(copy.sessionExpired);
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setStep("login");
      } else {
        setError(copy.updateError);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">{copy.title}</h1>
        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {lockedInfo && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {lockedInfo}
          </div>
        )}

        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              {copy.loginEmail}
              <input
                type="email"
                name="kaistEmail"
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {copy.loginPassword}
              <input
                type="password"
                name="password"
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow disabled:bg-gray-300"
            >
              {loading ? copy.loggingIn : copy.loginButton}
            </button>
            <p className="text-center text-sm text-gray-500">
              {copy.forgot}
              {" "}
              <a href="/recruit/reset" className="text-primary underline">{copy.reset}</a>
            </p>
          </form>
        )}

        {step === "edit" && application && (
          <RecruitForm
            mode="edit"
            initialData={application}
            onSubmit={handleUpdate}
            isSubmitting={updating}
            isClosed={false}
          />
        )}
      </div>
    </section>
  );
}
