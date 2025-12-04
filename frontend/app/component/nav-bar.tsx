"use client";

import * as React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {MenuIcon} from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";
import {MdElectricBolt} from "react-icons/md";
import {VariantProps} from "class-variance-authority";
import {useLanguage} from "@/lib/i18n-context";
import {BRAND} from "@/lib/brand";
import {getRecruitConfig, RecruitConfig} from "@/lib/recruitApi";
import {usePrefersReducedMotion} from "@/lib/hooks/usePrefersReducedMotion";
import {useT} from "@/lib/i18n/useT";
import {messages} from "@/lib/i18n";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type BaseButtonProps = {
  text?: string;
  className?: string;
  variant?: ButtonVariant;
  isVisible?: boolean;
};

type ButtonClickProps = BaseButtonProps & {
  onClick?: () => void;
  urlLink?: never;
};

type ButtonUrlProps = BaseButtonProps & {
  onClick?: never;
  urlLink?: string;
};

type ButtonProps = ButtonClickProps | ButtonUrlProps;

export interface MenuItem {
  title: string;
  url: string;
}

interface NavBar2Props<T extends MenuItem> {
  domain?: {
    name?: string | React.ReactNode;
    logo?: React.ReactNode;
  };
  navigationMenu?: T[];
  isSticky?: boolean;
  authLinks?: {
    visible?: boolean;
    login?: ButtonProps;
    register?: ButtonProps;
  };
  leftAddon?: React.ReactNode;
  className?: string;
}

const DEFAULT_MENU: MenuItem[] = [
  {title: "Home", url: "/"},
  {title: "About", url: "/about"},
  {title: "Projects", url: "/projects"},
  {title: "Seminars", url: "/seminars"},
  {title: "Members", url: "/members"},
  {title: "Contact", url: "/contact"},
  {title: "Recruiting", url: "/recruit"},
];

type NavDictionaryKey = keyof (typeof messages)["en"]["nav"];

const NAV_TITLE_KEY_MAP: Partial<Record<string, NavDictionaryKey>> = {
  Home: "home",
  About: "about",
  Projects: "projects",
  Seminars: "seminars",
  Members: "members",
  Contact: "contact",
  Recruiting: "recruiting",
  Admin: "admin",
};

const statusDotClass: Record<"open" | "closed" | "soon", string> = {
  open: "bg-emerald-500",
  soon: "bg-amber-500",
  closed: "bg-gray-400",
};
const statusTextClass: Record<"open" | "closed" | "soon", string> = {
  open: "text-emerald-700",
  soon: "text-amber-700",
  closed: "text-gray-500",
};

function determineRecruitStatus(config: RecruitConfig): "open" | "closed" | "soon" {
  if (config.isOpen) return "open";
  const now = Date.now();
  const openAt = Date.parse(config.openAt || "");
  const closeAt = Date.parse(config.closeAt || "");
  if (!Number.isNaN(openAt) && now < openAt) {
    return "soon";
  }
  if (!Number.isNaN(closeAt) && now <= closeAt) {
    return "closed";
  }
  return "closed";
}

