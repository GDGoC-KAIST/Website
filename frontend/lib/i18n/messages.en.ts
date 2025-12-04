import {BRAND} from "@/lib/brand";

export const messagesEn = {
  brand: {
    full: BRAND.fullName,
    short: BRAND.shortName,
    hashtag: BRAND.hashtag,
  },
  nav: {
    home: "Home",
    about: "About",
    projects: "Projects",
    seminars: "Seminars",
    members: "Members",
    contact: "Contact",
    recruiting: "Recruiting",
    admin: "Admin",
  },
  recruit: {
    status: {
      open: "Open",
      soon: "Opening Soon",
      closed: "Closed",
    },
  },
  hero: {
    main: {
      description:
        "Build. Learn. Share—together at KAIST. We host seminars, run hands-on projects, and help developers connect on campus.",
    },
    about: {
      description:
        "Here's how Google for Developers, GDG, GDG on Campus, GDG on Campus KAIST, and GDE connect within the ecosystem.",
    },
    members: {
      description:
        "Designers, engineers, and organizers collaborate to keep this chapter thriving.",
    },
    projects: {
      description:
        "Our chapter ships experiments and real products every semester. Browse ongoing initiatives and completed launches.",
    },
    seminars: {
      description:
        "From invited Google engineers to internal workshops, explore our latest conversations on tech and community.",
    },
  },
  footer: {
    explore: "Explore",
    rights: "All rights reserved.",
    madeWith: "Made with",
    by: "by",
    contact: "Contact",
    emailLabel: "Email",
    description:
      "We host developer events, projects, and sessions on campus to bring KAIST makers together.",
    socialHeading: "Social",
    social: {
      instagram: "Instagram",
      linkedin: "LinkedIn",
    },
  },
  seo: {
    title: BRAND.fullName,
    description: BRAND.ogDescriptionDefault,
  },
  home: {
    hero: {
      description:
        "Build. Learn. Share—together at KAIST. We host seminars, run hands-on projects, and help developers connect on campus.",
      ctaPrimary: "Join recruiting",
      ctaSecondary: "See projects",
    },
    whatWeDo: {
      description:
        "Every season we design programs around sessions, hands-on projects, and the community that connects them.",
      cards: {
        sessions:
          "Biweekly tech talks, lightning demos, and study jams led by members and invited Googlers.",
        projects:
          "Small pods ship real prototypes every semester—from campus tools to open-source experiments.",
        community:
          "Peer mentoring, onboarding cohorts, and socials keep beginners and seniors building together.",
      },
    },
    activities: {
      description: "Snapshots from seminars, hack sessions, sticker swaps, and roadshows.",
    },
    featured: {
      description: "Real demos and experiments shipped by GDGoC teams. Explore what’s live and what’s in progress.",
    },
    recruit: {
      description: "We onboard new members every semester for seminars, projects, and community programs.",
      ctaPrimaryOpen: "Apply now",
      ctaPrimaryClosed: "View recruiting info",
      ctaSecondary: "View timeline →",
    },
    contact: {
      subtitle: "Reach out for campus events, guest sessions, joint programs, or anything GDG related.",
      cardBody: "Drop us a message and we’ll get back within 1–2 days. We welcome collaborations, invited talks, and project ideas.",
      responseTime: "Response within 48 hours",
      recruitHintPrefix: "Recruiting status updates live on",
      recruitHintSuffix: ".",
      cardPrimaryCta: "Contact form",
      cardSecondaryCta: "Email us",
    },
  },
  contact: {
    hero: {
      tag: "Contact",
      title: `Say hello to ${BRAND.shortName}`,
      description:
        "Interested in speaking, sponsoring, or collaborating? Leave a message below and we’ll get back to you.",
      primaryCta: "Write a message",
      primaryHelper: "Scroll to the form",
      secondaryLink: "Collaboration guide",
    },
    info: {
      emailLabel: "Email",
      emailHelper: "We reply within 1–2 days",
      locationLabel: "Location",
      locationValue: "KAIST, Daejeon",
      locationHelper: "Visit us on campus by appointment",
      socialLabel: "Social",
      instagramHelper: "Behind-the-scenes snapshots",
      copyLabel: "Copy address",
      copySuccess: "Email copied!",
      copyFallback: "Copy failed—please copy it manually.",
      mapLabel: "Open map",
    },
    mail: {
      formTitle: "Send a message",
      label: {
        name: "Name",
        replyTo: "Reply-to email",
        category: "Category",
        subject: "Subject",
        message: "Message",
      },
      submit: "Send",
      sending: "Sending...",
      note: "Note: This opens your email app with details pre-filled.",
      notePrivacy: "Your information is used only to reply to this inquiry.",
      feedback: {
        inline: "Your mail app should now be open—expect a reply within 1–2 days.",
        toastOpen: "Opening your mail app…",
        toastFallback: "Unable to open your mail app. Please copy the email manually.",
      },
      errors: {
        required: "Required field.",
        invalidEmail: "Enter a valid email.",
        addDetail: "Please add a bit more detail.",
      },
    },
    categories: {
      speaking: "Speaking opportunity",
      sponsorship: "Sponsorship",
      collab: "Collaboration",
      other: "Other",
    },
    secondaryLink: "Collaboration guide",
  },
} as const;

export type EnglishMessages = typeof messagesEn;
