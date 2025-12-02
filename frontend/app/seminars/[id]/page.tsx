import Link from "next/link";
import {notFound} from "next/navigation";
import ReactMarkdown from "react-markdown";
import {api} from "@/lib/api";
import SeminarActions from "./SeminarActions";

interface SeminarDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeminarDetailPage({params}: SeminarDetailPageProps) {
  const resolvedParams = await params;
  const {id} = resolvedParams;

  if (!id) {
    console.error("Seminar ID is missing from params");
    notFound();
  }

  let seminar;
  try {
    seminar = await api.getSeminar(id);
  } catch (error) {
    console.error("Failed to fetch seminar", {id, error});
    notFound();
  }

  if (!seminar) {
    console.error("Seminar not found", {id});
    notFound();
  }

  let coverImageUrl: string | undefined;
  if (seminar.coverImageId) {
    try {
      const image = await api.getImage(seminar.coverImageId);
      coverImageUrl = image.url;
    } catch (error) {
      console.warn("Failed to resolve seminar cover image", error);
    }
  }

  const formattedDate = seminar.date
    ? new Date(seminar.date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : null;

  return (
    <div className="px-6 py-12 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link
          href="/seminars"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back to seminars
        </Link>
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {seminar.type} · {seminar.semester}
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-gray-900">
                {seminar.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                {formattedDate && <span>{formattedDate}</span>}
                {seminar.speaker && <span>Speaker: {seminar.speaker}</span>}
                {seminar.affiliation && <span>Affiliation: {seminar.affiliation}</span>}
                {seminar.location && <span>Location: {seminar.location}</span>}
              </div>
            </div>
            <SeminarActions seminarId={id} seminar={seminar} />
          </div>
        </div>

        {coverImageUrl && (
          <div className="overflow-hidden rounded-3xl border border-gray-100">
            <img
              src={coverImageUrl}
              alt={seminar.title}
              className="h-96 w-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-800">
          <ReactMarkdown>{seminar.contentMd || ""}</ReactMarkdown>
        </div>

        {seminar.attachmentUrls && seminar.attachmentUrls.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold">Attachments</h2>
            <ul className="mt-3 list-disc pl-6">
              {seminar.attachmentUrls.map((url, index) => (
                <li key={url + index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Resource {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