export function NavBar2<T extends MenuItem>(navBar2Props: NavBar2Props<T>) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [recruitStatus, setRecruitStatus] = React.useState<
    "open" | "closed" | "soon" | null
  >(null);
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const linkRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});
  const navListRef = React.useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = React.useState<{width: number; left: number} | null>(
    null
  );
  const {toggleLanguage} = useLanguage();
  const {t, language} = useT();
  const {
    domain = {name: BRAND.shortName},
    isSticky = true,
    authLinks,
    leftAddon,
    className = "",
    navigationMenu,
    ...props
  } = navBar2Props;

  const defaultdomain =
    domain && (domain.logo || domain.name)
      ? domain
      : {logo: <MdElectricBolt size={26} />, name: BRAND.shortName};
  const [isClient, setIsClient] = React.useState(false);
  const baseNavigationMenu = navigationMenu && navigationMenu.length > 0 ?
    navigationMenu :
    DEFAULT_MENU;
  const defaultNavigationMenu = React.useMemo(() => {
    const exists = baseNavigationMenu.some((item) => item.title === "Recruiting");
    if (exists) return baseNavigationMenu;
    return [...baseNavigationMenu, {title: "Recruiting", url: "/recruit"} as MenuItem];
  }, [baseNavigationMenu]);

  const translateMenuTitle = React.useCallback(
    (title: string) => {
      const key = NAV_TITLE_KEY_MAP[title];
      if (key) {
        const translated = t(`nav.${key}`);
        return translated || title;
      }
      return title;
    },
    [t]
  );

  const getRecruitStatusLabel = React.useCallback(
    (status: "open" | "closed" | "soon") => t(`recruit.status.${status}`) || status,
    [t]
  );

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isClient]);

  React.useEffect(() => {
    let mounted = true;
    async function fetchRecruitingState() {
      try {
        const config = await getRecruitConfig();
        if (!mounted) return;
        setRecruitStatus(determineRecruitStatus(config));
      } catch {
        if (mounted) {
          setRecruitStatus(null);
        }
      }
    }
    fetchRecruitingState();
    return () => {
      mounted = false;
    };
  }, []);

  const {login = {}} = authLinks || {};
  const {register = {}} = authLinks || {};
  const {
    className: loginClassName = "",
    isVisible: isLoginVisbile = false,
    onClick: onLoginClicked,
    text: loginText = "Login",
    urlLink: urlLoginUrl = "",
    variant: loginVariant = "ghost",
  } = login;

  const {
    className: registerClassName = "",
    isVisible: isRegisterVisible = false,
    onClick: onRegisterClicked,
    text: registerText = "Register",
    urlLink: urlRegisterUrl = "",
    variant: registerVariant = "default",
  } = register;

  const baseLinkClass =
    "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold leading-none whitespace-nowrap shrink-0 transition-colors duration-150";
  const isPathActive = React.useCallback(
    (url: string) => {
      if (url === "/") return pathname === "/";
      return pathname === url || pathname.startsWith(`${url}/`);
    },
    [pathname]
  );
  const activeKey =
    defaultNavigationMenu.find((item) => isPathActive(item.url))?.url || null;

  const updateUnderline = React.useCallback(() => {
    if (!activeKey) {
      setUnderlineStyle(null);
      return;
    }
    const container = navListRef.current;
    const target = linkRefs.current[activeKey];
    if (!container || !target) {
      setUnderlineStyle(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setUnderlineStyle({
      width: targetRect.width,
      left: targetRect.left - containerRect.left,
    });
  }, [activeKey, language]);

  React.useEffect(() => {
    updateUnderline();
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [updateUnderline]);

  const renderNavLink = (item: MenuItem, translatedTitle: string) => {
    const isActive = isPathActive(item.url);
    return (
      <NavigationMenuLink asChild>
        <Link
          ref={(node) => {
            if (node) {
              linkRefs.current[item.url] = node;
            }
          }}
          href={item.url}
          className={`${baseLinkClass} ${
            isActive
              ? "text-primary underline underline-offset-4"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <span className="leading-none whitespace-nowrap">{translatedTitle}</span>
        </Link>
      </NavigationMenuLink>
    );
  };

  const renderRecruitingLink = (item: MenuItem, translatedTitle: string) => {
    const isActive = isPathActive(item.url);
    const statusLabel = recruitStatus ? getRecruitStatusLabel(recruitStatus) : null;
    return (
      <NavigationMenuLink asChild>
        <Link
          ref={(node) => {
            if (node) {
              linkRefs.current[item.url] = node;
            }
          }}
          href={item.url}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold leading-none whitespace-nowrap shrink-0 transition-colors duration-200 ${
            isActive
              ? "border-blue-300 bg-blue-50 text-primary"
              : "border-border text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-primary"
          }`}
        >
          <span className="leading-none">{translatedTitle}</span>
          {recruitStatus && statusLabel && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wide whitespace-nowrap ${statusTextClass[recruitStatus]}`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass[recruitStatus]}`} />
              <span className="leading-none whitespace-nowrap">{statusLabel}</span>
            </span>
          )}
        </Link>
      </NavigationMenuLink>
    );
  };

  const navBarSticklyTailwindCss = `
    fixed top-0 left-0 right-0 z-50 w-full
    flex items-center
    px-4 py-3 sm:px-6 lg:px-10 lg:py-5
    bg-white/80 backdrop-blur-lg border-b border-white/20 transition-all duration-300
    ${isScrolled ? "shadow-lg" : ""}`;

  if (!isClient) return null;

  return (
    <nav
      {...props}
      className={`${
        isSticky
          ? navBarSticklyTailwindCss
          : "relative flex items-center justify-between px-4 py-3 sm:px-6 lg:px-10"
      } ${className}`}
    >
      <div className="min-w-0 flex items-center">
        <RenderNameAndLogo domain={defaultdomain} />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
        <NavigationMenu viewport={false} className="pointer-events-auto flex items-center">
          <div ref={navListRef} className="relative flex items-center">
          <NavigationMenuList className="flex items-center gap-1 pb-3">
            {defaultNavigationMenu.map((mainMenuItem) => {
              const translatedTitle = translateMenuTitle(mainMenuItem.title);
              const isRecruitingItem = mainMenuItem.title === "Recruiting";
              return (
                <NavigationMenuItem key={mainMenuItem.title}>
                  {isRecruitingItem
                    ? renderRecruitingLink(mainMenuItem, translatedTitle)
                    : renderNavLink(mainMenuItem, translatedTitle)}
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
          {underlineStyle && (
            <span
              className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#4285f4] to-[#34a853]"
              style={{
                width: underlineStyle.width,
                transform: `translateX(${underlineStyle.left}px)`,
                transition: prefersReducedMotion
                  ? "none"
                  : "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), width 320ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          )}
          </div>
        </NavigationMenu>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3 pr-1 sm:pr-2">
        <div className="lg:hidden">
          <RenderMobileMenu
            domain={defaultdomain}
            navigationMenu={defaultNavigationMenu}
            pathname={pathname}
            translateMenuItem={translateMenuTitle}
            recruitStatus={recruitStatus}
            getStatusLabel={getRecruitStatusLabel}
          />
        </div>
        {leftAddon && <div className="hidden lg:flex">{leftAddon}</div>}
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold hover:bg-gray-50"
        >
          {language === "ko" ? "KO" : "EN"}
        </button>
        <RenderAuthButton
          className={loginClassName}
          isVisible={isLoginVisbile}
          onClick={onLoginClicked}
          text={loginText}
          urlLink={urlLoginUrl}
          variant={loginVariant}
        />
        <RenderAuthButton
          className={registerClassName}
          isVisible={isRegisterVisible}
          onClick={onRegisterClicked}
          text={registerText}
          urlLink={urlRegisterUrl}
          variant={registerVariant}
        />
      </div>
    </nav>
  );
}

const RenderNameAndLogo = <T extends MenuItem>({
  domain,
}: {
  domain: NavBar2Props<T>["domain"];
}) => {
  const logo = domain?.logo || <MdElectricBolt size={26} />;
  const nameProp = domain?.name;
  const hasNameProp = domain ? Object.prototype.hasOwnProperty.call(domain, "name") : false;
  return (
    <Link href={"/"}>
      <div className="flex items-center gap-2 mt-[5px]">
        {logo}
        {hasNameProp ? (
          nameProp ? (
            typeof nameProp === "string" ? (
              <h1 className="text-2xl font-bold max-md:hidden">{nameProp}</h1>
            ) : (
              <div className="flex items-center gap-2 mt-[5px]">{nameProp}</div>
            )
          ) : null
        ) : (
          <h1 className="text-2xl font-bold max-md:hidden">{BRAND.shortName}</h1>
        )}
      </div>
    </Link>
  );
};

type RequiredButtonsProps = Required<Omit<ButtonProps, "onClick">> & {
  onClick?: () => void;
  isInSheet?: boolean;
};

function RenderAuthButton({
  className,
  isVisible,
  onClick,
  text,
  urlLink,
  variant,
  isInSheet = false,
}: RequiredButtonsProps) {
  if (!isVisible) {
    return <div className="max-lg:hidden" />;
  }

  if (onClick) {
    return (
      <Button
        onClick={onClick}
        className={`h-10 ${
          isInSheet ? "w-full" : ""
        } cursor-pointer select-none ${className}`}
        variant={variant}
      >
        <span>{text}</span>
      </Button>
    );
  }

  return (
    <Button
      className={`h-10 ${
        isInSheet ? "w-full mt-5" : ""
      } cursor-pointer select-none ${className}`}
      variant={variant}
      asChild
    >
      <a className="no-underline" href={urlLink}>
        {text}
      </a>
    </Button>
  );
}

function RenderMobileMenu<T extends MenuItem>({
  domain,
  navigationMenu,
  pathname,
  translateMenuItem,
  recruitStatus,
  getStatusLabel,
}: {
  domain: NavBar2Props<T>["domain"];
  navigationMenu: MenuItem[];
  pathname: string;
  translateMenuItem: (title: string) => string;
  recruitStatus: "open" | "closed" | "soon" | null;
  getStatusLabel: (status: "open" | "closed" | "soon") => string;
}) {
  const logo = domain?.logo || <MdElectricBolt size={26} />;
  return (
    <Sheet>
      <SheetTrigger asChild className="hidden max-lg:block">
        <Button variant={"outline"}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-start gap-2">
            {React.cloneElement(logo as React.ReactElement, {
              size: "25",
            })}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-12 flex flex-col space-y-4 pl-1">
          {navigationMenu.map((item) => {
            const translatedTitle = translateMenuItem(item.title);
            const isRecruitingItem = item.title === "Recruiting";
            return (
              <Link
                key={item.title}
                href={item.url}
                className={`flex items-center justify-between text-lg font-semibold ${
                  pathname === item.url
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="whitespace-nowrap">{translatedTitle}</span>
                {isRecruitingItem && recruitStatus && (
                  <span
                    className={`text-xs font-mono uppercase tracking-wide whitespace-nowrap ${statusTextClass[recruitStatus]}`}
                  >
                    {getStatusLabel(recruitStatus)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
