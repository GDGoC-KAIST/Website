"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewSeminarButton() {
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
    <Link href="/seminars/new">
      <Button variant="default" size="sm">
        새 세미나 작성
      </Button>
    </Link>
  );
}

