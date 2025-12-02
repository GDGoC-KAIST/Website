"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SeminarActionsProps {
  seminarId: string;
  seminar: any;
}

export default function SeminarActions({ seminarId, seminar }: SeminarActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setIsAuthor(seminar.createdBy === userData.id);
    }
  }, [seminar.createdBy]);

  if (!user || !isAuthor) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Link href={`/seminars/${seminarId}/edit`}>
        <Button variant="outline" size="sm">
          수정
        </Button>
      </Link>
    </div>
  );
}

