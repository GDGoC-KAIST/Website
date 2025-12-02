"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import MarkdownEditor from "@/app/component/MarkdownEditor";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // 프로젝트 로드
      api.getProject(projectId)
        .then((data) => {
          // 작성자 확인
          if (data.createdBy !== userData.id) {
            setError("이 프로젝트를 수정할 권한이 없습니다.");
            return;
          }
          setProject(data);
          setFormData({
            title: data.title || "",
            summary: data.summary || "",
            description: data.description || "",
            semester: data.semester || "",
            status: data.status || "ongoing",
            githubUrl: data.githubUrl || "",
            demoUrl: data.demoUrl || "",
            thumbnailUrl: data.thumbnailUrl || "",
            teamMembers: data.teamMembers?.join(", ") || "",
            techStack: data.techStack?.join(", ") || "",
            contentMd: data.contentMd || "",
          });
        })
        .catch((err) => {
          setError(err.message || "프로젝트를 불러오는데 실패했습니다.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      router.push("/login");
    }
  }, [projectId, router]);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    semester: "",
    status: "ongoing" as "ongoing" | "completed",
    githubUrl: "",
    demoUrl: "",
    thumbnailUrl: "",
    teamMembers: "",
    techStack: "",
    contentMd: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      const teamMembersArray = formData.teamMembers
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
      const techStackArray = formData.techStack
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await api.updateProject(projectId, {
        userId: user.id,
        title: formData.title,
        summary: formData.summary,
        description: formData.description,
        semester: formData.semester,
        status: formData.status,
        githubUrl: formData.githubUrl || undefined,
        demoUrl: formData.demoUrl || undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        teamMembers: teamMembersArray,
        techStack: techStackArray,
        contentMd: formData.contentMd,
      });

      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로젝트 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      await api.deleteProject(projectId, user.id);
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로젝트 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="px-6 py-12 lg:px-10 max-w-6xl mx-auto">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
        <Button onClick={() => router.back()} className="mt-4">
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 pt-32 pb-12 lg:px-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">프로젝트 수정</h1>

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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              상태 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as "ongoing" | "completed"})}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ongoing">진행 중</option>
              <option value="completed">완료</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            팀 멤버 <span className="text-red-500">*</span> (쉼표로 구분)
          </label>
          <input
            type="text"
            value={formData.teamMembers}
            onChange={(e) => setFormData({...formData, teamMembers: e.target.value})}
            required
            placeholder="홍길동, 김철수, 이영희"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            기술 스택 <span className="text-red-500">*</span> (쉼표로 구분)
          </label>
          <input
            type="text"
            value={formData.techStack}
            onChange={(e) => setFormData({...formData, techStack: e.target.value})}
            required
            placeholder="React, TypeScript, Firebase"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              GitHub URL
            </label>
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
              placeholder="https://github.com/owner/repo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Demo URL
            </label>
            <input
              type="url"
              value={formData.demoUrl}
              onChange={(e) => setFormData({...formData, demoUrl: e.target.value})}
              placeholder="https://example.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            마크다운 콘텐츠
          </label>
          <MarkdownEditor
            value={formData.contentMd}
            onChange={(value) => setFormData({...formData, contentMd: value})}
            placeholder="프로젝트에 대한 상세한 설명을 마크다운 형식으로 작성하세요..."
          />
        </div>

        <div className="flex gap-4 justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving}
          >
            삭제
          </Button>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

