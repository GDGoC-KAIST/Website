

"use client";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaGooglePlusG, FaPencilAlt, FaWordpress } from "react-icons/fa";
import { MdClose, MdSearch } from "react-icons/md";

interface TechIcon {
  icon: ReactNode;
  name: string;
  className?: string;
}

type ButtonVariant = ButtonProps["variant"];

interface ButtonType {
  text: string;
  className?: string;
}

export interface Post {
  id: string;
  title: string;
  createdAt: string;
  subtitle: string;
  icons?: React.JSX.Element[];
  description: string;
  images?: {
    src: string;
    alt: string;
  }[];
  category: string;
  primaryButton?: {
    variant?: ButtonVariant;
    text: string;
    className?: string;
    buttonUrl?: string;
    onClickButton?: () => void;
  };
  secondaryButton?: {
    variant?: ButtonVariant;
    text: string;
    className?: string;
    buttonUrl?: string;
    onClickButton?: () => void;
  };
}

interface PostsPageProps<T extends Post> {
  mainHeading?: { text: string; className?: string };
  subHeading?: { text: string; className?: string };
  techIcons?: TechIcon[];
  primaryButton?: ButtonType & { isVisible?: boolean };
  secondaryButton?: ButtonType;
  search?: {
    isVisible?: boolean;
    inputValue: string;
    setInputValue: (value: string) => void;
    placeholder?: string;
    className?: string;
    postsNotFoundText?: string;
  };
  showFilterTabs?: boolean;
  posts?: T[];
  pagination?: {
    isVisible?: boolean;
    postsPerPage: number;
    paginationArray?: number[];
  };
  isLoading?: boolean;
  skeletonLength?: number;
}

