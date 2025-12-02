"use client";

import {useState} from "react";
import {api} from "@/lib/api";
import type {Member} from "@/lib/types";

interface MemberListClientProps {
  initialMembers: Member[];
}

const LOAD_MORE_LIMIT = 20;

export default function MemberListClient({initialMembers}: MemberListClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [offset, setOffset] = useState(initialMembers.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchCount, setLastFetchCount] = useState(initialMembers.length);

  const showLoadMore =
    !loadingMore && lastFetchCount >= LOAD_MORE_LIMIT && members.length > 0;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api
        .getMembers({limit: LOAD_MORE_LIMIT, offset})
        .catch(() => ({data: []}));
      const newMembers = res.data || [];

      setMembers((prev) => [...prev, ...newMembers]);
      setOffset((prev) => prev + newMembers.length);
      setLastFetchCount(newMembers.length);
    } catch (error) {
      console.error("Failed to load more members", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getProfileImage = (member: Member): string => {
    if (member.profileImageUrl) return member.profileImageUrl;
    if (member.githubUsername) {
      return `https://github.com/${member.githubUsername}.png`;
    }
    return "/gdgoc_icon.png";
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-3xl font-semibold">Meet Our Team</h2>
        <p className="mt-2 text-gray-600">
          The students driving GDG on Campus KAIST forward.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
          No members to show yet. Try again later.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <img
                src={getProfileImage(member)}
                alt={member.name}
                className="h-24 w-24 rounded-full object-cover"
              />
              <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.department}</p>
              <a
                href={`https://github.com/${member.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                GitHub
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.93c.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.27 1.2-3.07-.12-.29-.52-1.46.11-3.04 0 0 .98-.31 3.21 1.17.93-.26 1.93-.39 2.92-.4.99 0 1.99.14 2.92.4 2.23-1.48 3.21-1.17 3.21-1.17.63 1.58.23 2.75.11 3.04.75.8 1.2 1.82 1.2 3.07 0 4.41-2.68 5.39-5.24 5.67.42.36.8 1.09.8 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}

      {showLoadMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
