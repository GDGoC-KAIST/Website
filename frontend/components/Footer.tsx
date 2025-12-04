"use client";

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import {SITE} from "@/lib/site";
import {FaInstagram, FaLinkedin} from "react-icons/fa6";
import SocialIconLink from "@/components/brand/SocialIconLink";
import {useT} from "@/lib/i18n/useT";
import {messages} from "@/lib/i18n";

const stripColors = ["#4285F4", "#EA4335", "#F9AB00", "#34A853"];
type NavLabelKey = keyof (typeof messages)["en"]["nav"];

const NAV_LINK_KEY_MAP: Partial<Record<string, NavLabelKey>> = {
  Home: "home",
  About: "about",
  Projects: "projects",
  Seminars: "seminars",
  Members: "members",
  Contact: "contact",
  Recruiting: "recruiting",
  Admin: "admin",
};

export default function Footer() {
  const {t} = useT();

  const getNavLabel = (label: string) => {
    const key = NAV_LINK_KEY_MAP[label];
    if (key) {
      const translated = t(`nav.${key}`);
      return translated || label;
    }
    return label;
  };

  const exploreLabel = "Explore";
  const description = t("footer.description") || t("seo.description") || "";
  const contactLabel = "Contact";
  const emailLabel = "Email";
  const socialHeading = "Social";
  const rights = t("footer.rights");
  const madeWith = "Made with";
  const by = "by";
  const instagramLabel = t("footer.social.instagram") || "Instagram";
  const linkedinLabel = t("footer.social.linkedin") || "LinkedIn";

  return (
    <footer className="mt-16 w-full bg-[var(--surface-2)]">
      <div className="grid grid-cols-4 h-[3px] w-full">
        {stripColors.map((color) => (
          <div key={color} style={{backgroundColor: color}} />
        ))}
      </div>
      <Container className="flex flex-col gap-10 py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center">
              <Image
                src="/GDGoC KAIST Logo.png"
                alt="GDG on Campus KAIST lockup"
                width={330}
                height={90}
                priority
                className="w-full max-w-[330px] object-contain"
                style={{height: "auto"}}
              />
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {exploreLabel}
            </p>
            <nav className="grid grid-cols-2 gap-2 text-sm">
              {SITE.navigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-[var(--text-1)]"
                >
                  {getNavLabel(link.label)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {contactLabel}
            </p>
            <p className="text-sm text-[var(--text-1)]">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {emailLabel}
              </span>{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="font-semibold text-primary hover:underline"
              >
                {SITE.email}
              </a>
            </p>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {socialHeading}
              </p>
              <div className="flex items-center gap-4 text-muted-foreground">
                <SocialIconLink
                  href={SITE.social.instagram}
                  icon={FaInstagram}
                  label={instagramLabel}
                />
                <SocialIconLink
                  href={SITE.social.linkedin}
                  icon={FaLinkedin}
                  label={linkedinLabel}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-6 text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.officialName}. {rights}
          </p>
          <p className="mt-2 sm:mt-0">
            {madeWith} <span className="text-red-500" aria-hidden="true">♥</span> {by} KAIST
          </p>
        </div>
      </Container>
    </footer>
  );
}