// Default technology icons to display if none are provided
const DEFAULT_TECH_ICONS: TechIcon[] = [
  { icon: <FaGooglePlusG size={22} />, name: "Google Plus" },
  { icon: <FaWordpress size={20} />, name: "Wordpress" },
];
const DEFAULT_PAGINATION_ARRAY = [1, 2, 5, 10, 20];
//
export const DEFULT_POSTS: Post[] = [
  {
    id: "post-1",
    title: "Mastering SEO for Bloggers",
    createdAt: "2024-07-25T09:00:00Z",
    subtitle: "Boost Your Blog's Visibility and Organic Traffic",
    icons: [<FaGooglePlusG size={20} />],
    description:
      "A comprehensive guide covering essential SEO strategies for bloggers, including keyword research, on-page optimization, link building, and technical SEO tips to rank higher.",
    images: [
      { src: "/bolt_stack_image.jpg", alt: "SEO analysis dashboard" },
      { src: "/bolt_stack_image.jpg", alt: "Keyword research tools" },
      { src: "/bolt_stack_image.jpg", alt: "Content optimization example" },
    ],
    category: "SEO",
    primaryButton: {
      variant: "default",
      text: "Read Full Article",
      className: "bg-blue-600 hover:bg-blue-700 text-white",
      onClickButton: () => console.log("Reading SEO Blog Post"),
    },
    secondaryButton: {
      text: "Download Checklist",
      variant: "outline",
      className: "border-blue-600 text-blue-600 hover:bg-blue-50",
      onClickButton: () => console.log("Downloading SEO Checklist"),
    },
  },
  {
    id: "post-2",
    title: "Content Creation Workflow",
    createdAt: "2024-07-20T11:30:00Z",
    subtitle: "Streamline Your Blogging Process from Idea to Publish",
    icons: [<FaPencilAlt size={20} />],
    description:
      "Discover an efficient workflow for content creation that helps you generate ideas, write compelling drafts, edit effectively, and schedule your posts for consistency.",
    images: [
      { src: "/bolt_stack_image.jpg", alt: "Mind mapping for ideas" },
      { src: "/bolt_stack_image.jpg", alt: "Writing on a laptop" },
      { src: "/bolt_stack_image.jpg", alt: "Content calendar" },
    ],
    category: "Content Strategy",
    primaryButton: {
      variant: "default",
      text: "Explore Workflow",
      className: "bg-green-600 hover:bg-green-700 text-white",
      onClickButton: () => console.log("Exploring Content Workflow"),
    },
    secondaryButton: {
      variant: "outline",
      text: "Get Template",
      className: "border-green-600 text-green-600 hover:bg-green-50",
      onClickButton: () => console.log("Getting Workflow Template"),
    },
  },
  {
    id: "post-3",
    title: "Choosing the Right Blogging Platform",
    createdAt: "2024-07-18T15:00:00Z",
    subtitle: "WordPress, Medium, Substack, or Custom? Find Your Fit",
    icons: [<FaWordpress size={20} />],
    description:
      "An in-depth comparison of popular blogging platforms, highlighting their pros and cons regarding flexibility, monetization, ease of use, and community features.",
    images: [
      {
        src: "/bolt_stack_image.jpg",
        alt: "Laptop with various platform logos",
      },
      { src: "/bolt_stack_image.jpg", alt: "WordPress dashboard" },
      { src: "/bolt_stack_image.jpg", alt: "Substack newsletter example" },
    ],
    category: "Platform Choice",
    primaryButton: {
      variant: "default",
      text: "Read Comparison",
      className: "bg-purple-600 hover:bg-purple-700 text-white",
      onClickButton: () => console.log("Reading Platform Comparison"),
    },
    secondaryButton: {
      variant: "outline",
      text: "Ask a Question",
      className: "border-purple-600 text-purple-600 hover:bg-purple-50",
      onClickButton: () => console.log("Asking Platform Question"),
    },
  },
  {
    id: "post-4",

    title: "Monetizing Your Blog: Beyond Ads",
    createdAt: "2024-07-10T10:00:00Z",
    subtitle: "Diverse Income Streams for Successful Bloggers",
    // icons: [<FaPenNib size={20} />, <FaPencilAlt size={20} />],
    description:
      "Explore various monetization strategies for your blog, from affiliate marketing and sponsored content to selling digital products and offering consulting services. Diversify your revenue!",
    images: [
      { src: "/bolt_stack_image.jpg", alt: "Money bag icon" },
      { src: "/bolt_stack_image.jpg", alt: "Affiliate marketing chart" },
      { src: "/bolt_stack_image.jpg", alt: "Digital product sales" },
    ],
    category: "Monetization",
    primaryButton: {
      variant: "default",
      text: "Learn More",
      className: "bg-orange-600 hover:bg-orange-700 text-white",
      onClickButton: () => console.log("Learning Monetization Strategies"),
    },
    secondaryButton: {
      variant: "outline",
      text: "Start Earning",
      className: "border-orange-600 text-orange-600 hover:bg-orange-50",
      onClickButton: () => console.log("Starting Earning on Blog"),
    },
  },
  {
    id: "post-5",

    title: "Engaging Your Audience: Community Building",
    createdAt: "2024-07-05T13:45:00Z",
    subtitle: "Strategies for Fostering a Loyal Blog Community",
    // icons: [<FaPencilAlt size={20} />, <FaMegaport size={20} />],
    description:
      "Build a thriving community around your blog by implementing interactive elements, encouraging comments, running Q&A sessions, and leveraging social media effectively.",
    images: [
      { src: "/bolt_stack_image.jpg", alt: "People engaging online" },
      { src: "/bolt_stack_image.jpg", alt: "Comment section example" },
      { src: "/bolt_stack_image.jpg", alt: "Social media icons" },
    ],
    category: "Analytics",
    primaryButton: {
      variant: "default",
      text: "Read Tips",
      className: "bg-red-600 hover:bg-red-700 text-white",
      onClickButton: () => console.log("Reading Audience Engagement Tips"),
    },
    secondaryButton: {
      variant: "outline",
      text: "Join Community",
      className: "border-red-600 text-red-600 hover:bg-red-50",
      onClickButton: () => console.log("Joining Blog Community"),
    },
  },
  {
    id: "post-6",

    title: "Analytics for Bloggers: Understanding Your Data",
    createdAt: "2024-06-28T16:00:00Z",
    subtitle: "Leverage Google Analytics to Improve Blog Performance",
    icons: [<FaGooglePlusG size={20} />],
    description:
      "Learn how to interpret blog analytics to understand reader behavior, identify popular content, track traffic sources, and make data-driven decisions to grow your blog.",
    images: [
      { src: "/bolt_stack_image.jpg", alt: "Analytics dashboard" },
      { src: "/bolt_stack_image.jpg", alt: "Traffic source breakdown" },
      { src: "/bolt_stack_image.jpg", alt: "Conversion rate optimization" },
    ],
    category: "Analytics",
    primaryButton: {
      variant: "default",
      text: "Dive into Data",
      className: "bg-teal-600 hover:bg-teal-700 text-white",
      onClickButton: () => console.log("Diving into Blog Analytics"),
    },
    secondaryButton: {
      variant: "outline",
      text: "Free Webinar",
      className: "border-teal-600 text-teal-600 hover:bg-teal-50",
      onClickButton: () => console.log("Registering for Analytics Webinar"),
    },
  },
];

