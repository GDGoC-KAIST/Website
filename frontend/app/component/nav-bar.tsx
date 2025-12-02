
"use client";

import * as React from "react";
import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  MenuIcon,
  BookOpen,
  MessageCircle,
  Info,
  Phone,
  Compass,
  University,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { MdElectricBolt } from "react-icons/md";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VariantProps } from "class-variance-authority";

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

export interface MenuItem {
  title: string;
  url: string;
  subMenu?: SubMenu[];
}

export interface SubMenu {
  title: string;
  description?: string;
  url?: string;
  icon?: React.ReactNode;
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"li"> {
  href: string;
  title: string; // Add title to the interface
  description?: string; // Make description optional as per its usage below
  icon?: React.ReactNode;
  children?: React.ReactNode; // Make children optional if it's not always present
}

const mainMenu: MenuItem[] = [
  {
    title: "About",
    url: "/about", // Base URL for products
    subMenu: [
      {
        title: "GDG on Campus KAIST",
        url: "/",
        description: "GDG on Campus KAIST를 소개합니다.",
        icon: <University />,
      },
      {
        title: "동아리원",
        url: "/",
        description: "",
        icon: <Users />,
      },
      {
        title: "동아리 연락처",
        url: "/products/categories",
        description: "",
        icon: <Phone />,
      },
    ],
  },
  {
    title: "Blog",
    url: "/blog", // Base URL for products
    subMenu: [
      {
        title: "GDGoC KAIST",
        url: "/blog",
        description: "GDGoC KAIST를 소개합니다.",
        icon: <University />,
      },
      {
        title: "동아리원",
        url: "/products/new",
        description: "",
        icon: <Users />,
      },
      {
        title: "동아리 연락처",
        url: "/products/categories",
        description: "",
        icon: <Phone />,
      },
    ],
  },
  {
    title: "Members",
    url: "/members",
    subMenu: [
      {
        title: "Our Story",
        url: "/members",
        description: "Learn about our mission and values.",
        icon: <BookOpen />,
      },
      {
        title: "Team",
        url: "/about/team",
        description: "Meet the people behind our success.",
        icon: <Users />,
      },
    ],
  },
  {
    title: "Contact",
    url: "/contact",
    subMenu: [
      {
        title: "Help Center",
        url: "/contact",
        description: "Find answers to common questions.",
        icon: <MessageCircle />,
      },
      {
        title: "Contact Us",
        url: "/support/contact",
        description: "Get in touch with our support team.",
        icon: <Phone />,
      },
      {
        title: "FAQs",
        url: "/support/faq",
        description: "Frequently Asked Questions.",
        icon: <Info />,
      },
    ],
  },
];

export function NavBar2<T extends MenuItem>(navBar2Props: NavBar2Props<T>) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const {
    domain = { name: "GDG on Campus KAIST" },
    isSticky = true,
    authLinks,
    leftAddon,
    className = "",
    navigationMenu,
    ...props
  } = navBar2Props;

