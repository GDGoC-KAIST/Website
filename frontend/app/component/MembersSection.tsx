"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  githubId: string;
  githubUsername: string;
  profileImageUrl?: string;
  name: string;
  email: string;
}

export default function MembersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.getApprovedUsers({ limit: 200 });
        setUsers(res.users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // 에러 메시지를 콘솔에 표시
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <section id="members" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">동아리원</h2>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (users.length === 0) {
    return (
      <section id="members" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">동아리원</h2>
          <p className="text-center text-gray-500">등록된 동아리원이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="members" className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">동아리원</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
          {users.map((user) => (
            <a
              key={user.id}
              href={`https://github.com/${user.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-4 rounded-lg hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="relative mb-2">
                <img
                  src={user.profileImageUrl || `https://github.com/${user.githubUsername}.png`}
                  alt={user.githubUsername}
                  className="w-16 h-16 rounded-full border-2 border-gray-200 group-hover:border-primary transition-colors"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://github.com/${user.githubUsername}.png`;
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors text-center">
                {user.githubUsername}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

