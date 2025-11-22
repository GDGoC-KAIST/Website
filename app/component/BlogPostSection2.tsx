

"use client";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export interface Post {
  id: string;
  title: string;
  summary: string;
  author: { name: string; profileImage?: string };
  published: string;
  url: string;
  image: string;
  tag: string;
}

type SortBy = "name" | "date";
type Orientation = "horizontal" | "vertical";

interface BlogPostSectionProps<T extends Post> {
  tagline?: string;
  heading?: { text: string; headingClassName?: string };
  description?: { text: string; descriptionClassName?: string };
  buttonText?: string;
  buttonUrl?: string;
  posts?: T[];
  sortBy?: SortBy;
  orientation?: Orientation;
  badge?: {
    mainText: string;
    secondText: string;
    className: string;
    isVisible?: boolean;
  };
}

const DEFAULT_POSTS: Post[] = [
  {
    id: "post-1",
    title: "Understanding Server Components in Next.js 14",
    summary:
      "Explore the power of Server Components in Next.js 14 to optimize your app's performance. Learn how they differ from Client Components and when to use them.",
    author: {
      name: "Alex Kim",
      profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    published: "10 Jun 2024",
    url: "/task_forge.png",
    image: "/bolt_stack_image.png",
    tag: "TypeScript",
  },
  {
    id: "post-2",
    title: "A Deep Dive into Edge Functions with Vercel",
    summary:
      "Learn how to deploy lightning-fast Edge Functions using Vercel. Discover use-cases like authentication, A/B testing, and geolocation-based rendering.",
    author: {
      name: "Nina Patel",
      profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    published: "28 May 2024",
    url: "/images/vercel-edge-functions.jpg",
    image: "/bolt_stack_image.png",
    tag: "TypeScript",
  },
  {
    id: "post-3",
    title: "Design Systems that Scale: Tailwind CSS & shadcn/ui",
    summary:
      "Learn how to build a scalable design system using Tailwind CSS and shadcn/ui. Reuse components efficiently while maintaining design consistency.",
    author: {
      name: "Liam Nguyen",
      // profileImage: "https://randomuser.me/api/portraits/men/54.jpg",
    },
    published: "3 Jul 2024",
    url: "/images/design-system.jpg",
    image: "/bolt_stack_image.png",
    tag: "Design Systems",
  },
  {
    id: "post-4",
    title: "Top 7 Mistakes Developers Make with TypeScript",
    summary:
      "Avoid common pitfalls in TypeScript development. From misuse of `any` to improper type inference, this guide will sharpen your TS skills.",
    author: {
      name: "Isabella Ferreira",
      profileImage: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    published: "12 Jul 2024",
    url: "/images/typescript-mistakes.jpg",
    image: "/bolt_stack_image.png",
    tag: "TypeScript",
  },
  {
    id: "post-5",
    title: "Build an AI-Powered App Using OpenAI and LangChain",
    summary:
      "Step-by-step tutorial on building a smart AI app with OpenAI APIs and LangChain. Learn prompt engineering and chaining techniques.",
    author: {
      name: "Jamal Hassan",
      profileImage: "https://randomuser.me/api/portraits/men/91.jpg",
    },
    published: "22 Jun 2024",
    url: "/images/langchain-openai.jpg",
    image: "/bolt_stack_image.png",
    tag: "AI Development",
  },
  {
    id: "post-6",
    title: "How to Secure Your Web App in 2024",
    summary:
      "Discover the latest best practices in web security including HTTPS, CSP, token handling, and dependency auditing to keep your app safe.",
    author: {
      name: "Emily Zhao",
      profileImage: "https://randomuser.me/api/portraits/women/77.jpg",
    },
    published: "7 Jul 2024",
    url: "/images/web-security.jpg",
    image: "/bolt_stack_image.png",
    tag: "Security",
  },
];

function BlogPostSection2<T extends Post>({
  heading,
  description,
  buttonText = "Read more insights",
  buttonUrl = "https://www.devinsights.io/blog",
  posts = DEFAULT_POSTS as T[],
  sortBy = "date",
  orientation = "horizontal",
  badge,
}: BlogPostSectionProps<T>) {
  // Sort posts based on sortBy prop
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "name") {
      return a.title.localeCompare(b.title);
    } else {
      // Sort by date (newest first)
      const dateA = new Date(a.published);
      const dateB = new Date(b.published);
      return dateB.getTime() - dateA.getTime();
    }
  });

  const { text: headingText = "Latest Articles", headingClassName = "" } =
    heading || {};

  const {
    text: descriptionText = "Stay ahead in web development with expert articles on performance optimization, UI/UX strategies, modern frameworks, and real-world project insights. Updated weekly by experienced developers.",
    descriptionClassName = "",
  } = description || {};

  const {
    mainText: badgeMainText = "Trending",
    secondText: badgeSecondText = "Popular Reads This Week",
    className: badgeClassName = "",
    isVisible: isBadgeVisible = true,
  } = badge || {};

  const labels = [...new Set(sortedPosts.map((post) => post.tag))].slice(0, 3);

  // Get grid classes based on orientation
  const getGridClasses = () => {
    if (orientation === "vertical") {
      return "grid gap-6 grid-cols-1 max-w-md justify-items-center";
    } else {
      return " flex flex-wap gap-10 max-xl:flex-col  max-xl:w-full justify-items-center w-full";
    }
  };

  return (
    <section className="py-32" aria-labelledby="blog-heading">
      <div className="container mx-auto flex flex-col items-center gap-16 lg:px-16">
        <header className="text-center">
          {isBadgeVisible && (
            <div className="flex justify-center gap-4 mb-14">
              <div
                className={`bg-primary/10 rounded-full w-fit justify-start p-[6px] items-start flex ${badgeClassName}`}
              >
                <Badge
                  variant={"default"}
                  className="font-normal max-sm:hidden h-6 rounded-full shadow-none"
                >
                  {badgeMainText}
                </Badge>
                <span className="ml-3 mr-1 text-primary max-sm:text-[11px]">
                  {badgeSecondText}
                </span>
              </div>
            </div>
          )}

          <h1
            id="blog-heading"
            className={`mb-3 text-[56px] font-semibold text-pretty md:mb-4 lg:mb-6 lg:max-w-3xl ${headingClassName} `}
          >
            {headingText}
          </h1>
          <p
            className={`mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg ${descriptionClassName}`}
          >
            {descriptionText}
          </p>
          <Button variant="link" className="w-full sm:w-auto" asChild>
            <a href={buttonUrl} target="_blank">
              {buttonText}
              <ArrowRight className="ml-2 size-4" />
            </a>
          </Button>
        </header>

        <div className="w-full flex flex-col items-center px-4">
          <Tabs defaultValue={labels[0]} className="w-full">
            <nav
              className="flex justify-center mb-20"
              aria-label="Blog post categories"
            >
              <TabsList
                className="h-10 items-center justify-center bg-muted p-1 text-muted-foreground 
              rounded-full max-sm:rounded-md max-sm:flex max-sm:flex-col max-sm:h-full max-sm:w-full"
              >
                {labels.length > 1 && (
                  <>
                    {labels.map((label) => (
                      <TabsTrigger
                        key={label}
                        value={label}
                        className="px-10 rounded-full max-sm:w-full max-sm:rounded-md"
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </>
                )}
              </TabsList>
            </nav>

            {labels.map((label) => {
              const filteredPosts = sortedPosts.filter(
                (post) => post.tag === label
              );
              return (
                <TabsContent
                  key={label}
                  value={label}
                  className="bg-transparent flex justify-center"
                >
                  <div className={getGridClasses()}>
                    {filteredPosts
                      .slice(0, orientation === "vertical" ? 5 : 3)
                      .map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          orientation={orientation}
                        />
                      ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </section>
  );
}

interface PostCardProp {
  post: Post;
  orientation?: Orientation;
}

const PostCard: React.FC<PostCardProp> = ({
  post,
  orientation = "horizontal",
  ...props
}) => {
  const isVertical = orientation === "vertical";
  const {
    author: { profileImage },
  } = post;

  const avatarImage = profileImage ?? "https://github.com/shadcn.png";

  return (
    <article
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl shadow-lg",
        isVertical
          ? "h-[200px] w-full"
          : "h-[410px] w-[410px] max-xl:w-full max-md:h-[550px]"
      )}
      {...props}
    >
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
      >
        {/* Background Image */}
        <img
          src={post.image}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Content that appears on hover (desktop) or always visible (mobile) */}
        <div
          className={cn(
            "absolute left-0 right-0 flex flex-col justify-end p-6 text-white",
            isVertical
              ? "bottom-[-80px] h-2/3 translate-y-full md:group-hover:translate-y-[-79px] md:transition-transform md:duration-500 md:ease-in-out max-md:translate-y-0 max-md:bottom-0"
              : "bottom-[-100px] h-1/2 translate-y-full md:group-hover:translate-y-[-99px] md:transition-transform md:duration-500 md:ease-in-out max-md:translate-y-0 max-md:bottom-0"
          )}
        >
          <h3 className={cn("font-bold", isVertical ? "text-lg" : "text-2xl")}>
            {post.title}
          </h3>
          <p
            className={cn(
              "mt-2 opacity-0 transition-opacity duration-300 delay-200 group-hover:opacity-100 max-md:opacity-100",
              isVertical ? "text-sm" : "text-base"
            )}
          >
            {post.summary}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <Avatar className={isVertical ? "h-6 w-6" : ""}>
              <AvatarImage
                src={`${avatarImage}`}
                alt={`Avatar of ${post.author.name}`}
              />
            </Avatar>
            <div className="flex flex-col">
              <span className={cn("font-medium", isVertical ? "text-sm" : "")}>
                {post.author.name}
              </span>
              <time
                dateTime={new Date(post.published).toISOString()}
                className={isVertical ? "text-xs" : ""}
              >
                {post.published}
              </time>
            </div>
          </div>
        </div>
      </a>
    </article>
  );
};

export default BlogPostSection2;


