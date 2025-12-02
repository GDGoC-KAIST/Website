import {api} from "@/lib/api";
import SeminarListClient, {SeminarWithImage} from "./SeminarListClient";
import NewSeminarButton from "./NewSeminarButton";

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
    <div className="px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          Seminars
        </p>
        <h1 className="mt-2 text-4xl font-semibold">
          Learnings from GDG on Campus KAIST
        </h1>
        <p className="mt-4 text-gray-600">
          Explore our invited talks and internal workshops covering the latest
          in technology, product, and community building.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl">
        <div className="flex justify-end mb-6">
          <NewSeminarButton />
        </div>
        <SeminarListClient initialSeminars={seminarsWithImages} />
      </div>
    </div>
  );
}
