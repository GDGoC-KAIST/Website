import {Dispatch, FormEvent, SetStateAction} from "react";
import {Member} from "@/lib/types";
import {ResourcePanel, InputField} from "./common";
import {Button} from "@/components/ui/button";

interface MembersPanelProps {
  members: Member[];
  form: {
    name: string;
    email: string;
    department: string;
    githubUsername: string;
  };
  setForm: Dispatch<SetStateAction<MembersPanelProps["form"]>>;
  editing: Member | null;
  disableSubmit: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (member: Member) => void;
  onEdit: (member: Member) => void;
  onCancelEdit: () => void;
}

export default function MembersPanel({
  members,
  form,
  setForm,
  editing,
  disableSubmit,
  onSubmit,
  onDelete,
  onEdit,
  onCancelEdit,
}: MembersPanelProps) {
  return (
    <ResourcePanel
      form={
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Member" : "Create Member"}
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
          <InputField
            label="Name"
            value={form.name}
            onChange={(value) => setForm((prev) => ({...prev, name: value}))}
            required
          />
          <InputField
            label="Email"
            value={form.email}
            onChange={(value) => setForm((prev) => ({...prev, email: value}))}
            required
          />
          <InputField
            label="Department"
            value={form.department}
            onChange={(value) => setForm((prev) => ({...prev, department: value}))}
            required
          />
          <InputField
            label="GitHub Username"
            value={form.githubUsername}
            onChange={(value) => setForm((prev) => ({...prev, githubUsername: value}))}
            required
          />
          <Button type="submit" className="mt-6 w-full" disabled={disableSubmit}>
            {editing ? "Update Member" : "Create Member"}
          </Button>
        </form>
      }
      list={
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Members</h3>
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="rounded-xl border border-gray-100 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.department}</p>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button className="text-primary" onClick={() => onEdit(member)}>
                    Edit
                  </button>
                  <button className="text-red-500" onClick={() => onDelete(member)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
