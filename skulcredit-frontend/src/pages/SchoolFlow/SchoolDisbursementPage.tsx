import React, { useState } from "react";
import Icon from "../../components/Icon";
import Pagination from "../../components/ui/Pagination";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";

type DisbStatus = "Completed" | "Pending";

interface DisbRow {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: DisbStatus;
  ref: string;
}

const ROWS: DisbRow[] = [
  {
    id: "DISB-20250113-001",
    name: "Amaka N.",
    amount: 150000,
    date: "20 Nov",
    status: "Completed",
    ref: "SCH-23832",
  },
  {
    id: "DISB-20250114-001",
    name: "John O.",
    amount: 200000,
    date: "18 Nov",
    status: "Completed",
    ref: "SCH-23835",
  },
  {
    id: "DISB-20250115-001",
    name: "Sarah A.",
    amount: 120000,
    date: "Pending",
    status: "Pending",
    ref: "SCH-23836",
  },
  {
    id: "DISB-20250116-001",
    name: "Ibrahim K.",
    amount: 180000,
    date: "19 Nov",
    status: "Completed",
    ref: "SCH-23837",
  },
  {
    id: "DISB-20250117-001",
    name: "Chioma P.",
    amount: 95000,
    date: "17 Nov",
    status: "Pending",
    ref: "SCH-238390",
  },
  {
    id: "DISB-20250118-001",
    name: "Yusuf M.",
    amount: 200000,
    date: "19 Nov",
    status: "Completed",
    ref: "SCH-238323",
  },
];

const TOTAL_DISBURSED = ROWS.filter((r) => r.status === "Completed").reduce(
  (s, r) => s + r.amount,
  0,
);
const TOTAL_PENDING = ROWS.filter((r) => r.status === "Pending").reduce(
  (s, r) => s + r.amount,
  0,
);
const LAST_PAYMENT = "20 Nov 2025";

const STATUS_CLS: Record<DisbStatus, string> = {
  Completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  Pending: "bg-amber-50  text-amber-600  border border-amber-200",
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-800 text-right">
      {value}
    </span>
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
    <h3 className="text-sm font-bold text-brand mb-3 pb-2 border-b border-slate-100">
      {title}
    </h3>
    {children}
  </div>
);

