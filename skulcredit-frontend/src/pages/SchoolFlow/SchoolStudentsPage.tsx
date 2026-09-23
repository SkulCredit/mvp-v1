import React, { useState } from "react";
import Icon from "../../components/Icon";
import Pagination from "../../components/ui/Pagination";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";

type Level = "All" | "Primary" | "Secondary" | "Tertiary";
type StatusKey = "Active" | "Pending";

interface Student {
  id: string;
  name: string;
  level: string;
  cls: string;
  status: StatusKey;
}
const STUDENTS: Student[] = [
  {
    id: "STU-001",
    name: "Jone Mane",
    level: "Primary",
    cls: "P2",
    status: "Active",
  },
  {
    id: "STU-002",
    name: "Sarah Okoro",
    level: "Secondary",
    cls: "SS1",
    status: "Pending",
  },
  {
    id: "STU-003",
    name: "Ibrahim Lawal",
    level: "Tertiary",
    cls: "100L",
    status: "Active",
  },
  {
    id: "STU-004",
    name: "Fatima Ahmed",
    level: "Primary",
    cls: "P4",
    status: "Active",
  },
  {
    id: "STU-005",
    name: "Chioma Obi",
    level: "Secondary",
    cls: "SS3",
    status: "Pending",
  },
  {
    id: "STU-006",
    name: "Yusuf Bello",
    level: "Tertiary",
    cls: "HND1",
    status: "Pending",
  },
  {
    id: "STU-007",
    name: "Jone Mane",
    level: "Primary School",
    cls: "P2",
    status: "Active",
  },
  {
    id: "STU-008",
    name: "Jone Mane",
    level: "Primary School",
    cls: "P2",
    status: "Active",
  },
  {
    id: "STU-009",
    name: "Jone Mane",
    level: "Secondary",
    cls: "SS1",
    status: "Pending",
  },
];

const STATUS_CLS: Record<StatusKey, string> = {
  Active: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  Pending: "bg-amber-50  text-amber-600  border border-amber-200",
};

const SchoolStudentsPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<Level>("All");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 5;

  const LEVELS: Level[] = ["All", "Primary", "Secondary", "Tertiary"];

  const filtered = STUDENTS.filter((s) => {
    const matchLevel =
      level === "All" || s.level.toLowerCase().includes(level.toLowerCase());
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
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
      <div className="pt-8 space-y-6 animate-fade-in-up w-[90%] mx-auto">
        {/* Filter + search card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Students</h1>
            <p className="text-sm text-slate-500">
              Manage all students registered under your school
            </p>
          </div>

          {/* Search + Add button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <input
                type="text"
                placeholder="-Type student name or ID-"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <button className="flex items-center gap-2 bg-brand text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-[#7a1848] transition-colors shrink-0">
              <Icon name="plus" className="w-4 h-4" />
              Add Students
            </button>
          </div>

          {/* Level filter pills */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 shrink-0">Filter:</span>
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLevel(l);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  level === l
                    ? "bg-brand text-white"
                    : "border border-slate-200 text-slate-600 hover:border-brand/50 hover:text-brand"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Student list */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">
            Student List
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_40px] px-5 py-3 bg-white border-b border-slate-100 text-sm font-semibold text-slate-700">
              <span>Name</span>
              <span>Level</span>
              <span>Class</span>
              <span>Status</span>
              <span />
            </div>

            {visible.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No students found.
              </div>
            ) : (
              visible.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_40px] items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm text-slate-800">{s.name}</span>
                  <span className="text-sm text-slate-600">{s.level}</span>
                  <span className="text-sm text-slate-600">{s.cls}</span>
                  <span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </span>
                  <Icon
                    name="chevron-right"
                    className="w-4 h-4 text-slate-400"
                  />
                </div>
              ))
            )}
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(filtered.length / PAGE_LIMIT)}
            total={filtered.length}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolStudentsPage;
