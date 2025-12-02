
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
    url: "/about",
    subMenu: [
      {
        title: "GDG on Campus KAIST",
        url: "/#about",
        description: "GDG on Campus KAIST를 소개합니다.",
        icon: <University />,
      },
      {
        title: "동아리원",
        url: "/#members",
        description: "",
        icon: <Users />,
      },
    ],
  },
  {
    title: "Projects",
    url: "/projects",
  },
  {
    title: "Seminars",
    url: "/seminars",
  },
  {
    title: "Contact",
    url: "/contact",
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
            authLinks={{ 
              visible: true,
              login: {
                text: "Sign in",
                isVisible: true,
                variant: "outline",
                className: "border-2 font-semibold",
                urlLink: "/login"
              }
            }}
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
