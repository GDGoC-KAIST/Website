"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProjectActionsProps {
  projectId: string;
  project: any;
}

export default function ProjectActions({ projectId, project }: ProjectActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setIsAuthor(project.createdBy === userData.id);
    }
  }, [project.createdBy]);

  if (!user || !isAuthor) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Link href={`/projects/${projectId}/edit`}>
        <Button variant="outline" size="sm">
          수정
        </Button>
      </Link>
    </div>
  );
}

