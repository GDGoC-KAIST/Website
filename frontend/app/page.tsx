
import {api} from "@/lib/api";
import FeatureSection7, {SeminarWithImage} from "./component/FeatureSection7";

export default async function Home() {
  const [projectsRes, seminarsRes] = await Promise.all([
    api.getProjects({limit: 6, status: "ongoing"}).catch(() => ({data: []})),
    api.getSeminars({limit: 6}).catch(() => ({data: []})),
  ]);

  const projects = projectsRes.data || [];
  const seminars = seminarsRes.data || [];

  const seminarImageResults = await Promise.allSettled(
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
  seminarImageResults.forEach((result) => {
    if (result.status === "fulfilled") {
      coverImageMap.set(result.value.seminarId, result.value.coverImageUrl);
    }
  });

  const seminarsWithImages: SeminarWithImage[] = seminars.map((seminar) => ({
    ...seminar,
    coverImageUrl: coverImageMap.get(seminar.id),
  }));

  const aboutAccordionItems = [
    {
      id: "together-growth",
      title: {
        text: "함께 성장하는 개발자 커뮤니티",
        className: ""
      },
      content: {
        text: "KAIST의 구성원들이 함께 성장할 수 있는 개발자 커뮤니티입니다. 지식을 쌓고, 개발을 경험하며, 여러 구성원과 협력함으로써 개발자 역량을 강화합니다. 함께 배우고 성장하는 과정에서 실질적인 개발 경험을 쌓을 수 있습니다.",
        className: ""
      }
    },
    {
      id: "knowledge-sharing",
      title: {
        text: "지식과 경험의 공유",
        className: ""
      },
      content: {
        text: "KAIST 구성원들의 지식과 경험을 자유롭게 공유할 수 있는 환경을 조성합니다. 스터디를 통해 깊이 있는 학습을 하고, 세미나를 통해 다양한 주제의 지식을 나눕니다. 서로의 경험과 노하우를 공유하며 함께 발전합니다.",
        className: ""
      }
    },
    {
      id: "wide-network",
      title: {
        text: "넓은 폭의 교류 기회",
        className: ""
      },
      content: {
        text: "KAIST 구성원에서 현직 개발자까지 넓은 폭의 교류의 기회를 제공합니다. 네트워킹과 친목 활동을 통해 다양한 사람들과 만나고, 프로젝트를 통해 실무 경험을 쌓을 수 있습니다. 개발자로서의 네트워크를 넓히고 협업 능력을 기릅니다.",
        className: ""
      }
    },
    {
      id: "diverse-activities",
      title: {
        text: "다양한 활동과 기회",
        className: ""
      },
      content: {
        text: "스터디, 프로젝트, 세미나, 이벤트 등 다양한 활동을 통해 개발 역량을 키웁니다. AI 논문 스터디부터 프론트엔드, 백엔드, DevOps까지 다양한 분야의 스터디가 운영되며, 자유롭게 프로젝트를 제안하고 참여할 수 있습니다. 대회, 공모전, 창업 관련 정보도 함께 공유합니다.",
        className: ""
      }
    }
  ];

  const aboutImages = [
    {
      id: "community-1",
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000",
      alt: "개발자 커뮤니티",
      className: "",
      imageFitOptions: "object-cover" as const
    },
    {
      id: "community-2",
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000",
      alt: "협업과 학습",
      className: "",
      imageFitOptions: "object-cover" as const
    },
    {
      id: "community-3",
      src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000",
      alt: "프로젝트와 성장",
      className: "",
      imageFitOptions: "object-cover" as const
    }
  ];

  return (
    <div>
      <FeatureSection7
        mainHeading={{
          text: (
            <div className="flex items-center justify-center gap-4 animate-fade-in-up">
              <img 
                src="/gdgoc_icon.png" 
                alt="GDGoC Logo" 
                className="h-16 w-16 md:h-20 md:w-20 animate-fade-in animate-wiggle"
              />
              <span className="animate-fade-in-up-delay">GDG on Campus KAIST</span>
            </div>
          )
        }}
        subHeading={{text: "KAIST의 구성원들이 함께 성장할 수 있는 개발자 커뮤니티"}}
        accordionItems={aboutAccordionItems}
        images={aboutImages}
        recentProjects={projects}
        recentSeminars={seminarsWithImages}
      />
    </div>
  );
}
