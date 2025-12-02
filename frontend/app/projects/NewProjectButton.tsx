"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewProjectButton() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Link href="/projects/new">
      <Button variant="default" size="sm">
        새 프로젝트 작성
      </Button>
    </Link>
  );
}

