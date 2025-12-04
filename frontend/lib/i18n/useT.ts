"use client";

import {useMemo, useCallback} from "react";
import {useLanguage} from "@/lib/i18n-context";
import {getDict, type LanguageCode} from "@/lib/i18n";

type Dict = ReturnType<typeof getDict>;

function resolvePath(dictionary: Dict, path: string) {
  return path.split(".").reduce<any>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);
}

export function useT() {
  const {language} = useLanguage();
  const dict = useMemo(() => getDict(language as LanguageCode), [language]);

  const t = useCallback(
    (path: string): string => {
      const value = resolvePath(dict, path);
      if (typeof value === "string") {
        return value;
      }
      return "";
    },
    [dict]
  );

  return {t, language};
}
