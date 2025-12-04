"use client";

import {useLanguage} from "@/lib/i18n-context";
import {BRAND} from "@/lib/brand";
import PageHero from "@/components/layout/PageHero";
import {ABOUT_HERO_IMAGES} from "@/lib/heroImages";

const PROGRAM_NAME = "Google Developer Groups on Campus (GDG on Campus)";
const aboutContent = {
  ko: [
    {
      title: "Google for Developers",
      description:
        "Google for Developers는 개발자들이 Google 기술을 기반으로 학습하고(build), 성장하고, 커뮤니티와 연결될 수 있도록 제품/학습/이벤트/커뮤니티 프로그램 등을 제공하는 개발자 플랫폼입니다.",
      accent: "Google 기술 선순환의 출발점",
    },
    {
      title: "Google Developer Groups (GDG)",
      description:
        "Google Developer Groups(GDG)는 개발자와 기술인들이 모여 Google 기술과 전문가를 중심으로 연결하고, 배우고, 함께 성장하는 커뮤니티입니다. 지식 공유, 협업, 네트워킹을 통해 지역/주제 기반의 기술 커뮤니티를 만들어갑니다.",
      accent: "지역/주제 기반의 글로벌 커뮤니티 네트워크",
    },
    {
      title: PROGRAM_NAME,
      description:
        "Google Developer Groups on Campus(GDG on Campus)는 전 세계 대학 구성원을 대상으로, 실습 중심 경험을 통해 기술 역량을 쌓고 커리어 기반을 다질 수 있게 돕는 캠퍼스 커뮤니티입니다.",
      accent: "학생을 위한 캠퍼스 개발 생태계",
    },
    {
      title: "Google Developer Experts (GDE)",
      description:
        "Google Developer Experts(GDE)는 Google 기술 분야에서 전문성을 가지고, 발표/멘토링/콘텐츠 등으로 커뮤니티에 기여하는 사람들을 위한 글로벌 프로그램입니다.",
      accent: "글로벌 기술 리더를 연결하는 프로그램",
    },
    {
      title: BRAND.shortName,
      description:
        `${BRAND.shortName}는 KAIST 캠퍼스에서 개발과 기술에 관심 있는 사람들이 함께 모여 학습(세션/스터디), 실습(워크숍/핸즈온), 그리고 커뮤니티 활동(네트워킹/지식 공유)을 만들어가는 학생 중심 커뮤니티입니다.`,
      accent: "KAIST에서 배우고, 만들고, 연결하는 방법",
    },
  ],
  en: [
    {
      title: "Google for Developers",
      description:
        "Google for Developers is the developer platform that helps people learn, build, grow, and connect through Google technologies. It provides product resources, learning paths, events, and community programs.",
      accent: "Starting point of the Google tech ecosystem",
    },
    {
      title: "Google Developer Groups (GDG)",
      description:
        "Google Developer Groups (GDG) connect developers and technologists who want to learn and grow around Google technologies. GDGs create local and topic-based communities through knowledge sharing, collaboration, and networking.",
      accent: "A global network of local technical communities",
    },
    {
      title: PROGRAM_NAME,
      description:
        "Google Developer Groups on Campus (GDG on Campus) support university and college members worldwide, helping them build practical skills and career readiness through hands-on experience.",
      accent: "Hands-on developer communities on campus",
    },
    {
      title: "Google Developer Experts (GDE)",
      description:
        "Google Developer Experts (GDE) is a global program for professionals who demonstrate expertise in Google technologies and contribute to the community through talks, mentoring, and content.",
      accent: "Recognizing global technical leaders",
    },
    {
      title: BRAND.shortName,
      description:
        `${BRAND.shortName} is a student-driven community where people interested in development and technology at KAIST come together to learn (sessions/studies), practice (workshops/hands-on), and build a network through community activities.`,
      accent: "How we learn, build, and connect at KAIST",
    },
  ],
};

export default function AboutRender() {
  const {language} = useLanguage();
  const items = aboutContent[language];

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        images={ABOUT_HERO_IMAGES}
        eyebrow="ABOUT"
        title={
          language === "ko"
            ? "Google 기술 커뮤니티의 흐름"
            : "Understanding Google's Developer Ecosystem"
        }
        description={
          language === "ko"
            ? "Google for Developers → GDG → GDG on Campus → GDG on Campus KAIST까지 이어지는 흐름과 GDE 프로그램을 한눈에 정리했습니다."
            : "Here's how Google for Developers, GDG, GDG on Campus, GDG on Campus KAIST, and GDE connect within the ecosystem."
        }
        variant="compact"
        sticker={{name: "brackets", size: 155}}
      />

      <section className="mx-auto max-w-4xl text-center space-y-4 px-6">
        <p className="text-sm uppercase tracking-widest text-primary">
          {language === "ko"
            ? "Google Developer Ecosystem"
            : "Google Developer Ecosystem"}
        </p>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-6">
        {items.map((item, index) => (
          <article
            key={item.title}
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-gray-400">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                {item.title}
              </h2>
              <p className="text-sm font-semibold text-primary">{item.accent}</p>
            </div>
            <p className="mt-4 text-gray-700">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
