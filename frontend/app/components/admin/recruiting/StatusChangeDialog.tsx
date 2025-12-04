"use client";

import {FormEvent, useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {RecruitStatus} from "@/lib/recruitApi";
import {BRAND} from "@/lib/brand";

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {notify: boolean; subject?: string; html?: string}) => void;
  targetStatus: RecruitStatus;
  applicantName: string;
}

const SUBJECT_TEMPLATES: Record<RecruitStatus, string> = {
  accepted: `[${BRAND.shortName}] Congratulations!`,
  rejected: `[${BRAND.shortName}] Application Update`,
  reviewing: "",
  submitted: "",
  hold: "",
};

const BODY_TEMPLATES: Record<RecruitStatus, string> = {
  accepted: `Hi {{name}},\n\nCongratulations! You have been accepted to ${BRAND.shortName}. We'll follow up with onboarding info soon.`,
  rejected: `Hi {{name}},\n\nThank you for applying to ${BRAND.shortName}. After review, we will not be moving forward this season. Please stay in touch for future opportunities.`,
  reviewing: "",
  submitted: "",
  hold: "",
};

export default function StatusChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  targetStatus,
  applicantName,
}: StatusChangeDialogProps) {
  const [notify, setNotify] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNotify(true);
      setSubject(SUBJECT_TEMPLATES[targetStatus] || "");
      setBody(BODY_TEMPLATES[targetStatus] || "");
    }
  }, [isOpen, targetStatus]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({notify, subject, html: body});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Change status to {targetStatus}
        </h3>
        <p className="text-sm text-gray-600">Applicant: {applicantName}</p>
        <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={notify}
            onChange={(event) => setNotify(event.target.checked)}
            className="rounded-md border-gray-300 text-primary focus:ring-primary"
          />
          Send notification email
        </label>
        {notify && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Subject
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Message (markdown/plain text)
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
              />
            </label>
            <p className="text-xs text-gray-500">Available variables: {'{{name}}'}</p>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Confirm
          </Button>
        </div>
      </form>
    </div>
  );
}
