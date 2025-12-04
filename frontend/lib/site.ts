import {BRAND} from "./brand";

export const SITE = {
  name: BRAND.shortName,
  officialName: BRAND.fullName,
  email: "gdgoc.kaist@gmail.com",
  social: {
    instagram: "https://www.instagram.com/gdgoc_kaist",
    linkedin: "https://www.linkedin.com/company/gdgoc-kaist",
  },
  navigation: [
    {label: "Home", href: "/"},
    {label: "About", href: "/about"},
    {label: "Projects", href: "/projects"},
    {label: "Seminars", href: "/seminars"},
    {label: "Members", href: "/members"},
    {label: "Contact", href: "/contact"},
    {label: "Recruiting", href: "/recruit"},
  ],
};
