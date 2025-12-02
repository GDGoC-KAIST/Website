import {api} from "@/lib/api";
import ProjectListClient from "../components/projects/ProjectListClient";
import NewProjectButton from "./NewProjectButton";

export default async function ProjectsPage() {
  const projectsRes = await api
    .getProjects({limit: 20, offset: 0})
    .catch(() => ({data: []}));
  const projects = projectsRes.data || [];

  return (
    <div className="px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-wide text-gray-500">Projects</p>
        <h1 className="mt-2 text-4xl font-semibold">
          What GDG on Campus KAIST is building
        </h1>
        <p className="mt-4 text-gray-600">
          Explore ongoing experiments and completed launches driven by our
          student community.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl">
        <div className="flex justify-end mb-6">
          <NewProjectButton />
        </div>
        <ProjectListClient initialProjects={projects} />
      </div>
    </div>
  );
}
