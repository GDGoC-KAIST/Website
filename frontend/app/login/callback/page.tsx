"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage("GitHub 로그인이 취소되었습니다.");
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("인증 코드를 받지 못했습니다.");
      return;
    }

    // code를 accessToken으로 교환
    handleOAuthCallback(code);
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    try {
      if (!BASE_URL) {
        throw new Error("API Base URL이 설정되지 않았습니다. .env 파일에 NEXT_PUBLIC_API_BASE_URL을 설정해주세요.");
      }
      
      const response = await fetch(`${BASE_URL}/loginWithGitHub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code, 
          redirectUri: `${window.location.origin}/login/callback` 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: 로그인에 실패했습니다.`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // 사용자 정보를 localStorage에 저장
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // 로그인 상태 변경 이벤트 발생 (NavBar에서 감지)
        window.dispatchEvent(new Event("login"));
      }

      // 홈으로 바로 리다이렉트
      router.push("/");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg font-medium">로그인 처리 중...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg font-medium">로그인 처리 중...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-red-600">{message}</p>
            <Button onClick={() => router.push("/login")} className="mt-4">
              다시 시도
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">로딩 중...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

