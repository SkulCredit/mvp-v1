import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout, AdminSidebar } from "../../components/layout";
import AdminTopBar from "./components/AdminTopBar";
import Icon from "../../components/Icon";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

interface FundingPartner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  contactPerson: string | null;
  status: "active" | "inactive";
  notes: string | null;
  createdAt: string;
}

type ModalMode = "add" | "edit";

interface FormState {
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  status: "active" | "inactive";
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  contactPerson: "",
  status: "active",
  notes: "",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
];

const avatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const AdminFundingPartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<FundingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editTarget, setEditTarget] = useState<FundingPartner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FundingPartner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await apiClient.get("/admin/funding-partners");
      setPartners((res.data.data as FundingPartner[]) ?? []);
    } catch {
      setLoadError("Failed to load funding partners. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const openAdd = () => {
    setModalMode("add");
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (p: FundingPartner) => {
    setModalMode("edit");
    setEditTarget(p);
    setForm({
      name: p.name,
      email: p.email,
      phone: p.phone ?? "",
      contactPerson: p.contactPerson ?? "",
      status: p.status,
      notes: p.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Partner name is required.");
      return;
    }
    if (!form.email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        contactPerson: form.contactPerson.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (modalMode === "add") {
        await apiClient.post("/admin/funding-partners", payload);
      } else {
        await apiClient.put(`/admin/funding-partners/${editTarget!.id}`, payload);
      }
      setModalOpen(false);
      await fetchPartners();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setFormError(
        axErr.response?.data?.message ?? "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/funding-partners/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchPartners();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setDeleteError(
        axErr.response?.data?.message ?? "Failed to delete. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const visible = partners.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.contactPerson ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = partners.filter((p) => p.status === "active").length;
  const inactiveCount = partners.filter((p) => p.status === "inactive").length;

  return (
    <DashboardLayout sidebar={<AdminSidebar />} header={<AdminTopBar />}>
      <div className="max-w-[1280px] mx-auto py-8 px-2 space-y-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Funding Partners
              <span className="px-2.5 py-1 bg-[#881337]/10 text-[#881337] text-sm font-bold rounded-full">
                {partners.length}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage the institutions that fund school fee disbursements.
              Active partners receive disbursement request emails automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#881337] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6f0e2c] transition-colors shrink-0"
          >
            <Icon name="plus" className="w-4 h-4" />
            Add Partner
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Total Partners",
              value: partners.length,
              sub: "Registered funding sources",
              icon: "building-2",
              color: "text-[#881337]",
            },
            {
              label: "Active Partners",
              value: activeCount,
              sub: "Receive disbursement emails",
              icon: "check-circle",
              color: "text-green-600",
            },
            {
              label: "Inactive Partners",
              value: inactiveCount,
              sub: "Not receiving notifications",
              icon: "pause-circle",
              color: "text-slate-400",
            },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-snug">
                  {k.label}
                </p>
                <Icon name={k.icon} className={`w-4 h-4 shrink-0 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-400 mt-2">{k.sub}</p>
            </div>
          ))}
        </div>

        {loadError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 font-medium">
            {loadError}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1">
              {(
                [
                  { key: "all", label: `All (${partners.length})` },
                  { key: "active", label: `Active (${activeCount})` },
                  { key: "inactive", label: `Inactive (${inactiveCount})` },
                ] as { key: "all" | "active" | "inactive"; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    statusFilter === key
                      ? "bg-[#881337]/10 text-[#881337]"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-[220px]">
              <Icon name="search" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
                placeholder="Search by name, email, contact…"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#881337] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="building-2" className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {search || statusFilter !== "all"
                  ? "No partners match your filter"
                  : "No funding partners yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search || statusFilter !== "all"
                  ? "Try clearing the search or filter"
                  : "Add your first partner to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {[
                      "PARTNER NAME",
                      "EMAIL",
                      "PHONE",
                      "CONTACT PERSON",
                      "STATUS",
                      "ADDED",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${avatarColor(p.id)}`}
                          >
                            {initials(p.name)}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {p.name}
                            </p>
                            {p.notes && (
                              <p className="text-xs text-slate-400 truncate max-w-[180px]">
                                {p.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{p.email}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {p.phone ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {p.contactPerson ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.status === "active"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${p.status === "active" ? "bg-green-500" : "bg-slate-400"}`}
                          />
                          {p.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#881337] hover:bg-rose-50 transition-colors"
                            title="Edit"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Icon name="pencil" className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(p);
                              setDeleteError("");
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Icon name="trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && visible.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Showing {visible.length} of {partners.length} partners
              </span>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fp-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
            <h3
              id="fp-modal-title"
              className="text-lg font-bold text-slate-900 mb-1"
            >
              {modalMode === "add" ? "Add Funding Partner" : "Edit Funding Partner"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {modalMode === "add"
                ? "This partner will receive disbursement emails for every approved application."
                : "Update this partner's details. Changes take effect on the next disbursement."}
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Organisation Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Wema Bank"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="partner@bank.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="+234 800 000 0000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Contact Person
                  </label>
                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleFormChange}
                    placeholder="Relationship manager name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 bg-white transition-colors"
                  >
                    <option value="active">Active — receives disbursement emails</option>
                    <option value="inactive">Inactive — paused, no emails sent</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Internal notes (optional)"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 resize-none transition-colors"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border-2 border-slate-200 text-slate-600 font-bold py-2.5 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#881337] text-white font-bold py-2.5 text-sm hover:bg-[#6f0e2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : modalMode === "add" ? (
                    "Add Partner"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="trash-2" className="w-6 h-6 text-red-500" />
            </div>
            <h3
              id="del-modal-title"
              className="text-base font-bold text-slate-900 text-center mb-1"
            >
              Delete Funding Partner?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-5 leading-relaxed">
              <strong>{deleteTarget.name}</strong> will be permanently removed.
              They will no longer receive disbursement notifications.
            </p>

            {deleteError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border-2 border-slate-200 text-slate-600 font-bold py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 text-white font-bold py-2.5 text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete Partner"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminFundingPartnersPage;
