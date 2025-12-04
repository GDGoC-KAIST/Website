"use client";

import {FormEvent, useEffect, useState} from "react";
import CharCountTextarea from "./CharCountTextarea";
import type {
  RecruitApplication,
  RecruitApplyInput,
  RecruitUpdateInput,
} from "@/lib/recruitApi";
import {useLanguage} from "@/lib/i18n-context";
import {BRAND} from "@/lib/brand";
import {Button} from "@/components/ui/button";

type FormMode = "create" | "edit";

interface RecruitFormProps {
  mode: FormMode;
  initialData?: Partial<RecruitApplication>;
  onSubmit: (data: RecruitApplyInput | RecruitUpdateInput) => Promise<void> | void;
  isSubmitting?: boolean;
  isClosed?: boolean;
}

type FormErrors = Partial<Record<keyof RecruitApplyInput | "confirmPassword", string>>;

const EMPTY_STATE: RecruitApplyInput = {
  name: "",
  kaistEmail: "",
  googleEmail: "",
  phone: "",
  department: "",
  studentId: "",
  motivation: "",
  experience: "",
  wantsToDo: "",
  githubUsername: "",
  portfolioUrl: "",
  password: "",
};

const REQUIRED_FIELDS: (keyof RecruitApplyInput)[] = [
  "name",
  "kaistEmail",
  "googleEmail",
  "phone",
  "department",
  "studentId",
  "motivation",
  "experience",
  "wantsToDo",
];

function normalizeInitialData(initialData?: Partial<RecruitApplication>): RecruitApplyInput {
  if (!initialData) return {...EMPTY_STATE};
  return {
    ...EMPTY_STATE,
    ...initialData,
    githubUsername: initialData.githubUsername || "",
    portfolioUrl: initialData.portfolioUrl || "",
    kaistEmail: initialData.kaistEmail || "",
    password: "",
  };
}

const TEXT = {
  en: {
    fields: {
      name: "Name",
      kaistEmail: "KAIST Email",
      googleEmail: "Google Email",
      phone: "Phone",
      department: "Department",
      studentId: "Student ID",
      github: "GitHub Username (optional)",
      portfolio: "Portfolio URL (optional)",
      motivation: "Motivation",
      experience: "Experience",
      wantsToDo: "How will you contribute?",
      password: "Password",
      confirmPassword: "Confirm Password",
    },
    placeholders: {
      motivation: `Tell us why ${BRAND.shortName} matters to you`,
      experience: "Share relevant projects, clubs, or positions",
      wantsToDo: "Describe the sessions, workshops, or projects you want to run",
    },
    errors: {
      required: "Required",
      kaistEmail: "Must use @kaist.ac.kr",
      password: "Password required",
      confirmPassword: "Passwords do not match",
    },
    buttons: {
      submit: "Submit Application",
      edit: "Save Changes",
      submitting: "Submitting...",
      saving: "Saving...",
    },
  },
  ko: {
    fields: {
      name: "이름",
      kaistEmail: "KAIST 이메일",
      googleEmail: "Google 이메일",
      phone: "연락처",
      department: "학과",
      studentId: "학번",
      github: "GitHub 사용자명 (선택)",
      portfolio: "포트폴리오 URL (선택)",
      motivation: "지원 동기",
      experience: "활동/경험",
      wantsToDo: `${BRAND.shortName}에서 하고 싶은 활동`,
      password: "비밀번호",
      confirmPassword: "비밀번호 확인",
    },
    placeholders: {
      motivation: `${BRAND.shortName}에 참여하고 싶은 이유를 적어주세요`,
      experience: "관련 동아리/프로젝트/활동을 적어주세요",
      wantsToDo: "진행하고 싶은 세션/프로젝트/워크숍 등을 적어주세요",
    },
    errors: {
      required: "필수 입력 항목입니다",
      kaistEmail: "@kaist.ac.kr 메일만 입력 가능합니다",
      password: "비밀번호를 입력해주세요",
      confirmPassword: "비밀번호가 일치하지 않습니다",
    },
    buttons: {
      submit: "지원서 제출",
      edit: "저장하기",
      submitting: "제출 중...",
      saving: "저장 중...",
    },
  },
};

