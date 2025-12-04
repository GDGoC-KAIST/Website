import HeroBanner from "./(home)/components/HeroBanner";
import SectionWhatWeDo from "./(home)/components/SectionWhatWeDo";
import SectionFeaturedProjects from "./(home)/components/SectionFeaturedProjects";
import SectionContact from "./(home)/components/SectionContact";
import SectionStats from "./(home)/components/SectionStats";
import SectionRecruitCTA from "./(home)/components/SectionRecruitCTA";
import {api} from "@/lib/api";
import {getRecruitConfig} from "@/lib/recruitApi";
import {pickFeaturedProjects} from "@/lib/featured";
import {resolveThumbnailValue} from "@/lib/imageUtils";

export default async function Home() {
  const [projectsRes, seminarsRes, membersRes, recruitConfig] = await Promise.all([
    api.getProjects({limit: 20}).catch(() => ({data: []})),
    api.getSeminars({limit: 6}).catch(() => ({data: []})),
    api.getMembers({limit: 50}).catch(() => ({data: []})),
    getRecruitConfig().catch(() => null),
  ]);

  const allProjects = projectsRes.data || [];
  const projectsWithThumbnails = await Promise.all(
    allProjects.map(async (project) => {
      const thumbnailUrl =
        (await resolveThumbnailValue(project.thumbnailUrl)) || project.thumbnailUrl;
      return {...project, thumbnailUrl};
    })
  );

  const featuredProjects = pickFeaturedProjects(projectsWithThumbnails, 3);
  const membersCount = membersRes.data?.length ?? 0;
  const sessionsCount = seminarsRes.data?.length ?? 0;
  const projectsCount = allProjects.length;

  return (
    <div className="space-y-24 pb-24">
      <HeroBanner />
      <SectionWhatWeDo />
      <SectionStats
        membersCount={membersCount}
        sessionsCount={sessionsCount}
        projectsCount={projectsCount}
      />
      <SectionFeaturedProjects projects={featuredProjects} />
      <SectionRecruitCTA config={recruitConfig} />
      <SectionContact />
    </div>
  );
}
