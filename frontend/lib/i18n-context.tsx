"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type Language = "ko" | "en";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "gdg-campus-lang";
const COOKIE_NAME = "gdgoc_lang";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function persistLanguagePreference(value: Language) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, value);
  }
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR_IN_SECONDS}`;
  }
}

function readCookieLanguage(): Language | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const value = cookie.split("=")[1];
  if (value === "ko" || value === "en") {
    return value;
  }
  return null;
}

export function LanguageProvider({children}: {children: ReactNode}) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ko" || stored === "en") {
      setLanguage(stored);
      return;
    }
    const cookieLang = readCookieLanguage();
    if (cookieLang) {
      setLanguage(cookieLang);
      persistLanguagePreference(cookieLang);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "ko" ? "en" : "ko";
      persistLanguagePreference(next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{language, toggleLanguage}}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