function PostsPage({
  mainHeading,
  subHeading,
  techIcons,
  primaryButton,
  secondaryButton,
  search,
  showFilterTabs = true,
  posts = DEFULT_POSTS,
  pagination,
  isLoading = false,
  skeletonLength = 3,
}: PostsPageProps<Post>) {
  // Destructure and set default values for mainHeading
  const {
    text: mainHeadingText = "Insights, guides, and stories for every blogger.",
    className: mainHeadingClassName = "",
  } = mainHeading || {};

  // Destructure and set default values for subHeading
  const {
    text: subHeadingText = "Dive into expert articles on SEO, content creation, monetization, and community building. Whether you're a seasoned pro or just starting, find the knowledge to elevate your blog.",
    className: subHeadingClassName = "",
  } = subHeading || {};

  // Use provided techIcons or fall back to defaults
  const finalTechIcons = techIcons || DEFAULT_TECH_ICONS;

  //Default primary button
  const {
    text: primaryButtonText = "Browse Posts",
    className: primaryClassName = "",
    isVisible: isPrimaryButtonVisible = true,
  } = primaryButton || {};

  const {
    isVisible: isSearchVisible = true,
    placeholder: searchPlaceHolder = "Search",
    className: searchClassName = "",
    postsNotFoundText = "No post match your search...",
  } = search || {};

  const [localSearchInput, setLocalSearchInput] = useState("");
  const {
    isVisible: isPaginationVisible = true,
    postsPerPage = 2,
    paginationArray = DEFAULT_PAGINATION_ARRAY,
  } = pagination || {};

  const isControlledSearchInput = search !== undefined;

  const searchInputValue = isControlledSearchInput
    ? search?.inputValue
    : localSearchInput;

  const inputRef = useRef<HTMLInputElement>(null);
  const postsSectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToPosts = useCallback(() => {
    if (postsSectionRef.current) {
      postsSectionRef.current.scrollIntoView({
        behavior: "smooth", // For a smooth scrolling animation
        block: "start", // Scrolls to the top of the element
      });
    }
  }, []);

  const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const value = e.target.value;

      if (search) {
        search.setInputValue(value);
      } else {
        setLocalSearchInput(value);
      }
    }, []);

  const clearInputText = useCallback(() => {
    if (search) {
      search.setInputValue("");
    } else {
      setLocalSearchInput("");
    }
  }, []);

  return (
    <article className="max-w-7xl mx-auto px-4  ">
      {/* Main heading section */}
      <header>
        <h1
          className={`text-3xl md:text-4xl lg:text-5xl font-bold w-full lg:w-1/2 ${mainHeadingClassName}`}
        >
          {mainHeadingText}
        </h1>

        {/* Technology icons list */}
        <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-4 md:gap-7">
          {finalTechIcons.map((item, index) => (
            <figure
              key={index}
              className={`flex gap-1 items-center opacity-70 ${item.className}`}
              aria-label={`Technology: ${item.name}`}
            >
              {item.icon}
              <figcaption className="sr-only">{item.name}</figcaption>
              <span aria-hidden="true">{item.name}</span>
            </figure>
          ))}
        </div>
      </header>

      {/* Subheading section */}
      <section className="mt-8 md:mt-10">
        <h2
          className={`text-base opacity-60 w-full lg:w-1/2 ${subHeadingClassName}`}
        >
          {subHeadingText}
        </h2>
      </section>

      {/* Buttons */}
      {/*  */}
      {/* Primary Button */}
      <div className="mt-10 flex gap-2 items-center">
        {isPrimaryButtonVisible && (
          <Button
            onClick={handleScrollToPosts}
            className={`${primaryClassName}`}
          >
            {primaryButtonText}
          </Button>
        )}

        {secondaryButton && (
          <Button
            variant={"outline"}
            className={`${secondaryButton.className}`}
          >
            {secondaryButton.text}
          </Button>
        )}
      </div>

      {/* Separator */}
      <div ref={postsSectionRef} className="scroll-mt-20">
        <Separator className="w-full h-[1px] mt-12 md:mt-20" />
      </div>

      <div>
        {!isLoading ? (
          <PostsList
            searchProp={{
              searchInputValue,
              handleSearchChange,
              isVisible: isSearchVisible,
              placeholder: searchPlaceHolder,
              searchClassName: searchClassName,
              inputRef,
              clearInputText,
              postsNotFoundText,
            }}
            handleScrollToPosts={handleScrollToPosts}
            showFilterBar={showFilterTabs}
            posts={posts}
            pagination={{
              isVisible: isPaginationVisible,
              postsPerPage: postsPerPage,
              paginationArray: paginationArray,
            }}
          />
        ) : (
          <div className="mt-20">
            {Array.from({ length: skeletonLength }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default PostsPage;

const PostsList = ({
  searchProp: {
    searchInputValue,
    handleSearchChange,
    isVisible: isSearchVisible,
    placeholder: searchPlaceholder,
    searchClassName,
    inputRef,
    clearInputText,
    postsNotFoundText,
  },
  showFilterBar,
  posts,
  handleScrollToPosts,
  pagination,
}: {
  searchProp: {
    searchInputValue: string;
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isVisible: boolean;
    placeholder: string;
    searchClassName: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    clearInputText: () => void;
    postsNotFoundText: string;
  };
  showFilterBar: boolean;
  handleScrollToPosts: () => void;
  posts: Post[];
  pagination: NonNullable<PostsPageProps<Post>["pagination"]>;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(1);

  useEffect(() => {
    setProductsPerPage(pagination.postsPerPage);
  }, []);

  const allCategories = posts.map((post) => post.category);

  // Then create a map of category counts
  const categoryCounts = allCategories.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const [categoriesWithCounts, setCategoriesWithCount] = useState([
    { name: "All", count: posts.length, isSelected: true },
    ...Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      isSelected: false,
    })),
  ]);

  const selectedCategory =
    categoriesWithCounts.find((item) => item.isSelected)?.name || "All";

  const filteredPosts = useMemo(() => {
    let products = sortPostsByDateNewestToOldest(posts);

    // 1. Apply category filter
    if (selectedCategory !== "All") {
      products = products.filter(
        (product) => product.category === selectedCategory
      );
    }

    // 2. Apply search filter on the result of the category filter
    if (searchInputValue) {
      products = products.filter((product) =>
        product.title.toLowerCase().includes(searchInputValue.toLowerCase())
      );
    }

    return products;
  }, [searchInputValue, selectedCategory]);

  // Handle category selection
  const handleCategorySelect = useCallback((selectedCategory: string) => {
    setCategoriesWithCount((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        isSelected: category.name === selectedCategory,
      }))
    );

    setCurrentPage(1);
  }, []);

  // Handle change for the new dropdown
  const handleItemsPerPageChange = useCallback((value: string) => {
    setProductsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 to avoid being on a non-existent page
  }, []);

  // 2. CALCULATE CURRENT PRODUCTS AND TOTAL PAGES 🧮
  const paginationData = useMemo(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredPosts.slice(
      indexOfFirstProduct,
      indexOfLastProduct
    );
    const totalPages = Math.ceil(filteredPosts.length / productsPerPage);

    return {
      currentProducts,
      totalPages,
      indexOfFirstProduct,
      indexOfLastProduct,
    };
  }, [currentPage, productsPerPage, filteredPosts]);

  const paginationItems = useMemo(
    () => generatePaginationItems(currentPage, paginationData.totalPages),
    [currentPage, paginationData.totalPages]
  );

  const getImageClasses = useCallback((index: number) => {
    const baseClasses = "relative  aspect-square overflow-hidden shadow-lg ";

    switch (index) {
      case 0:
        // First image - always visible, full width on mobile, fixed width on larger screens
        return `${baseClasses} rounded-lg block w-full sm:w-60`;
      case 1:
        // Second image - hidden on mobile, fixed width on larger screens
        return `${baseClasses} rounded-md hidden sm:block w-60`;
      case 2:
        // Third image - hidden on screens smaller than 1280px
        return `${baseClasses} rounded-md hidden xl:block w-60`;
      default:
        // Additional images - hidden by default
        return `${baseClasses} rounded-md hidden w-60`;
    }
  }, []);

  const getImageSizes = useCallback((index: number) => {
    switch (index) {
      case 0:
        return "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw";
      case 1:
        return "(max-width: 1280px) 50vw, 33vw";
      case 2:
        return "33vw";
      default:
        return "33vw";
    }
  }, []);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearchChange(e);
      //select the all category so that the search covers all the elements
      setCategoriesWithCount((prev) => {
        return prev.map((item) => ({
          ...item,
          isSelected: item.name === "All" ? true : false,
        }));
      });
      setCurrentPage(1);
    },
    [handleSearchChange, setCategoriesWithCount]
  );

  return (
    <section className="mt-14 ">
      {/* filter buttons + Search */}

      <div className="flex justify-between items-start mb-20   max-lg:flex-col  max-lg:gap-10 ">
        {showFilterBar ? (
          <>
            {posts.length >= 2 ? (
              <div className="  flex items-center gap-2 flex-wrap w-1/2 max-lg:w-full ">
                {categoriesWithCounts.map((category) => (
                  <Button
                    key={category.name}
                    variant={"outline"}
                    className={`shadow-none ${
                      category.isSelected
                        ? "opacity-100 bg-neutral-100 dark:bg-neutral-800 "
                        : "opacity-60"
                    }`}
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    <span>{category.name}</span>
                    <span className="bg-neutral-200 dark:bg-neutral-700 size-5   rounded-full text-[10px]">
                      {category.count}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div></div>
            )}
          </>
        ) : (
          <div></div>
        )}

        {isSearchVisible && (
          <div className="relative max-sm:mt-6 max-lg:w-full">
            <MdSearch size={20} className="absolute top-2 left-3 opacity-60" />
            {searchInputValue.trim().length > 0 && (
              <MdClose
                onClick={() => {
                  clearInputText();
                  inputRef.current?.focus();
                }}
                size={15}
                className="absolute right-3 top-3 cursor-pointer"
              />
            )}
            <Input
              ref={inputRef}
              value={searchInputValue}
              onChange={handleSearchInputChange}
              placeholder={`${searchPlaceholder}`}
              className={`pl-10 ${searchClassName}`}
            />
          </div>
        )}
      </div>

      <div>
        {paginationData.currentProducts.length === 0 ? (
          <div className="py-32 text-center">
            <h3 className="text-lg font-medium text-gray-500">
              {postsNotFoundText}
            </h3>
          </div>
        ) : (
          <>
            {paginationData.currentProducts.map((product) => (
              <article
                key={product.id}
                className="gap-10 mb-36 items-start flex justify-between max-lg:flex-col"
              >
                {/* Left Side - Product Info */}
                <div className="flex flex-col flex-shrink-0  w-[23%] max-lg:w-full">
                  {/* Product Header */}
                  <header>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold hover:text-primary select-none cursor-pointer transition-colors">
                        {product.title}
                      </h2>
                    </div>
                    <p className="text-sm opacity-70 font-medium mt-1">
                      {product.subtitle}
                    </p>
                  </header>

                  {/* Technology Icons */}
                  {product.icons && product.icons.length > 0 ? (
                    <div className="mt-3 mb-5 flex flex-wrap items-center gap-3">
                      {product.icons.map((icon, index) => (
                        <figure
                          key={index}
                          className="flex gap-1 items-center opacity-70"
                        >
                          {icon}
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <div className="h-10"></div>
                  )}

                  {/* Product Description */}
                  <p className="text-sm opacity-90 mb-4">
                    {product.description}
                  </p>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    {product.primaryButton && (
                      <Button
                        className={product.primaryButton.className}
                        // onClick={product.primaryButton.onClickButton}
                        variant={product.primaryButton.variant}
                      >
                        <a href={product.primaryButton.buttonUrl}>
                          {product.primaryButton.text}
                        </a>
                      </Button>
                    )}

                    {product.secondaryButton && (
                      <Button
                        className={product.secondaryButton.className}
                        // onClick={product.secondaryButton.onClickButton}
                        variant={product.secondaryButton.variant}
                      >
                        <a href={`${product.secondaryButton.buttonUrl}`}>
                          {product.secondaryButton.text}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right Side - Product Images */}
                <div className="flex-1 flex justify-end max-[650px]:w-full max-[650px]:justify-center">
                  {product.images && product.images.length > 0 && (
                    <div className="gap-4 flex flex-wrap justify-end max-[650px]:justify-center max-[650px]:w-full">
                      {product.images.map((image, index) => (
                        <div key={index} className={getImageClasses(index)}>
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="  shadow-md"
                            sizes={getImageSizes(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </>
        )}
      </div>
      {/* 4. RENDER PAGINATION CONTROLS 🔘 */}
      {pagination.isVisible && (
        <div className="flex justify-between items-center max-sm:justify-center">
          {paginationData.totalPages > 1 ? (
            <div className="flex   items-center w-full max-sm:justify-center">
              {/* Left Side: Navigation Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    handleScrollToPosts();
                  }}
                  disabled={currentPage === 1}
                  className="font-bold"
                >
                  Previous
                </Button>

                {/* Numbered Page Buttons */}
                {paginationItems.map((item, index) =>
                  typeof item === "number" ? (
                    <Button
                      key={index}
                      onClick={() => {
                        setCurrentPage(item);
                        handleScrollToPosts();
                      }}
                      variant={currentPage === item ? "outline" : "ghost"}
                      size="sm"
                      className={
                        currentPage === item
                          ? "bg-neutral-100 dark:bg-neutral-700"
                          : ""
                      }
                    >
                      {item}
                    </Button>
                  ) : (
                    <span key={index} className="px-2 py-2 text-sm">
                      ...
                    </span>
                  )
                )}

                {/* Next Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    handleScrollToPosts();
                  }}
                  disabled={currentPage === paginationData.totalPages}
                  className=" font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div></div>
          )}
          {/* Right Side: Items Per Page Dropdown */}
          <div className="flex items-center justify-end gap-2 w-[30%] max-sm:hidden">
            <span className="text-[12px] text-gray-500 font-bold">
              Total Pages
            </span>
            <select
              disabled={filteredPosts.length === 0}
              className="border rounded-md px-3 py-2 text-sm bg-background shadow-sm"
              value={productsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
            >
              {pagination.paginationArray?.map((item) => (
                <option key={item} value={`${item}`}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
};

const ProductSkeleton: React.FC = () => {
  // These mimic your getImageClasses and getImageSizes logic for skeleton dimensions
  // For simplicity, we'll use fixed dimensions that approximate the layout.
  const getImageClasses = (index: number) => {
    const baseClasses = "relative aspect-square overflow-hidden ";
    switch (index) {
      case 0:
        return `${baseClasses} rounded-lg block w-full sm:w-60`; // Main image
      case 1:
        return `${baseClasses} rounded-md hidden sm:block w-60`; // Second image
      case 2:
        return `${baseClasses} rounded-md hidden xl:block w-60`; // Third image
      default:
        return `${baseClasses} rounded-md hidden w-60`; // Additional hidden images
    }
  };

  return (
    <article className="gap-10 mb-36 items-start flex justify-between max-lg:flex-col animate-pulse">
      {/* Left Side - Product Info Skeleton */}
      <div className="flex flex-col flex-shrink-0 w-[23%] max-lg:w-full">
        {/* Product Header Skeleton */}
        <header>
          <Skeleton className="h-8 w-3/4 mb-2" /> {/* Title */}
          <Skeleton className="h-4 w-full mb-4" /> {/* Subtitle */}
        </header>

        {/* Technology Icons Skeleton */}
        <div className="mt-3 mb-5 flex flex-wrap items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon 1 */}
          <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon 2 */}
          <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon 3 */}
        </div>

        {/* Product Description Skeleton */}
        <div className="text-sm opacity-90 mb-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[70%]" />
        </div>

        {/* Buttons Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Primary Button */}
          <Skeleton className="h-10 w-28 rounded-md" /> {/* Secondary Button */}
        </div>
      </div>

      {/* Right Side - Product Images Skeleton */}
      <div className="flex-1 flex justify-end max-[650px]:w-full max-[650px]:justify-center">
        <div className="gap-4 flex flex-wrap justify-end max-[650px]:justify-center max-[650px]:w-full">
          {/* Mimic the image layout with skeletons */}
          <Skeleton className="block w-full sm:w-60 aspect-square rounded-lg" />{" "}
          {/* Main image */}
          <Skeleton className="hidden sm:block w-60 aspect-square rounded-md" />{" "}
          {/* Second image */}
          <Skeleton className="hidden xl:block w-60 aspect-square rounded-md" />{" "}
          {/* Third image */}
        </div>
      </div>
    </article>
  );
};

export const sortPostsByDateNewestToOldest = (posts: Post[]): Post[] => {
  // Create a shallow copy of the array to avoid mutating the original array
  const sortedPosts = [...posts];

  sortedPosts.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    // For newest to oldest, we want to subtract dateA from dateB.
    // If dateB is newer (larger timestamp), the result will be positive,
    // placing b before a.
    return dateA.getTime() - dateB.getTime();
  });

  return sortedPosts;
};

// Add this helper function inside your ProductsList component
const generatePaginationItems = (currentPage: number, totalPages: number) => {
  // If there are 7 or fewer pages, show all of them
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is near the beginning
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  // If the current page is near the end
  if (currentPage > totalPages - 4) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // If the current page is in the middle
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};


