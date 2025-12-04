"use client";

import Image from "next/image";
import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import RecruitForm from "@/app/components/recruit/RecruitForm";
import {
  RecruitApplyInput,
  RecruitConfig,
  applyRecruit,
  getRecruitConfig,
} from "@/lib/recruitApi";
import {useLanguage} from "@/lib/i18n-context";
import {BRAND} from "@/lib/brand";

const CONTACT_EMAIL = "xistoh162108@kaist.ac.kr";
const CONTACT_LEAD = "25-26 Lead 박지민";

const TEXT = {
  en: {
    eyebrow: "Recruiting",
    title: `Join ${BRAND.shortName}`,
    subtitle: "Learn, build, and connect on campus",
    heroTags: [
      "Activities in Korean",
      "Weekly Tuesday 21:00 (in-person)",
      "#GDGOnCampus",
    ],
    loading: "Loading recruiting info...",
    closedFallback: "Recruiting is currently closed.",
    error: "Failed to submit. Please try again.",
    applyTitle: "Submit your application",
    applyDescription:
      "Complete the application form on this page during the recruiting window. All fields marked with * are required.",
    contactPrompt:
      "Need help? Use the contact tab on this page or email our lead directly:",
    contactEmailLabel: `${CONTACT_EMAIL} (${CONTACT_LEAD})`,
  },
  ko: {
    eyebrow: "리크루팅",
    title: `${BRAND.shortName} 지원하기`,
    subtitle: "캠퍼스에서 배우고 만들고 연결해요",
    heroTags: ["한국어로 활동 진행", "매주 화요일 21:00 정기모임(대면)", "#GDGOnCampus"],
    loading: "리크루팅 정보를 불러오는 중입니다...",
    closedFallback: "현재 리크루팅이 닫혀 있습니다.",
    error: "제출에 실패했습니다. 다시 시도해주세요.",
    applyTitle: "지원서 작성",
    applyDescription: "모집 기간 안에 아래 지원서 폼을 작성하고 제출해 주세요.",
    contactPrompt: "문의는 이 페이지의 문의하기 탭 또는 아래 이메일로 연락해 주세요:",
    contactEmailLabel: `${CONTACT_EMAIL} (${CONTACT_LEAD})`,
  },
};

