
import "./globals.css";
import type {Metadata} from "next";
import Image from "next/image";
import {cookies} from "next/headers";
import {Inter, JetBrains_Mono} from "next/font/google";
import {NavBar2} from "./component/nav-bar";
import Footer from "@/components/Footer";
import {LanguageProvider} from "@/lib/i18n-context";
import {BRAND} from "@/lib/brand";
import {DEFAULT_LANGUAGE, getDict} from "@/lib/i18n";
import PageTransition from "@/components/motion/PageTransition";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-base",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-base",
  display: "swap",
});


export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("gdgoc_lang")?.value;
  const dict = getDict(langCookie);
  return {
    title: {
      default: dict.seo.title,
      template: `%s | ${dict.brand.full}`,
    },
    description: dict.seo.description,
    openGraph: {
      title: dict.seo.title,
      siteName: dict.brand.full,
      description: dict.seo.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.seo.title,
      description: dict.seo.description,
    },
  };
}

const customMenuItems = [
  {title: "Home", url: "/"},
  {title: "About", url: "/about"},
  {title: "Projects", url: "/projects"},
  {title: "Seminars", url: "/seminars"},
  {title: "Members", url: "/members"},
  {title: "Contact", url: "/contact"},
];


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("gdgoc_lang")?.value === "ko" ? "ko" : DEFAULT_LANGUAGE);

  return (
    <html lang={lang} className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="pt-24">
        <LanguageProvider>
          <NavBar2 
            authLinks={{ visible:false }}
            isSticky
            domain={{
              logo: (
                <Image
                  src="/GDGoC KAIST Logo.png"
                  alt={`${BRAND.shortName} logo`}
                  width={312}
                  height={94}
                  priority
                  className="object-contain"
                  style={{height: "3.9rem", width: "auto"}}
                />
              ),
              name: null,
            }}
            navigationMenu={customMenuItems}
          />           
        <PageTransition>
          <main className="pt-6">
            {children}
          </main>
        </PageTransition>
        <div className='mt-20'>
          <Footer />
        </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
