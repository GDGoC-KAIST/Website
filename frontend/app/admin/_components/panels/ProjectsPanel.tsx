import {Dispatch, FormEvent, SetStateAction} from "react";
import {Project} from "@/lib/types";
import {ResourcePanel, InputField, SelectField, TextareaField} from "./common";
import {Button} from "@/components/ui/button";

interface ProjectsPanelProps {
  projects: Project[];
  form: {
    title: string;
    summary: string;
    semester: string;
    status: string;
    githubUrl: string;
    demoUrl: string;
    thumbnailUrl: string;
    techStack: string;
    teamMembers: string;
    description: string;
  };
  setForm: Dispatch<SetStateAction<ProjectsPanelProps["form"]>>;
  editing: Project | null;
  disableSubmit: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
  onCancelEdit: () => void;
}

export default function ProjectsPanel({
  projects,
  form,
  setForm,
  editing,
  disableSubmit,
  onSubmit,
  onDelete,
  onEdit,
  onCancelEdit,
}: ProjectsPanelProps) {
  return (
    <ResourcePanel
      form={
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Project" : "Create Project"}
            </h2>
            {editing && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-sm text-primary underline"
              >
                Cancel edit
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Title"
              value={form.title}
              onChange={(value) => setForm((prev) => ({...prev, title: value}))}
              required
            />
            <InputField
              label="Semester"
              placeholder="2024-2"
              value={form.semester}
              onChange={(value) => setForm((prev) => ({...prev, semester: value}))}
              required
            />
          </div>
          <TextareaField
            label="Summary"
            value={form.summary}
            onChange={(value) => setForm((prev) => ({...prev, summary: value}))}
            required
          />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Status"
              value={form.status}
              options={[
                {label: "Ongoing", value: "ongoing"},
                {label: "Completed", value: "completed"},
              ]}
              onChange={(value) => setForm((prev) => ({...prev, status: value}))}
            />
            <InputField
              label="GitHub URL"
              value={form.githubUrl}
              onChange={(value) => setForm((prev) => ({...prev, githubUrl: value}))}
            />
            <InputField
              label="Demo URL"
              value={form.demoUrl}
              onChange={(value) => setForm((prev) => ({...prev, demoUrl: value}))}
            />
          </div>
          <InputField
            label="Thumbnail Image ID"
            helper="Copy ID from the Images tab"
            value={form.thumbnailUrl}
            onChange={(value) => setForm((prev) => ({...prev, thumbnailUrl: value}))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Tech Stack (comma separated)"
              value={form.techStack}
              onChange={(value) => setForm((prev) => ({...prev, techStack: value}))}
            />
            <InputField
              label="Team Members (comma separated)"
              value={form.teamMembers}
              onChange={(value) => setForm((prev) => ({...prev, teamMembers: value}))}
            />
          </div>
          <TextareaField
            label="Description / README"
            value={form.description}
            onChange={(value) => setForm((prev) => ({...prev, description: value}))}
            rows={6}
          />
          <Button type="submit" className="mt-6 w-full" disabled={disableSubmit}>
            {editing ? "Update Project" : "Create Project"}
          </Button>
        </form>
      }
      list={
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Projects</h3>
          <ul className="space-y-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-gray-100 p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">{project.semester}</p>
                    <p className="font-semibold">{project.title}</p>
                    <p className="text-xs text-gray-400">{project.id}</p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button className="text-primary" onClick={() => onEdit(project)}>
                      Edit
                    </button>
                    <button className="text-red-500" onClick={() => onDelete(project)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{project.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
