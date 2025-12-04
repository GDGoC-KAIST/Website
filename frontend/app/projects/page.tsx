import {api} from "@/lib/api";
import {BRAND} from "@/lib/brand";
import {resolveThumbnailValue} from "@/lib/imageUtils";
import ProjectListClient from "../components/projects/ProjectListClient";
import type {BilingualIntro} from "../component/PageIntro";
import Container from "@/components/layout/Container";
import PageHero from "@/components/layout/PageHero";
import {PROJECTS_HERO_IMAGES} from "@/lib/heroImages";

const projectsHeroCopy = {
  en: {
    description:
      "Our chapter ships experiments and real products every semester. Browse ongoing initiatives and completed launches.",
  },
  ko: {
    description:
      "우리 챕터는 학기마다 실험적인 아이디어와 실제 서비스를 함께 구현합니다. 진행 중인 프로젝트와 완료된 결과물을 확인해 보세요.",
  },
};

const projectsIntro: BilingualIntro = {
  ko: {
    eyebrow: "프로젝트",
    title: `${BRAND.shortName}가 만드는 것들`,
    description:
      "우리 챕터는 학기마다 실험적인 아이디어와 실제 서비스를 함께 구현합니다. 진행 중인 프로젝트와 완료된 결과물을 확인해 보세요.",
  },
  en: {
    eyebrow: "Projects",
    title: `What ${BRAND.shortName} is building`,
    description:
      "Our chapter ships experiments and real products every semester. Browse ongoing initiatives and completed launches.",
  },
};

export default async function ProjectsPage() {
  const projectsRes = await api
    .getProjects({limit: 20, offset: 0})
    .catch(() => ({data: []}));
  const projects = projectsRes.data || [];

  const projectsWithThumbnails = await Promise.all(
    projects.map(async (project) => {
      const thumbnailUrl =
        (await resolveThumbnailValue(project.thumbnailUrl)) ||
        project.thumbnailUrl;
      return {
        ...project,
        thumbnailUrl,
      };
    })
  );

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        images={PROJECTS_HERO_IMAGES}
        eyebrow="PROJECTS"
        title={`What ${BRAND.shortName} is building`}
        description="Our chapter ships experiments and real products every semester. Browse ongoing initiatives and completed launches."
        variant="compact"
        sticker={{name: "assembly", size: 155}}
        bilingualCopy={projectsHeroCopy}
      />

      <Container className="space-y-12">
        <ProjectListClient initialProjects={projectsWithThumbnails} />
      </Container>
    </div>
  );
}
