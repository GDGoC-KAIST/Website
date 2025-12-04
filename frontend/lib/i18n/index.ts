import {messagesEn} from "./messages.en";
import {messagesKo} from "./messages.ko";

export const messages = {
  en: messagesEn,
  ko: messagesKo,
} as const;

export type LanguageCode = keyof typeof messages;

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function getDict(lang?: string) {
  if (lang && lang in messages) {
    return messages[lang as LanguageCode];
  }
  return messages[DEFAULT_LANGUAGE];
}
