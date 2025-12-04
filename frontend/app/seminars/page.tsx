import {api} from "@/lib/api";
import {BRAND} from "@/lib/brand";
import SeminarListClient, {SeminarWithImage} from "./SeminarListClient";
import type {BilingualIntro} from "../component/PageIntro";
import PageHero from "@/components/layout/PageHero";
import {SEMINARS_HERO_IMAGES} from "@/lib/heroImages";

const seminarsHeroCopy = {
  en: {
    description:
      "From invited Google engineers to internal workshops, explore our latest conversations on tech and community.",
  },
  ko: {
    description:
      "Google 엔지니어 초청 강연부터 내부 워크숍까지, 기술과 커뮤니티 이야기를 함께 나눕니다.",
  },
};

const seminarsIntro: BilingualIntro = {
  ko: {
    eyebrow: "세미나",
    title: `${BRAND.shortName}의 세미나와 세션`,
    description:
      "Google 엔지니어 초청 강연부터 내부 워크숍까지, 기술과 커뮤니티 이야기를 함께 나눕니다.",
  },
  en: {
    eyebrow: "Seminars",
    title: `Learnings from ${BRAND.shortName}`,
    description:
      "From invited Google engineers to internal workshops, explore our latest conversations on tech and community.",
  },
};

export default async function SeminarsPage() {
  const seminarsRes = await api
    .getSeminars({limit: 20, offset: 0})
    .catch(() => ({data: []}));
  const seminars = seminarsRes.data || [];

  const imageResults = await Promise.allSettled(
    seminars.map(async (seminar) => {
      if (!seminar.coverImageId) {
        return {seminarId: seminar.id, coverImageUrl: undefined};
      }
      try {
        const image = await api.getImage(seminar.coverImageId);
        return {seminarId: seminar.id, coverImageUrl: image.url};
      } catch {
        return {seminarId: seminar.id, coverImageUrl: undefined};
      }
    })
  );

  const coverImageMap = new Map<string, string | undefined>();
  imageResults.forEach((result) => {
    if (result.status === "fulfilled") {
      coverImageMap.set(result.value.seminarId, result.value.coverImageUrl);
    }
  });

  const seminarsWithImages: SeminarWithImage[] = seminars.map((seminar) => ({
    ...seminar,
    coverImageUrl: coverImageMap.get(seminar.id),
  }));

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        images={SEMINARS_HERO_IMAGES}
        eyebrow="SEMINARS"
        title={`Learnings from ${BRAND.shortName}`}
        description="From invited Google engineers to internal workshops, explore our latest conversations on tech and community."
        variant="compact"
        sticker={{name: "slider", size: 160}}
        bilingualCopy={seminarsHeroCopy}
      />

      <div className="mx-auto max-w-6xl px-6">
        <SeminarListClient initialSeminars={seminarsWithImages} />
      </div>
    </div>
  );
}