  const defaultdomain = domain || <MdElectricBolt size={26} />;
  const [isClient, setIsClient] = React.useState(false);
  const defaultNavigationMenu = navigationMenu ?? mainMenu;

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        // Adjust this value as needed
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isClient]);

  const { login = {} } = authLinks || {};
  const { register = {} } = authLinks || {};
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

  const navBarSticklyTailwindCss = `
        fixed top-0 left-0 right-0 z-50 p-7 py-5 flex justify-between items-center  transition-all duration-300
        ${
          isScrolled
            ? " bg-opacity-30 backdrop-blur-lg shadow-lg py-2 dark:border-b"
            : "py-3"
        }`;

  //Functional component to render each menu item
  const RenderMainMenuItem = ({ menuItem }: { menuItem: MenuItem }) => {
    // If the element contains a sub menu, and the array is more than 0
    // then render the content of sub menu by using the navigationMenuContent tag
    if (menuItem.subMenu && menuItem.subMenu.length > 0) {
      return (
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-[17px]">
            {menuItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-[300px]">
              {menuItem.subMenu.map((subMenuItem) => (
                <ListItem
                  key={subMenuItem.title}
                  title={subMenuItem.title}
                  description={subMenuItem.description}
                  icon={subMenuItem.icon}
                  href={subMenuItem.url || ""}
                />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }

    //Otherwise if it is a simple menu then use the NavigationMenuLink tag
    return (
      <NavigationMenuLink asChild>
        <Link href={menuItem.url}>{menuItem.title}</Link>
      </NavigationMenuLink>
    );
  };

  //Functional component to render the logo
  const RenderNameAndLogo = ({ domain }: { domain: NavBar2Props<T>["domain"] }) => {
  const logo = domain?.logo || <MdElectricBolt size={26} />;
  const name = domain?.name || "GDG on Campus KAIST";
    return (
      <Link href={"/"}>
        <div className="flex justify-center   items-center gap-2 mt-[5px]">
          {logo}
          {typeof name === "string" ? (
            <h1 className="text-2xl font-bold max-md:hidden">{name}</h1>
          ) : (
            <div className="flex justify-center   items-center gap-2 mt-[5px]">
              {name}
            </div>
          )}
        </div>
      </Link>
    );
  };
  //
  //return the main jsx of the component

  if (!isClient) return null;

  return (
    <nav
      {...props}
      className={`   ${
        isSticky
          ? navBarSticklyTailwindCss
          : " flex justify-between   items-center p-6 px-20 "
      } ${className}`}
    >
      {/* Logo  */}
      <RenderNameAndLogo domain={defaultdomain} />
      {/* Navigation menu */}
      <NavigationMenu viewport={false} className="max-lg:hidden mt-2 ">
        <NavigationMenuList>
          {/* home */}
          {defaultNavigationMenu.map((mainMenuItem) => (
            <RenderMainMenuItem
              key={mainMenuItem.title}
              menuItem={mainMenuItem}
            />
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      {/* Mobile Menu */}

      <div>
        <RenderMobileMenu domain={defaultdomain} />
        <div className="flex gap-2 items-center">
          {leftAddon && <div className="max-lg:hidden">{leftAddon}</div>}
          {/* Login Button */}
          <RenderAuthButton
            className={loginClassName}
            isVisible={isLoginVisbile}
            onClick={onLoginClicked}
            text={loginText}
            urlLink={urlLoginUrl}
            variant={loginVariant}
          />
          {/* Register Button */}
          <RenderAuthButton
            className={registerClassName}
            isVisible={isRegisterVisible}
            onClick={onRegisterClicked}
            text={registerText}
            urlLink={urlRegisterUrl}
            variant={registerVariant}
          />
        </div>
      </div>
    </nav>
  );

  function RenderMobileMenu({ domain }: { domain: NavBar2Props<T>["domain"] }) {
    const logo = domain?.logo || <MdElectricBolt size={26} />;
    const name = domain?.name || "GDG on Campus KAIST";
    return (
      <Sheet>
        <SheetTrigger asChild className="hidden max-lg:block">
          <Button variant={"outline"}>
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent className="">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-start gap-2">
              {React.isValidElement(logo)
                ? React.cloneElement(logo as React.ReactElement<any>, {
                    size: 25,
                  })
                : logo}
              {/* <span>{domain.name}</span> */}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-20">
            <Accordion type="single" collapsible>
              {defaultNavigationMenu.map((mainMenuItem) => {
                // If menu item has submenu, render as accordion item
                if (mainMenuItem.subMenu && mainMenuItem.subMenu.length > 0) {
                  return (
                    <AccordionItem
                      key={mainMenuItem.title}
                      value={mainMenuItem.title}
                      className="border-none"
                    >
                      <AccordionTrigger className="text-left font-medium">
                        {mainMenuItem.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-2">
                          {mainMenuItem.subMenu.map((subMenuItem) => (
                            <Link
                              key={subMenuItem.title}
                              href={subMenuItem.url || ""}
                              className=" p-2 flex items-center gap-4 rounded-md hover:bg-accent text-sm"
                            >
                              <div className="text-sm">
                                {React.isValidElement(subMenuItem.icon)
                                  ? React.cloneElement(
                                      subMenuItem.icon as React.ReactElement<any>,
                                      {
                                        size: 17,
                                        className: "text-muted-foreground",
                                      }
                                    )
                                  : subMenuItem.icon}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {subMenuItem.title}
                                </div>
                                {subMenuItem.description && (
                                  <div className="text-muted-foreground text-xs mt-1">
                                    {subMenuItem.description}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                }

                // For simple menu items without submenu, render as regular link
                return (
                  <div key={mainMenuItem.title} className="">
                    <Link
                      href={mainMenuItem.url}
                      className="block py-4 font-medium hover:text-accent-foreground"
                    >
                      {mainMenuItem.title}
                    </Link>
                  </div>
                );
              })}
            </Accordion>

            {/* Login Button */}
            <div className="mt-10">
              <RenderAuthButton
                className={loginClassName}
                isVisible={isLoginVisbile}
                onClick={onLoginClicked}
                text={loginText}
                urlLink={urlLoginUrl}
                variant={loginVariant}
                isInSheet={true}
              />
              {/* Register Button */}
              <RenderAuthButton
                className={registerClassName}
                isVisible={isRegisterVisible}
                onClick={onRegisterClicked}
                text={registerText}
                urlLink={urlRegisterUrl}
                variant={registerVariant}
                isInSheet={true}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
}

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
  return (
    <>
      {isVisible ? (
        <div
          className={`flex items-center space-x-4 ${isInSheet ? "hidden max-lg:flex w-full max-lg:gap-3 max-lg:flex-col" : " block max-lg:hidden"}`}
        >
          {onClick ? (
            <>
              <Button
                onClick={onClick}
                className={`h-10 ${isInSheet && "w-full"} cursor-pointer select-none ${className}`}
                variant={variant}
              >
                <span>{text}</span>
              </Button>
            </>
          ) : (
            <Button
              className={`h-10 ${isInSheet && "w-full mt-5"} cursor-pointer select-none ${className}`}
              variant={variant}
              asChild
            >
              <a className="no-underline" href={urlLink}>
                {text}
              </a>
            </Button>
          )}
        </div>
      ) : (
        <div className="max-lg:hidden"></div>
      )}
    </>
  );
}

function ListItem({
  title,
  description,
  icon,
  children,
  href,
  ...props
}: ListItemProps) {
  console.log(icon);

  return (
    <li {...props}>
      {/* The entire content is clickable, so Link should wrap the main section */}
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block   select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none 
          transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0">{icon && <>{icon}</>}</span>
            <div>
              <h3 className="leading-none font-medium text-[15px]">{title}</h3>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {children && (
            <p className="mt-2 text-muted-foreground line-clamp-2 text-sm leading-snug">
              {children}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

 
