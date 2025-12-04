import Link from "next/link";
import {notFound} from "next/navigation";
import ReactMarkdown, {type Components as MarkdownComponents} from "react-markdown";
import SmartCover from "@/components/media/SmartCover";
import {Button} from "@/components/ui/button";
import {api} from "@/lib/api";
import {normalizeUrl} from "@/lib/normalizeUrl";
import {resolveThumbnailValue} from "@/lib/imageUtils";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({params}: ProjectDetailPageProps) {
  const {id} = await params;

  let project = await api.getProject(id).catch((error) => {
    console.error("Failed to fetch project", error);
    return null;
  });

  if (!project) {
    const fallback = await api
      .getProjects({limit: 50})
      .catch(() => ({data: []}));
    project = fallback.data.find((item) => item.id === id) ?? null;
  }

  if (!project) {
    notFound();
  }

  const coverImageId =
    (project as any).coverImageId ??
    (project as any).thumbnailImageId ??
    (project as any).thumbnailId ??
    (project as any).imageId ??
    undefined;

  let coverImageUrl: string | undefined;

  if (coverImageId) {
    try {
      const image = await api.getImage(coverImageId);
      coverImageUrl = normalizeUrl(
        image.url ??
          (image as any).downloadUrl ??
          (image as any).downloadURL ??
          (image as any).imageUrl ??
          (image as any).publicUrl
      );
    } catch (error) {
      console.warn("Failed to resolve project cover image", error);
    }
  }

  if (!coverImageUrl && project.thumbnailUrl) {
    if (/^https?:\/\//i.test(project.thumbnailUrl)) {
      coverImageUrl = normalizeUrl(project.thumbnailUrl);
    } else {
      coverImageUrl = (await resolveThumbnailValue(project.thumbnailUrl)) || undefined;
    }
  }

  const content =
    project.readmeContent ||
    project.description ||
    "No description available at the moment.";

  const markdownComponents: MarkdownComponents = {
    img({node: _node, ...props}) {
      const src = props.src ?? "";
      if (!src.trim()) {
        return null;
      }
      return (
        <img
          {...props}
          src={src}
          alt={props.alt ?? ""}
          loading="lazy"
          className="my-6 w-full rounded-2xl"
        />
      );
    },
  };

  return (
    <div className="px-6 py-12 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <Link
          href="/projects"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back to projects
        </Link>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                project.status === "ongoing"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {project.status}
            </span>
            <span>{project.semester}</span>
          </div>
          <div>
            <h1 className="text-4xl font-semibold text-gray-900">
              {project.title}
            </h1>
            <p className="mt-3 text-lg text-gray-600">{project.summary}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {project.githubUrl && (
              <Button asChild variant="primary">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repo
                </a>
              </Button>
            )}
            {project.demoUrl && (
              <Button asChild variant="secondary">
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live Demo
                </a>
              </Button>
            )}
          </div>
        </header>

        <SmartCover
          src={coverImageUrl}
          alt={project.title}
          kind="project"
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="rounded-3xl border border-gray-100"
        />

        {(project.teamMembers?.length > 0 || project.techStack?.length > 0) && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              {project.teamMembers?.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Team
                  </h2>
                  <p className="mt-2 text-gray-800">
                    {project.teamMembers?.join(", ")}
                  </p>
                </div>
              )}
              {project.techStack?.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Tech Stack
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.techStack?.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="prose prose-lg max-w-none text-gray-800">
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </section>
      </div>
    </div>
  );
}
