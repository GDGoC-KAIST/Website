"use client";

import Link from "next/link";
import type {ElementType} from "react";
import {
  ChangeEvent,
  FormEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {Instagram, Mail, MapPin} from "lucide-react";

import Container from "@/components/layout/Container";
import {Button} from "@/components/ui/button";
import {BRAND} from "@/lib/brand";
import {CONTACT_CATEGORIES, type ContactCategory} from "@/lib/constants";
import {useT} from "@/lib/i18n/useT";
import {SITE} from "@/lib/site";

const CAMPUS_MAP_URL = "https://goo.gl/maps/Q4V9TyvGKu2CLv4W8";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  replyTo: string;
  category: ContactCategory;
  subject: string;
  message: string;
};

const FORM_FIELDS: Array<keyof FormState> = ["name", "replyTo", "category", "subject", "message"];

type FormErrors = Partial<Record<keyof FormState, string>>;
type TouchedState = Partial<Record<keyof FormState, boolean>>;

type CardConfig = {
  label: string;
  value: string;
  helper: string;
  icon: ElementType;
  href?: string;
  actionLabel?: string;
  action?: () => void;
};

function useToastFallback() {
  return useCallback((message?: string) => {
    if (!message) return;
    if (typeof window !== "undefined") {
      window.alert(message);
    }
  }, []);
}

const ContactHero = ({onPrimaryClick}: {onPrimaryClick: () => void}) => {
  const {t} = useT();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/75">
        {t("contact.hero.tag")}
      </p>
      <h1 className="text-3xl font-semibold leading-tight text-white drop-shadow sm:text-4xl">
        {t("contact.hero.title")}
      </h1>
      <p className="text-base text-white/85">{t("contact.hero.description")}</p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          onClick={onPrimaryClick}
          className="rounded-full bg-white/95 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20 hover:bg-white"
        >
          {t("contact.hero.primaryCta")}
        </Button>
        <Button
          asChild
          variant="ghost"
          className="rounded-full border border-white/30 px-6 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <Link href="/projects">{t("contact.hero.secondaryLink")}</Link>
        </Button>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/60">
        {t("contact.hero.primaryHelper")}
      </p>
    </div>
  );
};

