import {api} from "@/lib/api";
import MemberListClient from "../components/members/MemberListClient";

export default async function MembersPage() {
  const membersRes = await api.getMembers({limit: 50}).catch(() => ({data: []}));
  const members = membersRes.data || [];

  return (
    <div className="px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-wide text-gray-500">Members</p>
        <h1 className="mt-2 text-4xl font-semibold">
          People of GDG on Campus KAIST
        </h1>
        <p className="mt-4 text-gray-600">
          Designers, engineers, and community builders making this chapter
          thrive.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl">
        <MemberListClient initialMembers={members} />
      </div>
    </div>
  );
}
