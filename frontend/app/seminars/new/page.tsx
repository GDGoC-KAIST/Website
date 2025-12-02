"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import MarkdownEditor from "@/app/component/MarkdownEditor";

export default function NewSeminarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로그인 상태 확인
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      router.push("/login");
    }
  }, [router]);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    type: "invited" as "invited" | "internal",
    semester: "",
    date: "",
    speaker: "",
    affiliation: "",
    location: "",
    contentMd: "",
    attachmentUrls: "",
    coverImageId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      const attachmentUrlsArray = formData.attachmentUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const seminar = await api.createSeminar({
        userId: user.id,
        title: formData.title,
        summary: formData.summary,
        type: formData.type,
        semester: formData.semester,
        date: formData.date || undefined,
        speaker: formData.speaker || undefined,
        affiliation: formData.affiliation || undefined,
        location: formData.location || undefined,
        contentMd: formData.contentMd,
        attachmentUrls: attachmentUrlsArray.length > 0 ? attachmentUrlsArray : undefined,
        coverImageId: formData.coverImageId || undefined,
      });

      if (!seminar || !seminar.id) {
        throw new Error("세미나 생성은 성공했지만 ID를 받지 못했습니다.");
      }

      // 세미나 상세 페이지로 리다이렉트
      window.location.href = `/seminars/${seminar.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "세미나 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-32 pb-12 lg:px-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">새 세미나 작성</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            한줄 요약 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.summary}
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              타입 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as "invited" | "internal"})}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="invited">초청 세미나</option>
              <option value="internal">내부 세미나</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              학기 <span className="text-red-500">*</span> (예: 2024-2)
            </label>
            <input
              type="text"
              value={formData.semester}
              onChange={(e) => setFormData({...formData, semester: e.target.value})}
              required
              pattern="\d{4}-[12]"
              placeholder="2024-2"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              날짜 (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              장소
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              발표자
            </label>
            <input
              type="text"
              value={formData.speaker}
              onChange={(e) => setFormData({...formData, speaker: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              소속
            </label>
            <input
              type="text"
              value={formData.affiliation}
              onChange={(e) => setFormData({...formData, affiliation: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            마크다운 콘텐츠 <span className="text-red-500">*</span>
          </label>
          <MarkdownEditor
            value={formData.contentMd}
            onChange={(value) => setFormData({...formData, contentMd: value})}
            placeholder="세미나에 대한 상세한 내용을 마크다운 형식으로 작성하세요..."
          />
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "저장 중..." : "세미나 생성"}
          </Button>
        </div>
      </form>
    </div>
  );
}