const ContactInfoCards = () => {
  const {t} = useT();
  const notify = useToastFallback();

  const handleCopyEmail = useCallback(async () => {
    if (typeof navigator === "undefined") {
      notify(t("contact.info.copyFallback"));
      return;
    }

    try {
      await navigator.clipboard.writeText(BRAND.contactEmail);
      notify(t("contact.info.copySuccess"));
    } catch {
      notify(t("contact.info.copyFallback"));
    }
  }, [notify, t]);

  const cards = useMemo<CardConfig[]>(
    () => [
      {
        label: t("contact.info.emailLabel"),
        value: BRAND.contactEmail,
        helper: t("contact.info.emailHelper"),
        icon: Mail,
        href: `mailto:${BRAND.contactEmail}`,
        actionLabel: t("contact.info.copyLabel"),
        action: handleCopyEmail,
      },
      {
        label: t("contact.info.locationLabel"),
        value: t("contact.info.locationValue"),
        helper: t("contact.info.locationHelper"),
        icon: MapPin,
        href: CAMPUS_MAP_URL,
        actionLabel: t("contact.info.mapLabel"),
        action: () => {
          if (typeof window !== "undefined") {
            window.open(CAMPUS_MAP_URL, "_blank", "noopener,noreferrer");
          }
        },
      },
      {
        label: t("contact.info.socialLabel"),
        value: t("footer.social.instagram") || "Instagram",
        helper: t("contact.info.instagramHelper"),
        icon: Instagram,
        href: SITE.social.instagram,
      },
    ],
    [handleCopyEmail, t]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={`${card.label}-${card.value}`}
            className="group rounded-2xl border border-white/20 bg-white/5 p-4 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-white/40"
          >
            <div className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-white/70">
              <span className="rounded-full border border-white/30 p-2 text-white transition group-hover:border-white/60">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {card.label}
            </div>
            {card.href ? (
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center text-base font-semibold text-white hover:underline"
              >
                {card.value}
              </a>
            ) : (
              <p className="mt-2 text-base font-semibold text-white">{card.value}</p>
            )}
            <p className="mt-1 text-xs text-white/70">{card.helper}</p>
            {card.action && card.actionLabel && (
              <button
                type="button"
                onClick={card.action}
                className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 underline-offset-4 hover:underline"
              >
                {card.actionLabel}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ContactForm = forwardRef<HTMLFormElement>((_, ref) => {
  const {t, language} = useT();
  const notify = useToastFallback();
  const internalRef = useRef<HTMLFormElement>(null);
  const lastLanguageRef = useRef(language);

  useImperativeHandle(ref, () => internalRef.current as HTMLFormElement | null);

  const [form, setForm] = useState<FormState>({
    name: "",
    replyTo: "",
    category: CONTACT_CATEGORIES[0],
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const categoryOptions = useMemo(
    () =>
      CONTACT_CATEGORIES.map((category) => ({
        id: category,
        label: t(`contact.categories.${category}`),
      })),
    [t]
  );

  const validate = useCallback(
    (values: FormState) => {
      const nextErrors: FormErrors = {};
      if (!values.name.trim()) {
        nextErrors.name = t("contact.mail.errors.required");
      }
      const emailValue = values.replyTo.trim();
      if (!emailValue) {
        nextErrors.replyTo = t("contact.mail.errors.required");
      } else if (!EMAIL_REGEX.test(emailValue)) {
        nextErrors.replyTo = t("contact.mail.errors.invalidEmail");
      }
      if (!values.subject.trim()) {
        nextErrors.subject = t("contact.mail.errors.required");
      } else if (values.subject.trim().length < 3) {
        nextErrors.subject = t("contact.mail.errors.addDetail");
      }
      if (!values.message.trim()) {
        nextErrors.message = t("contact.mail.errors.required");
      } else if (values.message.trim().length < 3) {
        nextErrors.message = t("contact.mail.errors.addDetail");
      }
      if (!values.category) {
        nextErrors.category = t("contact.mail.errors.required");
      }

      return {
        isValid: Object.keys(nextErrors).length === 0,
        errors: nextErrors,
      };
    },
    [t]
  );

  const runValidation = useCallback(
    (nextState: FormState) => {
      const result = validate(nextState);
      setErrors(result.errors);
      return result;
    },
    [validate]
  );

  const handleBlur =
    (field: keyof FormState) => () => {
      setTouched((prev) => ({...prev, [field]: true}));
      runValidation(form);
    };

  const handleChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => {
        const nextState = {
          ...prev,
          [field]: field === "category" ? (value as ContactCategory) : value,
        };
        if (touched[field]) {
          runValidation(nextState);
        }
        return nextState;
      });
    };

  const buildMailto = useCallback(
    (values: FormState) => {
      const categoryLabel = t(`contact.categories.${values.category}`);
      const subject = `[${categoryLabel}] ${values.subject}`.trim();
      const bodyLines = [
        `${t("contact.mail.label.name")}: ${values.name}`,
        `${t("contact.mail.label.replyTo")}: ${values.replyTo}`,
        `${t("contact.mail.label.category")}: ${categoryLabel}`,
        "",
        values.message,
      ];
      const body = bodyLines.join("\n");
      return `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`;
    },
    [t]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const touchedAll = FORM_FIELDS.reduce<TouchedState>(
      (acc, field) => ({...acc, [field]: true}),
      {}
    );
    setTouched(touchedAll);
    const result = runValidation(form);
    if (!result.isValid) {
      internalRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
      return;
    }

    setIsSubmitting(true);
    setShowFeedback(false);
    try {
      const mailto = buildMailto(form);
      const newWindow = window.open(mailto);
      if (newWindow) {
        newWindow.focus();
        notify(t("contact.mail.feedback.toastOpen"));
      } else {
        window.location.href = mailto;
        notify(t("contact.mail.feedback.toastFallback"));
      }
      setShowFeedback(true);
    } catch {
      notify(t("contact.mail.feedback.toastFallback"));
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const getErrorId = (field: keyof FormState) => `contact-${field}-error`;

  const canSubmit =
    form.name.trim() && form.replyTo.trim() && form.subject.trim() && form.message.trim();

  useEffect(() => {
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
      if (Object.values(touched).some(Boolean)) {
        runValidation(form);
      }
    }
  }, [form, language, runValidation, touched]);

  return (
    <div className="rounded-[2rem] bg-white/95 p-6 text-gray-900 shadow-[0_25px_120px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-8">
      <p className="text-lg font-semibold text-gray-900">{t("contact.mail.formTitle")}</p>
      {showFeedback && (
        <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t("contact.mail.feedback.inline")}
        </p>
      )}
      <form ref={internalRef} onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700" htmlFor="contact-name">
            {t("contact.mail.label.name")}
            <input
              id="contact-name"
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              value={form.name}
              onChange={handleChange("name")}
              onBlur={handleBlur("name")}
              aria-invalid={Boolean(touched.name && errors.name)}
              aria-describedby={touched.name && errors.name ? getErrorId("name") : undefined}
              required
            />
            {touched.name && errors.name && (
              <p id={getErrorId("name")} className="mt-1 text-xs text-rose-500">
                {errors.name}
              </p>
            )}
          </label>
          <label className="text-sm font-semibold text-gray-700" htmlFor="contact-email">
            {t("contact.mail.label.replyTo")}
            <input
              id="contact-email"
              type="email"
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              value={form.replyTo}
              onChange={handleChange("replyTo")}
              onBlur={handleBlur("replyTo")}
              aria-invalid={Boolean(touched.replyTo && errors.replyTo)}
              aria-describedby={touched.replyTo && errors.replyTo ? getErrorId("replyTo") : undefined}
              required
            />
            {touched.replyTo && errors.replyTo && (
              <p id={getErrorId("replyTo")} className="mt-1 text-xs text-rose-500">
                {errors.replyTo}
              </p>
            )}
          </label>
        </div>
        <label className="text-sm font-semibold text-gray-700" htmlFor="contact-category">
          {t("contact.mail.label.category")}
          <select
            id="contact-category"
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            value={form.category}
            onChange={handleChange("category")}
            onBlur={handleBlur("category")}
            aria-invalid={Boolean(touched.category && errors.category)}
            aria-describedby={touched.category && errors.category ? getErrorId("category") : undefined}
          >
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          {touched.category && errors.category && (
            <p id={getErrorId("category")} className="mt-1 text-xs text-rose-500">
              {errors.category}
            </p>
          )}
        </label>
        <label className="text-sm font-semibold text-gray-700" htmlFor="contact-subject">
          {t("contact.mail.label.subject")}
          <input
            id="contact-subject"
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            value={form.subject}
            onChange={handleChange("subject")}
            onBlur={handleBlur("subject")}
            aria-invalid={Boolean(touched.subject && errors.subject)}
            aria-describedby={touched.subject && errors.subject ? getErrorId("subject") : undefined}
            required
          />
          {touched.subject && errors.subject && (
            <p id={getErrorId("subject")} className="mt-1 text-xs text-rose-500">
              {errors.subject}
            </p>
          )}
        </label>
        <label className="text-sm font-semibold text-gray-700" htmlFor="contact-message">
          {t("contact.mail.label.message")}
          <textarea
            id="contact-message"
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            rows={6}
            value={form.message}
            onChange={handleChange("message")}
            onBlur={handleBlur("message")}
            aria-invalid={Boolean(touched.message && errors.message)}
            aria-describedby={touched.message && errors.message ? getErrorId("message") : undefined}
            required
          />
          {touched.message && errors.message && (
            <p id={getErrorId("message")} className="mt-1 text-xs text-rose-500">
              {errors.message}
            </p>
          )}
        </label>
        <div className="space-y-2">
          <Button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05] py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-95"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? t("contact.mail.sending") : t("contact.mail.submit")}
          </Button>
          <p className="text-xs text-gray-500">{t("contact.mail.note")}</p>
          <p className="text-xs text-gray-500">{t("contact.mail.notePrivacy")}</p>
        </div>
      </form>
    </div>
  );
});

ContactForm.displayName = "ContactForm";

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
  };

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.22),transparent_55%)] px-4 py-16 sm:px-6 lg:px-10">
      <Container className="max-w-6xl">
        <section className="relative isolate overflow-hidden rounded-[2.6rem] border border-white/15 bg-slate-900 text-white shadow-[0_35px_120px_rgba(15,23,42,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(66,133,244,0.35),transparent_50%),radial-gradient(circle_at_90%_20%,rgba(234,67,53,0.35),transparent_40%)]" />
          <div className="relative grid gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
            <div className="space-y-8">
              <ContactHero onPrimaryClick={scrollToForm} />
              <ContactInfoCards />
            </div>

            <ContactForm ref={formRef} />
          </div>
        </section>
      </Container>
    </div>
  );
}
