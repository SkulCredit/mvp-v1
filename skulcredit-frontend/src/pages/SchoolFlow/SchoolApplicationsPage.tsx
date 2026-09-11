import React, { useState, useEffect, useCallback } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  DashboardTopBar,
  SchoolSidebar,
} from "../../components/layout";
import { schoolService } from "../../services/schoolService";
import { AxiosError } from "axios";

/* ── Status helpers */
type StatusColor = "amber" | "blue" | "emerald" | "red" | "slate";
interface StatusMeta {
  label: string;
  color: StatusColor;
}

const STATUS_META: Record<string, StatusMeta> = {
  pending_school_approval: { label: "Pending Review", color: "amber" },
  school_approved: { label: "Verified", color: "blue" },
  disbursed: { label: "Completed", color: "emerald" },
  rejected: { label: "Rejected", color: "red" },
};
const STATUS_COLORS: Record<StatusColor, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
};

interface AppRecord {
  id: string;
  status: string;
  amount?: number;
  createdAt?: string;
  student?: {
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    studentId?: string;
  };
  parent?: { firstName?: string; lastName?: string; email?: string };
  [key: string]: unknown;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status] ?? {
    label: status,
    color: "slate" as StatusColor,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-max ${STATUS_COLORS[meta.color]}`}
    >
      {meta.color === "amber" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      )}
      {meta.color === "blue" && (
        <Icon name="shield-check" className="w-3.5 h-3.5" />
      )}
      {meta.color === "emerald" && (
        <Icon name="check-circle-2" className="w-3.5 h-3.5" />
      )}
      {meta.color === "red" && <Icon name="x-circle" className="w-3.5 h-3.5" />}
      {meta.label}
    </span>
  );
};

type FilterKey = "all" | "pending" | "verified" | "completed";
type DrawerView = "detail" | "reject";

const SchoolApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [drawerView, setDrawerView] = useState<DrawerView>("detail");

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const data = await schoolService.getApplications();
      const arr = Array.isArray(data)
        ? data
        : ((data as { applications?: AppRecord[] })?.applications ?? []);
      setApplications(arr as AppRecord[]);
    } catch (err) {
      setFetchError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Failed to load applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const openDrawer = (app: AppRecord) => {
    setSelectedApp(app);
    setDrawerView("detail");
    setActionError("");
    setConfirmedAmount(app.amount ? String(app.amount) : "");
    setRejectionNote("");
  };
  const closeDrawer = () => setSelectedApp(null);
  const isPending = (app: AppRecord | null) =>
    app?.status === "pending_school_approval";

  const handleVerify = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionError("");
    try {
      await schoolService.verifyEnrollment(selectedApp.id, {
        action: "confirm",
        ...(confirmedAmount
          ? { confirmedTuitionAmount: Number(confirmedAmount) }
          : {}),
      });
      await loadApplications();
      closeDrawer();
    } catch (err) {
      setActionError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Failed to verify enrollment.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionError("");
    try {
      await schoolService.verifyEnrollment(selectedApp.id, {
        action: "reject",
        ...(rejectionNote ? { note: rejectionNote } : {}),
      });
      await loadApplications();
      closeDrawer();
    } catch (err) {
      setActionError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Failed to reject application.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const FILTER_MAP: Record<FilterKey, (a: AppRecord) => boolean> = {
    all: () => true,
    pending: (a) => a.status === "pending_school_approval",
    verified: (a) => a.status === "school_approved",
    completed: (a) => a.status === "disbursed",
  };
  const visible = applications.filter((a) => {
    if (!FILTER_MAP[filter](a)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.id?.toLowerCase().includes(q) ||
      a.student?.firstName?.toLowerCase().includes(q) ||
      a.student?.lastName?.toLowerCase().includes(q) ||
      a.parent?.firstName?.toLowerCase().includes(q)
    );
  });

  const pendingCount = applications.filter(
    (a) => a.status === "pending_school_approval",
  ).length;
  const initials = (a: AppRecord) =>
    `${a.student?.firstName?.[0] ?? ""}${a.student?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "??";
  const studentName = (a: AppRecord) =>
    a.student ? `${a.student.firstName} ${a.student.lastName}` : "Unknown";
  const parentName = (a: AppRecord) =>
    a.parent ? `${a.parent.firstName} ${a.parent.lastName}` : "Unknown";

  /* ── Search bar for top bar ── */
  const searchBar = (
    <div className="hidden lg:block relative w-96 mr-auto">
      <Icon
        name="search"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
      />
      <input
        type="text"
        placeholder="Search by student name or App ID…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400"
      />
    </div>
  );

  return (
    <DashboardLayout
      sidebar={<SchoolSidebar />}
      header={
        <DashboardTopBar left={searchBar} notificationCount={pendingCount} />
      }
    >
      <div className="max-w-[1200px] mx-auto space-y-8 pt-6">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Loan Applications
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Review and verify incoming tuition requests from parents.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <Icon name="clock" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700/70 uppercase">
                  Action Needed
                </p>
                <p className="text-lg font-black text-amber-900">
                  {pendingCount} Pending
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="inline-flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/60 animate-fade-in-up">
          {(["all", "pending", "verified", "completed"] as FilterKey[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? "bg-white shadow text-brand" : "text-slate-500 hover:text-slate-800"}`}
              >
                {f}
              </button>
            ),
          )}
        </div>

        {/* Error / loading / empty */}
        {fetchError && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-medium">
            {fetchError}
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && !fetchError && visible.length === 0 && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center">
            <Icon
              name="file-x"
              className="w-12 h-12 text-slate-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-slate-700">
              No applications found
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Try a different filter or check back later.
            </p>
          </div>
        )}

        {/* Application rows */}
        {!isLoading && visible.length > 0 && (
          <div className="space-y-3 pb-10">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Student & App ID</div>
              <div className="col-span-3">Parent Info</div>
              <div className="col-span-2">Tuition Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Date Applied</div>
            </div>
            {visible.map((app) => (
              <div
                key={app.id}
                onClick={() => openDrawer(app)}
                className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-4 lg:px-6 relative cursor-pointer flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center hover:border-brand/30 hover:shadow-sm transition-all"
              >
                {isPending(app) && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-2xl" />
                )}
                <div className="col-span-3 flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                    {initials(app)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm lg:text-base">
                      {studentName(app)}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {app.id}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 w-full">
                  <p className="text-sm font-bold text-slate-700">
                    {parentName(app)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app.parent?.email ?? ""}
                  </p>
                </div>
                <div className="col-span-2 w-full">
                  <p className="text-sm font-black text-brand">
                    ₦{Number(app.amount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 w-full">
                  <StatusBadge status={app.status} />
                </div>
                <div className="col-span-2 flex items-center justify-between lg:justify-end w-full">
                  <p className="text-sm text-slate-500 font-medium">
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                  <button className="w-8 h-8 rounded-full bg-brand-50 text-brand flex items-center justify-center hover:bg-brand hover:text-white transition-colors lg:ml-4 shrink-0">
                    <Icon name="chevron-right" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Slide-out Drawer ── */}
      <div
        className={`fixed inset-0 z-50 ${selectedApp ? "" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${selectedApp ? "opacity-100" : "opacity-0"}`}
          onClick={closeDrawer}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${selectedApp ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Review Application
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {selectedApp?.id}
              </p>
            </div>
            <button
              className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm border border-slate-100"
              onClick={closeDrawer}
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedApp && (
              <>
                <div
                  className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${isPending(selectedApp) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <Icon
                    name={
                      isPending(selectedApp) ? "alert-circle" : "check-circle"
                    }
                    className="w-5 h-5"
                  />
                  <p className="text-sm font-bold">
                    {STATUS_META[selectedApp.status]?.label ??
                      selectedApp.status}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Requested Financing
                  </h3>
                  <div className="bg-brand-50 border border-brand/20 rounded-2xl p-5">
                    <p className="text-3xl font-black text-brand">
                      ₦{Number(selectedApp.amount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-brand/70 font-medium mt-1">
                      Please verify this matches the student's exact tuition
                      fee.
                    </p>
                  </div>
                </div>

                {isPending(selectedApp) && drawerView === "detail" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Confirmed Tuition Amount (optional override)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₦
                      </span>
                      <input
                        type="number"
                        value={confirmedAmount}
                        onChange={(e) => setConfirmedAmount(e.target.value)}
                        placeholder={String(selectedApp.amount ?? "")}
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand outline-none text-sm font-bold"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Leave blank to confirm the originally requested amount.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Student Details
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Full Name</p>
                      <p className="text-sm font-bold text-slate-900">
                        {studentName(selectedApp)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          Class / Grade
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedApp.student?.gradeLevel ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          Student ID
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedApp.student?.studentId ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Applicant (Parent)
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Name</p>
                      <p className="text-sm font-bold text-slate-900">
                        {parentName(selectedApp)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedApp.parent?.email ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Identity</p>
                        <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                          <Icon name="shield-check" className="w-3.5 h-3.5" />{" "}
                          Verified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {drawerView === "reject" && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Reason for Rejection (optional)
                    </h3>
                    <textarea
                      rows={3}
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Describe the issue…"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-red-400 outline-none text-sm resize-none"
                    />
                  </div>
                )}

                {actionError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                    {actionError}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            {isPending(selectedApp) ? (
              drawerView === "detail" ? (
                <>
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mb-3 disabled:opacity-70"
                  >
                    <Icon name="check-circle" className="w-5 h-5" />
                    {actionLoading ? "Verifying…" : "Verify & Approve Amount"}
                  </button>
                  <button
                    onClick={() => setDrawerView("reject")}
                    disabled={actionLoading}
                    className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Reject / Flag Issue
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mb-3 disabled:opacity-70"
                  >
                    <Icon name="x-circle" className="w-5 h-5" />
                    {actionLoading ? "Rejecting…" : "Confirm Rejection"}
                  </button>
                  <button
                    onClick={() => setDrawerView("detail")}
                    disabled={actionLoading}
                    className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Cancel
                  </button>
                </>
              )
            ) : (
              <p className="text-center text-sm text-slate-400 font-medium py-2">
                No actions available for this application.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolApplicationsPage;
