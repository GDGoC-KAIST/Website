"use client";

import {useLanguage, Language} from "@/lib/i18n-context";

interface IntroContent {
  eyebrow?: string;
  title: string;
  description: string;
}

export type BilingualIntro = Record<Language, IntroContent>;

interface PageIntroProps {
  copy: BilingualIntro;
  align?: "center" | "left";
  className?: string;
}

export default function PageIntro({
  copy,
  align = "center",
  className = "",
}: PageIntroProps) {
  const {language} = useLanguage();
  const content = copy[language];
  const alignmentClasses =
    align === "center"
      ? "mx-auto max-w-3xl text-center"
      : "max-w-3xl text-left";

  return (
    <div className={`${alignmentClasses} space-y-4 ${className}`}>
      {content.eyebrow && (
        <p className="text-sm uppercase tracking-wide text-gray-500">
          {content.eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-semibold text-gray-900">
        {content.title}
      </h1>
      <p className="text-gray-600">{content.description}</p>
    </div>
  );
}
