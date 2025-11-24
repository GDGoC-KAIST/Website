
import "./globals.css";
import {NavBar2} from './component/nav-bar'
import Footer1 from './component/Footer1'


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


const customMenuItems = [
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
          <NavBar2 
            authLinks={{ visible:false }}
            domain={{
              logo: (
                <div className = "flex size-8 bg-primary justify-center items-center">
                  <img src="/gdgoc_icon.png" alt="gdgoc_icon"></img>
                </div>
              ),
            }}
            navigationMenu={customMenuItems}
          />           
        <main>
          {children}
        </main>
        <div className='mt-32'>
          <Footer1/>
        </div>
      </body>
    </html>
  );

}
