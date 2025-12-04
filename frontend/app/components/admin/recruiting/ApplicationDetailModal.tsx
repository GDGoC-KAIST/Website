"use client";

import {Button} from "@/components/ui/button";
import {RecruitApplication} from "@/lib/recruitApi";

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: RecruitApplication | null;
}

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
}: ApplicationDetailModalProps) {
  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{application.name}</h3>
            <p className="text-sm text-gray-500">
              {application.kaistEmail} • {application.department}
            </p>
          </div>
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {application.status}
          </span>
        </div>
        <div className="max-h-[60vh] space-y-6 overflow-y-auto px-6 py-6">
          <EssayBlock title="Motivation" content={application.motivation} />
          <EssayBlock title="Experience" content={application.experience} />
          <EssayBlock title="Wants to do" content={application.wantsToDo} />
        </div>
        <div className="border-t border-gray-100 px-6 py-4 text-right">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function EssayBlock({title, content}: {title: string; content: string}) {
  return (
    <section>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      <p className="mt-2 whitespace-pre-line rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
        {content || "No response"}
      </p>
    </section>
  );
}
