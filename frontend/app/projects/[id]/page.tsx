import Link from "next/link";
import {notFound} from "next/navigation";
import ReactMarkdown from "react-markdown";
import {api} from "@/lib/api";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({params}: ProjectDetailPageProps) {
  const {id} = params;

  let project;
  try {
    project = await api.getProject(id);
  } catch (error) {
    console.error("Failed to fetch project", error);
    notFound();
  }

  if (!project) {
    notFound();
  }

  const content =
    project.readmeContent ||
    project.description ||
    "No description available at the moment.";

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
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                GitHub Repo
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Live Demo
              </a>
            )}
          </div>
        </header>

        {(project.teamMembers.length > 0 || project.techStack.length > 0) && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              {project.teamMembers.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Team
                  </h2>
                  <p className="mt-2 text-gray-800">
                    {project.teamMembers.join(", ")}
                  </p>
                </div>
              )}
              {project.techStack.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Tech Stack
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
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
          <ReactMarkdown>{content}</ReactMarkdown>
        </section>
      </div>
    </div>
  );
}
