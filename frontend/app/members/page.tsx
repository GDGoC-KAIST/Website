import {api} from "@/lib/api";
import {BRAND} from "@/lib/brand";
import MemberListClient from "../components/members/MemberListClient";
import type {BilingualIntro} from "../component/PageIntro";
import PageHero from "@/components/layout/PageHero";
import {MEMBERS_HERO_IMAGES} from "@/lib/heroImages";

const membersHeroCopy = {
  en: {
    description:
      "Designers, engineers, and organizers collaborate to keep this chapter thriving.",
  },
  ko: {
    description:
      `디자이너, 엔지니어, 커뮤니티 오거나이저가 함께 협업하며 ${BRAND.shortName}를 성장시키고 있습니다.`,
  },
};

const membersIntro: BilingualIntro = {
  ko: {
    eyebrow: "멤버",
    title: `${BRAND.shortName}를 만드는 사람들`,
    description:
      `디자이너, 엔지니어, 커뮤니티 오거나이저가 함께 협업하며 ${BRAND.shortName}를 성장시키고 있습니다.`,
  },
  en: {
    eyebrow: "Members",
    title: `People of ${BRAND.shortName}`,
    description:
      "Designers, engineers, and organizers collaborate to keep this chapter thriving.",
  },
};

export default async function MembersPage() {
  const membersRes = await api.getMembers({limit: 50}).catch(() => ({data: []}));
  const members = membersRes.data || [];

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        images={MEMBERS_HERO_IMAGES}
        eyebrow="MEMBERS"
        title={`People of ${BRAND.shortName}`}
        description="Designers, engineers, and organizers collaborate to keep this chapter thriving."
        variant="compact"
        sticker={{name: "assembly", size: 160}}
        bilingualCopy={membersHeroCopy}
      />

      <div className="mx-auto max-w-6xl px-6">
        <MemberListClient initialMembers={members} />
      </div>
    </div>
  );
}
