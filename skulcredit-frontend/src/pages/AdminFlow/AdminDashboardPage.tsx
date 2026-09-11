import React, { useState } from "react";
import Icon from "../../components/Icon";
import DataTable, { Column } from "../../components/DataTable";
import {
  DashboardLayout,
  DashboardTopBar,
  AdminSidebar,
  AdminTab,
} from "../../components/layout";
import {
  mockSchools,
  mockApplications,
  mockDisbursements,
  MockSchool,
  MockApplication,
  MockDisbursement,
} from "../../services/mockData";

const TAB_LABELS: Record<AdminTab, string> = {
  overview: "Overview",
  schools: "Manage Schools",
  applications: "All Applications",
  disbursements: "Disbursements",
};

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const schoolColumns: Column<MockSchool>[] = [
    {
      header: "School Name",
      accessor: "name",
      render: (row) => (
        <div className="font-bold text-slate-900">{row.name}</div>
      ),
    },
    { header: "Students", accessor: "studentCount" },
    { header: "Applications", accessor: "applicationCount" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            row.status === "verified"
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
  ];

  const appColumns: Column<MockApplication>[] = [
    {
      header: "App ID",
      accessor: "id",
      render: (row) => <div className="font-mono text-xs">{row.id}</div>,
    },
    {
      header: "Parent",
      accessor: "parentName",
      render: (row) => <div className="font-bold">{row.parentName}</div>,
    },
    { header: "School", accessor: "schoolName" },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => `₦${row.amount.toLocaleString()}`,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
          {row.status.replace(/_/g, " ").toUpperCase()}
        </span>
      ),
    },
  ];

  const disburseColumns: Column<MockDisbursement>[] = [
    { header: "ID", accessor: "id" },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => `₦${row.amount.toLocaleString()}`,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
          {row.status.toUpperCase()}
        </span>
      ),
    },
    { header: "Date", accessor: "date" },
  ];

  return (
    <DashboardLayout
      sidebar={
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      }
      header={
        <DashboardTopBar
          heightCls="h-20"
          left={
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {TAB_LABELS[activeTab]}
            </h1>
          }
        />
      }
    >
      <div className="max-w-[1200px] mx-auto space-y-8 pt-8">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: "Total Schools",
                  value: mockSchools.length,
                  icon: "building-2",
                },
                {
                  label: "Applications",
                  value: mockApplications.length,
                  icon: "file-text",
                },
                {
                  label: "Disbursements",
                  value: mockDisbursements.length,
                  icon: "send",
                },
                {
                  label: "Total Disbursed",
                  value: `₦${mockDisbursements.reduce((a, d) => a + d.amount, 0).toLocaleString()}`,
                  icon: "dollar-sign",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 mb-4">
                    <Icon name={stat.icon} className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900">
                    {stat.value}
                  </h3>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4">
                Recent Applications
              </h2>
              <DataTable
                columns={appColumns}
                data={mockApplications}
                searchPlaceholder="Search applications…"
              />
            </div>
          </div>
        )}

        {/* ── SCHOOLS ─────────────────────────────────────────── */}
        {activeTab === "schools" && (
          <div className="animate-fade-in-up">
            <DataTable
              columns={schoolColumns}
              data={mockSchools}
              searchPlaceholder="Search schools…"
            />
          </div>
        )}

        {/* ── APPLICATIONS ────────────────────────────────────── */}
        {activeTab === "applications" && (
          <div className="animate-fade-in-up">
            <DataTable
              columns={appColumns}
              data={mockApplications}
              searchPlaceholder="Search applications…"
            />
          </div>
        )}

        {/* ── DISBURSEMENTS ────────────────────────────────────── */}
        {activeTab === "disbursements" && (
          <div className="animate-fade-in-up">
            <DataTable
              columns={disburseColumns}
              data={mockDisbursements}
              searchPlaceholder="Search disbursements…"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
