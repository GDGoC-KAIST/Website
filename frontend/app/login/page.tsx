"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FaGithub } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // GitHub OAuth App으로 리다이렉트
      // TODO: 환경 변수에서 GitHub OAuth Client ID 가져오기
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/login/callback`;
      
      if (!clientId) {
        throw new Error("GitHub OAuth Client ID가 설정되지 않았습니다.");
      }

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`;
      
      window.location.href = githubAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">로그인</h1>
          <p className="mt-2 text-gray-600">
            GitHub 계정으로 로그인하여 GDG on Campus KAIST에 참여하세요
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full h-12 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              로그인 중...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <FaGithub className="h-5 w-5" />
              GitHub로 로그인
            </span>
          )}
        </Button>

        <p className="text-center text-xs text-gray-500">
          로그인 시{" "}
          <a href="/terms" className="text-primary hover:underline">
            이용약관
          </a>
          과{" "}
          <a href="/privacy" className="text-primary hover:underline">
            개인정보처리방침
          </a>
          에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

