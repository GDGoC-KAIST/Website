
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

  return (
    <div>
      <div className="flex justify-center items-center h-screen">
        <img className="max-w-full h-auto" src="/gdgoc_icon.png" />
      </div>

      <FeatureSection7
        mainHeading={{text: "GDG on Campus KAIST"}}
        subHeading={{text: "We are Google Developer Group on Campus KAIST"}}
        recentProjects={projects}
        recentSeminars={seminarsWithImages}
      />
    </div>
  );
}
