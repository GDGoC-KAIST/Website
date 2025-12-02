
"use client";

import React, {ReactNode, useState} from "react";
import {ChevronDown} from "lucide-react";
import {Project, Seminar} from "@/lib/types";

interface AccordionItem {
  id: string;
  title: { text: string; className?: string };
  content: { text: string; className?: string };
}

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  className?: string;
  imageFitOptions?: "object-contain" | "object-cover" | "object-fill ";
}

export interface SeminarWithImage extends Seminar {
  coverImageUrl?: string;
}

interface FeatureSection7Props {
  mainColor?: string;
  className?: string;
  sectionId?: string;
  mainHeading?: {text: string | ReactNode; className?: string};
  subHeading?: {text: string; className?: string};
  accordionItems?: AccordionItem[];
  accordionPosition?: "left" | "right";
  images?: ImageItem[];
  recentProjects?: Project[];
  recentSeminars?: SeminarWithImage[];
}

const DEFAULT_ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: "strategy-and-planning",
    title: {
      text: "Strategy and Planning",
    },
    content: {
      text: "Our strategic planning services help you define and achieve your long-term business goals. We work with you to analyze market trends, identify opportunities, and create a clear roadmap for success. With our data-driven approach, your business can navigate challenges and maintain a competitive edge.",
    },
  },
  {
    id: "financial-advisory",
    title: { text: "Financial Advisory" },
    content: {
      text: "Our financial experts provide tailored advice to optimize your financial health. From investment strategies to risk management and capital raising, we offer comprehensive solutions that empower you to make informed decisions and secure your financial future.",
    },
  },
  {
    id: "technology-solutions",
    title: { text: "Technology Solutions" },
    content: {
      text: "We deliver innovative technology solutions designed to boost your operational efficiency. Our services range from custom software development and system integration to cloud computing and cybersecurity, ensuring your business stays agile and secure in the digital landscape.",
    },
  },
  {
    id: "organizational-development",
    title: { text: "Organizational Development" },
    content: {
      text: "We help you build a high-performing organization by focusing on talent management, leadership training, and corporate culture. Our solutions are designed to enhance employee engagement, streamline workflows, and foster a dynamic and productive work environment.",
    },
  },
];

const DEFAULT_IMAGES: ImageItem[] = [
  {
    id: "mobile-banking",
    src: "https://images.unsplash.com/photo-1537511446984-935f663eb1f4?q=80&w=870",
    alt: "Mobile Banking App",
  },
  {
    id: "business-meeting",
    src: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=1032",
    alt: "Business Meeting",
  },
  {
    id: "professional",
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=871",
    alt: "Banking Professional",
  },
];

