const FULL_NAME = "Google Developer Group on Campus KAIST";
const SHORT_NAME = "GDG on Campus KAIST";
const HASHTAG = "#GDGOnCampus";
const CONTACT_EMAIL = "gdgoc.kaist@gmail.com";

export const BRAND = {
  fullName: FULL_NAME,
  shortName: SHORT_NAME,
  hashtag: HASHTAG,
  contactEmail: CONTACT_EMAIL,
  siteTitleSuffix: FULL_NAME,
  ogTitleDefault: FULL_NAME,
  ogDescriptionDefault:
    "Google Developer Group on Campus KAIST is a student-led developer community that learns, builds, and shares new technology together.",
};

export type BrandNameVariant = "full" | "short";

export function getDisplayName(variant: BrandNameVariant = "full"): string {
  return variant === "short" ? SHORT_NAME : FULL_NAME;
}

export function formatPageTitle(title?: string): string {
  if (!title) return FULL_NAME;
  return `${title} | ${FULL_NAME}`;
}

