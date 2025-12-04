"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {
  RecruitApplication,
  RecruitConfig,
  RecruitStatus,
  getAdminApplications,
  getAdminRecruitConfig,
  getExportUrl,
  updateAdminRecruitConfig,
  updateApplicationStatus,
} from "@/lib/recruitApi";
import ApplicationDetailModal from "./ApplicationDetailModal";
import StatusChangeDialog from "./StatusChangeDialog";

const STATUS_FILTERS: (RecruitStatus | "all")[] = [
  "all",
  "submitted",
  "reviewing",
  "accepted",
  "rejected",
  "hold",
];

interface RecruitingAdminPanelProps {
  adminId: string;
}

export default function RecruitingAdminPanel({adminId}: RecruitingAdminPanelProps) {
  const [applications, setApplications] = useState<RecruitApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecruitApplication | null>(null);
  const [dialog, setDialog] = useState<{app: RecruitApplication; status: RecruitStatus} | null>(
    null
  );

  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<RecruitConfig | null>(null);
  const [configDraft, setConfigDraft] = useState<RecruitConfig | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  const limit = 10;
  const offset = page * limit;
  const hasAdminId = Boolean(adminId);

  const loadApplications = useCallback(async () => {
    if (!hasAdminId) {
      setApplications([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminApplications(adminId, {
        status: filter,
        limit,
        offset,
      });
      setApplications(res.applications);
      setTotal(res.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load applications";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [adminId, filter, offset, hasAdminId]);

  const loadConfig = useCallback(async () => {
    if (!hasAdminId) {
      setConfig(null);
      setConfigDraft(null);
      return;
    }
    try {
      const cfg = await getAdminRecruitConfig(adminId);
      setConfig(cfg);
      setConfigDraft(cfg);
    } catch (err) {
      console.error("Failed to load recruit config", err);
    }
  }, [adminId, hasAdminId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      total,
      submitted: 0,
      reviewing: 0,
      accepted: 0,
      rejected: 0,
      hold: 0,
    };
    applications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }, [applications, total]);

  const handleStatusChange = async (
    application: RecruitApplication,
    status: RecruitStatus
  ) => {
    if (!adminId || status === application.status) return;
    if (status === "accepted" || status === "rejected") {
      setDialog({app: application, status});
      return;
    }
    try {
      await updateApplicationStatus(adminId, application.id, status);
      await loadApplications();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    }
  };

  const handleDialogConfirm = async ({
    notify,
    subject,
    html,
  }: {
    notify: boolean;
    subject?: string;
    html?: string;
  }) => {
    if (!dialog || !adminId) return;
    try {
      await updateApplicationStatus(adminId, dialog.app.id, dialog.status, {
        notify,
        email: notify ? {subject: subject || "", html: html || ""} : undefined,
      });
      await loadApplications();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    } finally {
      setDialog(null);
    }
  };

  const handleConfigChange = (update: Partial<RecruitConfig>) => {
    setConfigDraft((prev) => (prev ? {...prev, ...update} : prev));
  };

  const handleDateInput = (field: "openAt" | "closeAt", value: string) => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    handleConfigChange({[field]: date.toISOString()} as Partial<RecruitConfig>);
  };

  const handleConfigSave = async () => {
    if (!configDraft || !adminId) return;
    setConfigSaving(true);
    try {
      await updateAdminRecruitConfig(adminId, configDraft);
      setConfig(configDraft);
      setConfigOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save config";
      setError(message);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleExport = () => {
    if (!adminId) return;
    const url = getExportUrl(adminId, filter);
    window.open(url, "_blank");
  };

  const pageCount = Math.ceil(total / limit) || 1;

  if (!hasAdminId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
        Enter your admin ID above to manage recruiting.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        {[
          {label: "Total", value: stats.total},
          {label: "Submitted", value: stats.submitted},
          {label: "Reviewing", value: stats.reviewing},
          {label: "Accepted", value: stats.accepted},
          {label: "Rejected", value: stats.rejected},
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-xs uppercase text-gray-500">{item.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(status);
              setPage(0);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === status
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
        <div className="ml-auto flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setConfigOpen((prev) => !prev)}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            {configOpen ? "Hide Settings" : "Settings"}
          </button>
        </div>
      </div>

      {configOpen && configDraft && (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={configDraft.isOpen}
                onChange={(event) => handleConfigChange({isOpen: event.target.checked})}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Recruiting is open
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Open At
              <input
                type="datetime-local"
                value={toDatetimeLocal(configDraft.openAt)}
                onChange={(event) => handleDateInput("openAt", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Close At
              <input
                type="datetime-local"
                value={toDatetimeLocal(configDraft.closeAt)}
                onChange={(event) => handleDateInput("closeAt", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-gray-700">
            Recruiting semester
            <input
              type="text"
              value={configDraft.semester || ""}
              onChange={(event) => handleConfigChange({semester: event.target.value})}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Message when closed
            <textarea
              value={configDraft.messageWhenClosed}
              onChange={(event) =>
                handleConfigChange({messageWhenClosed: event.target.value})
              }
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
              rows={3}
            />
          </label>
          <button
            type="button"
            onClick={handleConfigSave}
            disabled={configSaving}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:bg-gray-300"
          >
            {configSaving ? "Saving..." : "Save config"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Emails</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading applications...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No applications in this filter.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold">{app.name}</td>
                  <td className="px-4 py-3">{app.department}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>{app.kaistEmail}</div>
                    <div>{app.googleEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(event) =>
                        handleStatusChange(app, event.target.value as RecruitStatus)
                      }
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold pointer-events-auto focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      {STATUS_FILTERS.filter((s) => s !== "all").map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(app)}
                      className="text-sm font-semibold text-primary"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Page {page + 1} of {pageCount}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="rounded-full border border-gray-200 px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-full border border-gray-200 px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ApplicationDetailModal
        isOpen={Boolean(selected)}
        application={selected}
        onClose={() => setSelected(null)}
      />
      <StatusChangeDialog
        isOpen={Boolean(dialog)}
        targetStatus={dialog?.status || "submitted"}
        applicantName={dialog?.app.name || ""}
        onClose={() => setDialog(null)}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
}

function toDatetimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