export default function RecruitApplicationPage() {
  const router = useRouter();
  const {language} = useLanguage();
  const copy = TEXT[language];
  const heroSubtitle = TEXT[language].subtitle;
  const heroEyebrow = TEXT.en.eyebrow;
  const heroTitle = TEXT.en.title;
  const heroTags = TEXT.en.heroTags;
  const [config, setConfig] = useState<RecruitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getRecruitConfig()
      .then((data) => {
        if (mounted) setConfig(data);
      })
      .catch(() => {
        // ignore fetch errors for now
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isClosed = useMemo(() => {
    if (!config) return false;
    if (!config.isOpen) return true;
    const now = Date.now();
    const openAt = new Date(config.openAt).getTime();
    const closeAt = new Date(config.closeAt).getTime();
    return !(now >= openAt && now <= closeAt);
  }, [config]);

  const handleSubmit = async (input: RecruitApplyInput) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await applyRecruit(input);
      router.push("/recruit/success");
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.error;
      setSubmitError(message || copy.error);
    } finally {
      setSubmitting(false);
    }
  };

  const semesterLabel = config?.semester ? ` · ${config.semester}` : "";

  const applicationWindow = useMemo(() => {
    if (!config?.openAt || !config?.closeAt) return "";
    const formatDate = (date: string) => {
      const d = new Date(date);
      const month = `${d.getMonth() + 1}`.padStart(2, "0");
      const day = `${d.getDate()}`.padStart(2, "0");
      return `${d.getFullYear()}.${month}.${day}`;
    };
    return `${formatDate(config.openAt)} ~ ${formatDate(config.closeAt)}`;
  }, [config]);

  return (
    <>
      <section className="relative isolate w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/GDG-Campus-Digital-BevyHeader-2560x650-Blue.png"
            alt="GDG on Campus hero graphic"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/40" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-white lg:px-10 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70 drop-shadow">
            {heroEyebrow}
            {semesterLabel}
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white drop-shadow">{heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-[13px] font-mono text-white/80">
            {heroTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/40 px-4 py-1.5 backdrop-blur"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-4xl space-y-12 text-gray-900">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-primary">GDG on Campus KAIST 25-26 (FW)</p>
            <h2 className="text-3xl font-bold">신입 멤버 모집</h2>
            <p className="text-base leading-relaxed text-gray-700">
              GDG on Campus KAIST에서 25-26(FW) 시즌을 함께할 신입 멤버를 모집합니다. 대학원생도
              지원 가능하며, 모든 활동은 한국어로 진행됩니다.
            </p>
          </div>

          <article className="space-y-16">
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">1) GDG on Campus KAIST는 어떤 커뮤니티인가요?</h3>
              <p className="leading-relaxed text-gray-700">
                GDG on Campus KAIST(Google Developer Group on Campus KAIST)는 구글 기술과 다양한 IT
                분야에 관심 있는 학생들이 모여 함께 학습하고 성장하는 대학생 개발자 커뮤니티입니다.
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>전 세계 100+개국, 1,800+개 대학에서 운영 중</li>
                <li>한국에서는 37개 대학이 참여 중</li>
                <li>KAIST는 2022년 가을 학기부터 활동 시작</li>
              </ul>
              <p className="leading-relaxed text-gray-700">
                공동 학습과 실천을 통한 성장을 목표로 아래 활동을 진행합니다.
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>스터디 &amp; 세미나: 최신 기술 학습 및 토론</li>
                <li>사이드 프로젝트: 관심사 기반 자율 프로젝트 진행</li>
                <li>해커톤 &amp; 챌린지: 국내/글로벌 GDG 네트워크 연계 도전 기회</li>
                <li>글로벌 네트워킹: 전 세계 GDG on Campus 커뮤니티와 교류</li>
              </ul>
              <p className="text-sm text-gray-500">
                참고: KAIST는 기존 GDSC KAIST로 활동하다가 최근 GDG on Campus KAIST로 개편되었습니다.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">2) 지난 시즌에는 무엇을 했나요? (Past Activities)</h3>
              <p className="leading-relaxed text-gray-700">지난 1년간은 다음 활동을 진행했습니다.</p>
              <ul className="list-disc space-y-3 pl-6 text-gray-700">
                <li>
                  스터디: AI 논문, React, 백엔드 등 자율 스터디
                  <span className="block text-xs text-gray-500">예시: AI 논문 스터디(노션 링크)</span>
                </li>
                <li>세미나: Google 엔지니어 초청 세미나, NVIDIA &amp; KRAFTON 세션, Git 강의 등</li>
                <li>네트워킹: 선후배 교류 모임(술자리, MT, 딸기파티 등)</li>
                <li>
                  프로젝트: 솔루션 챌린지 아이디어 발표, 자유 프로젝트 진행
                  <span className="block text-xs text-gray-500">
                    참고: 2025 APAC Solution Challenge(노션 링크)
                  </span>
                </li>
                <li>해커톤 기획/주최: 2024 여름 해커톤 SPARKLING-THON 주최</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">3) 지원 자격 / 이런 분을 기다립니다</h3>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>개발자 커뮤니티에서 이벤트를 기획·운영해보고 싶은 분</li>
                <li>KAIST 내 개발자 선후배들과 교류하고 싶은 분</li>
                <li>타 학교 GDG on Campus 구성원들과 폭넓게 교류하고 싶은 분</li>
                <li>혼자가 아니라 함께 공부하고 성장하고 싶은 분</li>
              </ul>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                ❗ 정기모임은 매주 화요일 21:00 (대면) 입니다. 시험기간 및 공휴일은 별도 안내합니다.
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">4) 리크루팅 절차</h3>
              <ol className="space-y-3 border-l-2 border-dashed border-gray-200 pl-6 text-gray-700">
                <li>
                  <p className="font-semibold">1. 지원서 작성 (8.19 ~ 9.6)</p>
                  <p className="text-sm">관심 분야와 간단한 자기소개를 작성해 주세요.</p>
                </li>
                <li>
                  <p className="font-semibold">2. 서류 심사 (~9.7)</p>
                  <p className="text-sm">제출 내용을 바탕으로 적합성을 검토합니다.</p>
                </li>
                <li>
                  <p className="font-semibold">3. 온라인 인터뷰 (~9.8)</p>
                  <p className="text-sm">서로 궁금한 점을 묻고 알아가는 시간입니다.</p>
                </li>
                <li>
                  <p className="font-semibold">4. 합격 및 온보딩 (9.9)</p>
                  <p className="text-sm">최종 합격 후 GDG on Campus KAIST 멤버로 함께 시작합니다.</p>
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold">5) 문의</h3>
              <p className="text-sm text-gray-700">
                문의 사항이 있으시면 지원하기 페이지 내 ‘문의하기’ 탭을 사용하거나 아래 이메일로 연락해
                주세요.
              </p>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                <p>• {CONTACT_EMAIL}</p>
                <p>• 25-26 Lead: 박지민</p>
              </div>
            </section>
          </article>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <p className="text-center text-gray-500">{copy.loading}</p>
          ) : (
            <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                    Apply
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {copy.applyTitle}
                    {applicationWindow ? ` (${applicationWindow})` : ""}
                  </h2>
                </div>
                <p className="text-sm text-gray-600">{copy.applyDescription}</p>
                <p className="text-sm text-gray-500">
                  {copy.contactPrompt}{" "}
                  <span className="font-semibold text-gray-900">{copy.contactEmailLabel}</span>
                </p>
              </div>
              {isClosed && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  {config?.messageWhenClosed || copy.closedFallback}
                </div>
              )}
              {submitError && (
                <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              <RecruitForm
                mode="create"
                onSubmit={handleSubmit}
                isSubmitting={submitting}
                isClosed={isClosed}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