export default function RecruitForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  isClosed,
}: RecruitFormProps) {
  const {language} = useLanguage();
  const copy = TEXT[language];

  const [formValues, setFormValues] = useState<RecruitApplyInput>(
    normalizeInitialData(initialData)
  );
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormValues(normalizeInitialData(initialData));
  }, [initialData]);

  const disabled = mode === "create" && isClosed;
  const readonlyKaistEmail = mode === "edit";

  const handleChange = (key: keyof RecruitApplyInput, value: string) => {
    setFormValues((prev) => ({...prev, [key]: value}));
    setErrors((prev) => ({...prev, [key]: undefined}));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!formValues[field]?.trim()) {
        nextErrors[field] = copy.errors.required;
      }
    });

    if (!formValues.kaistEmail.endsWith("@kaist.ac.kr")) {
      nextErrors.kaistEmail = copy.errors.kaistEmail;
    }

    if (mode === "create") {
      if (!formValues.password.trim()) {
        nextErrors.password = copy.errors.password;
      }
      if (formValues.password !== confirmPassword) {
        nextErrors.confirmPassword = copy.errors.confirmPassword;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: RecruitApplyInput | RecruitUpdateInput =
      mode === "create"
        ? formValues
        : {
            name: formValues.name,
            kaistEmail: formValues.kaistEmail,
            googleEmail: formValues.googleEmail,
            phone: formValues.phone,
            department: formValues.department,
            studentId: formValues.studentId,
            motivation: formValues.motivation,
            experience: formValues.experience,
            wantsToDo: formValues.wantsToDo,
            githubUsername: formValues.githubUsername,
            portfolioUrl: formValues.portfolioUrl,
          };

    await onSubmit(payload);
  };

  const inputClass =
    "rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50";

  const submitLabel = mode === "create" ? copy.buttons.submit : copy.buttons.edit;
  const submittingLabel = mode === "create" ? copy.buttons.submitting : copy.buttons.saving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          {copy.fields.name}
          <input
            type="text"
            value={formValues.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.kaistEmail}
          <input
            type="email"
            value={formValues.kaistEmail}
            onChange={(event) => handleChange("kaistEmail", event.target.value)}
            className={`${inputClass} mt-2 w-full ${readonlyKaistEmail ? "bg-gray-100" : ""}`}
            disabled={disabled || readonlyKaistEmail}
            readOnly={readonlyKaistEmail}
          />
          {errors.kaistEmail && (
            <p className="mt-1 text-xs text-red-500">{errors.kaistEmail}</p>
          )}
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.googleEmail}
          <input
            type="email"
            value={formValues.googleEmail}
            onChange={(event) => handleChange("googleEmail", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
          {errors.googleEmail && (
            <p className="mt-1 text-xs text-red-500">{errors.googleEmail}</p>
          )}
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.phone}
          <input
            type="text"
            value={formValues.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.department}
          <input
            type="text"
            value={formValues.department}
            onChange={(event) => handleChange("department", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
          {errors.department && (
            <p className="mt-1 text-xs text-red-500">{errors.department}</p>
          )}
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.studentId}
          <input
            type="text"
            value={formValues.studentId}
            onChange={(event) => handleChange("studentId", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
          {errors.studentId && (
            <p className="mt-1 text-xs text-red-500">{errors.studentId}</p>
          )}
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.github}
          <input
            type="text"
            value={formValues.githubUsername || ""}
            onChange={(event) => handleChange("githubUsername", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          {copy.fields.portfolio}
          <input
            type="url"
            value={formValues.portfolioUrl || ""}
            onChange={(event) => handleChange("portfolioUrl", event.target.value)}
            className={`${inputClass} mt-2 w-full`}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="space-y-4">
        <CharCountTextarea
          label={copy.fields.motivation}
          value={formValues.motivation}
          onChange={(value) => handleChange("motivation", value)}
          placeholder={copy.placeholders.motivation}
          disabled={disabled && mode === "create"}
        />
        {errors.motivation && <p className="text-xs text-red-500">{errors.motivation}</p>}

        <CharCountTextarea
          label={copy.fields.experience}
          value={formValues.experience}
          onChange={(value) => handleChange("experience", value)}
          placeholder={copy.placeholders.experience}
          disabled={disabled && mode === "create"}
        />
        {errors.experience && <p className="text-xs text-red-500">{errors.experience}</p>}

        <CharCountTextarea
          label={copy.fields.wantsToDo}
          value={formValues.wantsToDo}
          onChange={(value) => handleChange("wantsToDo", value)}
          placeholder={copy.placeholders.wantsToDo}
          disabled={disabled && mode === "create"}
        />
        {errors.wantsToDo && <p className="text-xs text-red-500">{errors.wantsToDo}</p>}
      </div>

      {mode === "create" && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            {copy.fields.password}
            <input
              type="password"
              value={formValues.password}
              onChange={(event) => handleChange("password", event.target.value)}
              className={`${inputClass} mt-2 w-full`}
              disabled={disabled}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </label>
          <label className="text-sm font-medium text-gray-700">
            {copy.fields.confirmPassword}
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`${inputClass} mt-2 w-full`}
              disabled={disabled}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </label>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting || disabled}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
