

"use client";
import { ReactNode, useState } from "react";
import { Plus, X } from "lucide-react";
import { MdChatBubble } from "react-icons/md";

interface FaqSection2Item {
  question: string;
  answer: string;
}

interface contactSection {
  icon?: ReactNode;
  className?: string;
  title?: string;
  subTitle?: string;
  button?: { text?: string; href?: string; className?: string };
}

interface FaqSection3Props {
  className?: string;
  sectionId?: string;
  featureBadge?: { text?: string; className?: string };
  title?: { text?: string | ReactNode; className?: string };
  description?: { text?: string; className?: string };
  items?: FaqSection2Item[];
  contactSection?: contactSection;
  faqPosition?: "left" | "right";
}


const DEFAULT_ITEMS: FaqSection2Item[] = [
  {
    question: "What services does your company provide?",
    answer:
      "We offer a comprehensive suite of professional services including strategic consulting, custom software development, data analytics, and digital transformation solutions.",
  },
  {
    question: "How do you ensure the quality of your work?",
    answer:
      "Our commitment to quality is upheld through a rigorous process that includes detailed project planning, continuous quality assurance testing, and regular client feedback loops to ensure all deliverables meet the highest standards.",
  },
  {
    question:
      "Can you handle projects for small businesses as well as large enterprises?",
    answer:
      "Yes, our flexible service model is designed to support projects of all sizes. We can scale our team and resources to perfectly match the needs of small-scale engagements or large enterprise-level initiatives.",
  },
  {
    question: "What is your approach to client collaboration?",
    answer:
      "We believe in a highly collaborative and transparent approach. We work closely with your team, providing regular updates, holding frequent meetings, and using collaborative tools to ensure we are always aligned with your goals and expectations.",
  },
  {
    question: "How do you handle project timelines and deadlines?",
    answer:
      "We utilize agile methodologies to manage our projects, breaking down work into manageable sprints. This allows us to deliver results incrementally, adapt to changes quickly, and ensure we meet all agreed-upon deadlines efficiently.",
  },
];

// Custom Accordion Component
function CustomAccordion({
  question,
  answer,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-neutral-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 text-left flex justify-between items-center group hover:opacity-80 transition-opacity duration-200"
      >
        <span className="text-lg font-medium text-gray-900 dark:text-white pr-6 leading-relaxed">
          {question}
        </span>
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          {isOpen ? (
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-gray-600 dark:text-gray-300 leading-relaxed pr-12">
          {answer}
        </div>
      </div>
    </div>
  );
}

function FaqSection3({
  faqPosition = "left",
  className = "",
  sectionId = "",
  title,
  contactSection,
  items = DEFAULT_ITEMS,
}: FaqSection3Props) {
  const {
    text: titleText = (
      <h1
        className={`text-5xl max-md:text-center lg:text-6xl mx-auto max-w-5xl font-light leading-tight mb-6 `}
      >
        <span className="font-semibold">Frequently </span>
        <span className="text-primary">Asked Questions</span>
      </h1>
    ),
    className: titleClassName = "",
  } = title || {};

  const {
    icon: contactSectionIcon = <MdChatBubble size={80} />,
    className: contactSectionClassName = "",
    title: contactSectionTitle = "Still have questions?",
    subTitle:
      contactSectionSubTitle = "Can't find the answer you're looking for? Reach out to our team for personalized assistance.",
    button: contactSectionButton,
  } = contactSection || {};

  const {
    text: contactSectionButtonText = "Contact Us",
    className: contactSectionButtonClassName = "",
    href: contactSectionButtonHref = "/contact",
  } = contactSectionButton || {};

  // Decide column order based on faqPosition
  const faqColumn = (
    <div className="space-y-0 max-sm:px-3">
      {items.map((item, index) => (
        <CustomAccordion
          key={`faq-${index}`}
          question={item.question}
          answer={item.answer}
          index={index}
        />
      ))}
    </div>
  );

  const contactColumn = (
    <div className={`${contactSectionClassName}`}>
      <div
        className="h-full flex flex-col justify-between items-center
        dark:bg-neutral-800 rounded-2xl border border-gray-100 
        dark:border-neutral-700 p-10"
      >
        <div className="flex flex-col  gap-4 items-center">
          {contactSectionIcon}
          <h3 className="text-2xl text-center font-semibold pt-5 text-gray-900 dark:text-white mb-3">
            {contactSectionTitle}
          </h3>
          <p className="text-gray-600 text-center dark:text-gray-300 mb-6 t leading-relaxed">
            {contactSectionSubTitle}
          </p>
        </div>

        <a
          href={contactSectionButtonHref}
          className={`w-full px-6 py-3 text-center bg-primary text-white font-medium rounded-lg 
                transition-colors duration-200 shadow-sm ${contactSectionButtonClassName}`}
        >
          {contactSectionButtonText}
        </a>
      </div>
    </div>
  );

  return (
    <section id={sectionId} className={` px-4 border  ${className}`}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-1/2 max-lg:w-full">
          {typeof titleText === "string" ? (
            <h1
              className={`text-5xl  md:text-left max-w-5xl mx-auto lg:text-6xl font-light leading-tight text-center mb-6 ${titleClassName}`}
            >
              {titleText}
            </h1>
          ) : (
            <>{titleText}</>
          )}
        </div>
        <div
          className={`grid ${faqPosition === "right" ? "md:grid-cols-[1.4fr_2fr]" : "md:grid-cols-[2fr_2fr]"}  gap-16 lg:gap-20 pt-16`}
        >
          {faqPosition === "left" ? (
            <>
              {faqColumn}
              {contactColumn}
            </>
          ) : (
            <>
              {contactColumn}
              {faqColumn}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default FaqSection3;