const DisbursementDetail: React.FC<{ row: DisbRow; onBack: () => void }> = ({
  row,
  onBack,
}) => (
  <div className="max-w-2xl mx-auto pt-8 space-y-5 animate-fade-in-up">
    {/* Back link */}
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
    >
      <Icon name="arrow-left" className="w-4 h-4" />
      Back to Disbursements
    </button>

    <h1 className="text-xl font-bold text-slate-900">Disbursement Details</h1>

    {/* Disbursement Summary */}
    <SectionCard title="Disbursement Summary">
      <DetailRow
        label="Amount Disbursed:"
        value={`₦${row.amount.toLocaleString()}`}
      />
      <DetailRow
        label="Status:"
        value={
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[row.status]}`}
          >
            {row.status}
          </span>
        }
      />
      <DetailRow label="Disbursement ID:" value={row.id} />
      <DetailRow
        label="Amount Disbursed:"
        value={`₦${row.amount.toLocaleString()}`}
      />
      <DetailRow label="Payment Reference:" value="SC-REF-985234" />
    </SectionCard>

    {/* Student Information */}
    <SectionCard title="Student Information">
      <DetailRow label="Student Name:" value="Chidi Okafor" />
      <DetailRow label="Level:" value="Secondary" />
      <DetailRow label="Class:" value="SS2" />
      <DetailRow label="Student ID:" value="STU-2048" />
      <DetailRow label="Payment Reference:" value="SC-REF-985234" />
    </SectionCard>

    {/* Parent Information */}
    <SectionCard title="Parent Information">
      <DetailRow label="Parent/Guardian:" value="Mrs. Okafor" />
      <DetailRow label="Phone:" value="0803 123 4567" />
      <DetailRow label="Relationship:" value="Mother" />
    </SectionCard>

    {/* Bank Payment Details */}
    <SectionCard title="Bank Payment Details">
      <DetailRow label="Paid To:" value="Springfield High School" />
      <DetailRow label="Account Number:" value="0123456789" />
      <DetailRow label="Bank:" value="Zenith Bank" />
      <DetailRow
        label="Payment Method::"
        value={`₦${row.amount.toLocaleString()}`}
      />
      <DetailRow
        label="Receipt:"
        value={
          <button className="flex items-center gap-1.5 text-brand text-sm font-semibold hover:underline">
            <Icon name="download" className="w-4 h-4" />
            Download Receipt
          </button>
        }
      />
    </SectionCard>

    {/* Action */}
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-3">Action</h3>
      <div className="flex gap-3">
        <button className="flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-50 transition-colors">
          <Icon name="download" className="w-4 h-4" />
          Download PDF
        </button>
        <button className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#7a1848] transition-colors">
          <Icon name="headset" className="w-4 h-4" />
          Contact Support
        </button>
      </div>
    </div>
  </div>
);

const SchoolDisbursementPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [detail, setDetail] = useState<DisbRow | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 5;

  const filtered = ROWS.filter((r) => {
    const matchStatus =
      statusFilter === "All Status" || r.status === statusFilter;
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.ref.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const visible = filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  return (
    <DashboardLayout
      sidebar={
        <SchoolSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={<SchoolTopBar onMobileMenuOpen={() => setMobileNavOpen(true)} />}
    >
      {detail ? (
        <DisbursementDetail row={detail} onBack={() => setDetail(null)} />
      ) : (
        <div className="pt-8 space-y-6 animate-fade-in-up w-[90%] mx-auto">
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h1 className="text-lg font-bold text-slate-900">Disbursement</h1>
            <p className="text-sm text-slate-500 mb-5">
              Track all tuition payments sent to your school
            </p>
            <div className="grid grid-cols-3 gap-4 divide-x divide-slate-100">
              <div className="text-center pr-4">
                <p className="text-xs text-slate-500 mb-1">Total Disbursed</p>
                <p className="text-xl font-bold text-slate-900">
                  ₦{TOTAL_DISBURSED.toLocaleString()}
                </p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-slate-500 mb-1">
                  Pending Disbursement
                </p>
                <p className="text-xl font-bold text-slate-900">
                  ₦{TOTAL_PENDING.toLocaleString()}
                </p>
              </div>
              <div className="text-center pl-4">
                <p className="text-xs text-slate-500 mb-1">Last Payment</p>
                <p className="text-xl font-bold text-brand">{LAST_PAYMENT}</p>
              </div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <input
                type="text"
                placeholder="-Search by student or payment reference ID-"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-brand text-white text-sm font-semibold pl-4 pr-9 py-2.5 rounded-lg focus:outline-none cursor-pointer"
              >
                {["All Status", "Completed", "Pending"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Icon
                name="calendar"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none"
              />
            </div>
          </div>

          {/* History table */}
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-3">
              Disbursement History
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_2fr_1fr] px-5 py-3 border-b border-slate-100 text-sm font-semibold text-brand">
                <span>Student</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Status</span>
                <span>Payment Ref</span>
                <span>Action</span>
              </div>

              {visible.map((r, i) => (
                <div
                  key={`${r.ref}-${i}`}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_2fr_1fr] items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {r.name}
                  </span>
                  <span className="text-sm text-slate-700">
                    ₦{r.amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">{r.date}</span>
                  <span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </span>
                  <span className="text-sm font-mono text-slate-500">
                    {r.ref}
                  </span>
                  <button
                    onClick={() => setDetail(r)}
                    className="border border-brand text-brand text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand/5 transition-colors w-fit"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(filtered.length / PAGE_LIMIT)}
            total={filtered.length}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />

          {/* Export row */}
          <div className="flex gap-3 pb-4">
            <button className="flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-50 transition-colors">
              <Icon name="download" className="w-4 h-4" />
              Export CVS
            </button>
            <button className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#7a1848] transition-colors">
              <Icon name="file-text" className="w-4 h-4" />
              Download Statement
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchoolDisbursementPage;
