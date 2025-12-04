"use client";

import Link from "next/link";
import {IconType} from "react-icons";

interface SocialIconLinkProps {
  href: string;
  icon: IconType;
  label: string;
  className?: string;
}

export default function SocialIconLink({
  href,
  icon: Icon,
  label,
  className,
}: SocialIconLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={className}
    >
      <Icon className="h-5 w-5 transition-opacity duration-200 hover:opacity-80" />
    </Link>
  );
}