const FeatureSection7: React.FC<FeatureSection7Props> = ({
  mainColor,
  className = "",
  sectionId = "",
  mainHeading = {
    text: (
      <h1
        className={`text-4xl  md:text-5xl lg:text-6xl mx-auto max-w-5xl text-center font-light leading-tight mb-6 `}
      >
        <span>Your Partner for Business</span>
        <span className="pl-3 text-primary">Excellence</span>
      </h1>
    ),
  },
  subHeading = {
    text: "We are a trusted business consulting firm dedicated to helping companies of all sizes achieve their full potential. Our mission is to provide expert guidance and innovative solutions that drive growth, improve efficiency, and ensure long-term sustainability.",
  },
  accordionItems = DEFAULT_ACCORDION_ITEMS,
  images = DEFAULT_IMAGES,
  accordionPosition = "left",
  recentProjects,
  recentSeminars,
}) => {
  const {text: titleText, className: titleClassName = ""} = mainHeading;
  const {text: descriptionText, className: descriptionClassName = ""} =
    subHeading;

  const fallbackAccordionItems = accordionItems;
  const fallbackImages = images;

  const hasSeminarData =
    Array.isArray(recentSeminars) && recentSeminars.length > 0;
  const hasProjectData =
    Array.isArray(recentProjects) && recentProjects.length > 0;
  const hasCustomAccordion = Array.isArray(accordionItems) && accordionItems.length > 0;

  const fallbackImageSrc = fallbackImages[0]?.src || "/gdgoc_icon.png";

  const seminarAccordionItems: AccordionItem[] = hasCustomAccordion
    ? fallbackAccordionItems
    : hasSeminarData
      ? recentSeminars!.map((seminar) => ({
        id: `seminar-${seminar.id}`,
        title: {text: seminar.title},
        content: {text: seminar.summary},
      }))
      : fallbackAccordionItems;

  const projectAccordionItems: AccordionItem[] = hasCustomAccordion
    ? fallbackAccordionItems
    : hasProjectData
      ? recentProjects!.map((project) => ({
        id: `project-${project.id}`,
        title: {text: project.title},
        content: {text: project.summary || project.description || ""},
      }))
      : fallbackAccordionItems;

  const seminarImages: ImageItem[] = hasCustomAccordion
    ? fallbackImages
    : hasSeminarData
      ? recentSeminars!.map((seminar, index) => ({
        id: `seminar-image-${seminar.id}-${index}`,
        src:
          seminar.coverImageUrl ||
          fallbackImages[index % fallbackImages.length]?.src ||
          fallbackImageSrc,
        alt: seminar.title,
        imageFitOptions: "object-cover",
      }))
      : fallbackImages;

  const projectImages: ImageItem[] = hasCustomAccordion
    ? fallbackImages
    : hasProjectData
      ? recentProjects!.map((project, index) => ({
        id: `project-image-${project.id}-${index}`,
        src:
          project.thumbnailUrl ||
          fallbackImages[index % fallbackImages.length]?.src ||
          fallbackImageSrc,
        alt: project.title,
        imageFitOptions: "object-cover",
      }))
      : fallbackImages;

  const initialTab: "seminars" | "projects" = hasCustomAccordion
    ? "seminars"
    : hasSeminarData
      ? "seminars"
      : hasProjectData
        ? "projects"
        : "seminars";

  const initialAccordionItems = hasCustomAccordion
    ? fallbackAccordionItems
    : initialTab === "seminars" ? seminarAccordionItems : projectAccordionItems;

  const [activeTab, setActiveTab] = useState<"seminars" | "projects">(
    initialTab
  );
  const [openAccordion, setOpenAccordion] = useState<string | null>(
    initialAccordionItems[0]?.id || null
  );

  const activeAccordionItems = hasCustomAccordion
    ? fallbackAccordionItems
    : activeTab === "seminars" ? seminarAccordionItems : projectAccordionItems;
  const activeImages = hasCustomAccordion
    ? fallbackImages
    : activeTab === "seminars" ? seminarImages : projectImages;

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleTabChange = (tab: "seminars" | "projects") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const nextItems =
      tab === "seminars" ? seminarAccordionItems : projectAccordionItems;
    setOpenAccordion(nextItems[0]?.id || null);
  };

  const colorStyle = mainColor ? {color: mainColor} : {};
  const bgColorStyle = mainColor ? {backgroundColor: mainColor} : {};

  // Define the Accordion and Image components as separate variables
  const AccordionComponent = (
    <div className="space-y-1 min-h-[400px]  ">
      <div className="space-y-1">
        {activeAccordionItems.map((item) => (
          <div key={item.id} className="relative">
            {/* Vertical Line */}
            <div
              style={openAccordion === item.id ? bgColorStyle : {}}
              className={`absolute top-0 w-1 ${
                !mainColor ? "bg-primary" : ""
              } transition-all duration-500 ease-in-out ${
                openAccordion === item.id
                  ? "h-full opacity-100"
                  : "h-12 opacity-30"
              } ${accordionPosition === "left" ? "left-0" : "right-0"}`}
            />

            {/* Accordion Item */}
            <div
              className={`border-b border-gray-100 last:border-b-0 ${
                accordionPosition === "left" ? "pl-6" : "pr-6"
              }`}
            >
              <button
                onClick={() => toggleAccordion(item.id)}
                className="w-full py-4 flex items-center justify-between text-left transition-colors duration-200"
              >
                <span
                  style={openAccordion === item.id ? colorStyle : {}}
                  className={`text-2xl font-semibold transition-colors duration-200 ${
                    !mainColor && openAccordion === item.id
                      ? "text-primary"
                      : ""
                  } ${!mainColor && openAccordion !== item.id ? "opacity-55" : ""} ${
                    item.title.className || ""
                  }`}
                >
                  {item.title.text}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    openAccordion === item.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Accordion Content */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openAccordion === item.id ? "max-h-96 pb-4" : "max-h-0"
                }`}
              >
                <p
                  className={`opacity-60 leading-relaxed ${
                    item.content.className || ""
                  }`}
                >
                  {item.content.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ImageGridComponent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:grid-rows-2 gap-4 h-[500px] max-lg:h-[800px] max-lg:pt-20">
      {activeImages.map((image, index) => (
        <div
          key={image.id}
          className={`justify-content rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300
            ${index === 0 ? "lg:col-start-1 lg:row-start-1" : ""}
            ${index === 1 ? "lg:col-start-1 lg:row-start-2" : ""}
            ${index === 2 ? "lg:col-start-2 lg:row-span-2 " : ""}
          `}
        >
          <img
            src={image.src}
            alt={image.alt}
            className={`w-full h-full justify-content rounded-2xl
              ${image.imageFitOptions || "object-cover"}
              ${index === 1 ? "hover:scale-105 duration-500 transition-transform " : ""}
            
            `}
          />
        </div>
      ))}
    </div>
  );

  return (
    <section
      id={sectionId}
      className={` px-10 pt-32 pb-20 max-[400px]:px-6 ${className}`}
    >
      <div className="mb-8">
        {typeof titleText === "string" ? (
          <h1
            className={`text-4xl md:text-5xl max-w-5xl mx-auto lg:text-6xl font-light leading-tight text-center mb-6 ${titleClassName}`}
          >
            {titleText}
          </h1>
        ) : (
          <div className={`text-4xl md:text-5xl max-w-5xl mx-auto lg:text-6xl font-light leading-tight mb-6 ${titleClassName}`}>
            {titleText}
          </div>
        )}
      </div>

      <p
        className={`opacity-60 max-w-3xl text-center mx-auto max-sm:px-6 leading-relaxed ${descriptionClassName}`}
      >
        {descriptionText}
      </p>

      {!hasCustomAccordion && (
        <div className="flex justify-center gap-4 pt-10">
          <button
            type="button"
            onClick={() => handleTabChange("seminars")}
            className={`px-5 py-2 rounded-full border text-sm font-semibold transition-colors duration-200 ${
              activeTab === "seminars"
                ? mainColor
                  ? "text-white"
                  : "bg-primary border-primary text-white"
                : "text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
            style={
              activeTab === "seminars" && mainColor
                ? {backgroundColor: mainColor, borderColor: mainColor}
                : undefined
            }
          >
            Seminars
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("projects")}
            className={`px-5 py-2 rounded-full border text-sm font-semibold transition-colors duration-200 ${
              activeTab === "projects"
                ? mainColor
                  ? "text-white"
                  : "bg-primary border-primary text-white"
                : "text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
            style={
              activeTab === "projects" && mainColor
                ? {backgroundColor: mainColor, borderColor: mainColor}
                : undefined
            }
          >
            Projects
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-20 max-lg:gap-0 pt-24">
        {accordionPosition === "left" ? (
          <>
            {AccordionComponent}
            {ImageGridComponent}
          </>
        ) : (
          <>
            {ImageGridComponent}
            {AccordionComponent}
          </>
        )}
      </div>
    </section>
  );
};

export default FeatureSection7;


