import {Dispatch, FormEvent, SetStateAction} from "react";
import {Button} from "@/components/ui/button";
import {Seminar} from "@/lib/types";
import {ResourcePanel, InputField, TextareaField, SelectField} from "./common";

interface SeminarsPanelProps {
  seminars: Seminar[];
  form: {
    title: string;
    summary: string;
    speaker: string;
    date: string;
    semester: string;
    type: string;
    contentMd: string;
    coverImageId: string;
  };
  setForm: Dispatch<SetStateAction<SeminarsPanelProps["form"]>>;
  editing: Seminar | null;
  disableSubmit: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (seminar: Seminar) => void;
  onEdit: (seminar: Seminar) => void;
  onCancelEdit: () => void;
}

export default function SeminarsPanel({
  seminars,
  form,
  setForm,
  editing,
  disableSubmit,
  onSubmit,
  onDelete,
  onEdit,
  onCancelEdit,
}: SeminarsPanelProps) {
  return (
    <ResourcePanel
      form={
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Seminar" : "Create Seminar"}
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
            <InputField
              label="Speaker"
              value={form.speaker}
              onChange={(value) => setForm((prev) => ({...prev, speaker: value}))}
            />
            <InputField
              label="Date (YYYY-MM-DD)"
              value={form.date}
              onChange={(value) => setForm((prev) => ({...prev, date: value}))}
            />
            <SelectField
              label="Type"
              value={form.type}
              options={[
                {label: "Invited", value: "invited"},
                {label: "Internal", value: "internal"},
              ]}
              onChange={(value) => setForm((prev) => ({...prev, type: value}))}
            />
          </div>
          <InputField
            label="Cover Image ID"
            helper="Paste Image ID from the Images tab"
            value={form.coverImageId}
            onChange={(value) => setForm((prev) => ({...prev, coverImageId: value}))}
          />
          <TextareaField
            label="Content (Markdown)"
            value={form.contentMd}
            onChange={(value) => setForm((prev) => ({...prev, contentMd: value}))}
            required
            rows={6}
          />
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={disableSubmit}>
            {editing ? "Update Seminar" : "Create Seminar"}
          </Button>
        </form>
      }
      list={
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Seminars</h3>
          <ul className="space-y-3">
            {seminars.map((seminar) => (
              <li
                key={seminar.id}
                className="rounded-xl border border-gray-100 p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">{seminar.semester}</p>
                    <p className="font-semibold">{seminar.title}</p>
                    <p className="text-xs text-gray-400">{seminar.id}</p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button className="text-primary" onClick={() => onEdit(seminar)}>
                      Edit
                    </button>
                    <button className="text-red-500" onClick={() => onDelete(seminar)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{seminar.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
