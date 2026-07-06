import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useUserNode } from "../hooks/useUserNode";
import ParityFormRenderer from "../components/FormRendererParity/ParityFormRenderer";

type SortDirection = "asc" | "desc";

interface ModuleColumn {
  key: string;
  label: string;
}

interface SubmissionDetail {
  id: string;
  status?: string;
  data?: Record<string, any>;
  payload?: Record<string, any>;
}

export default function ModuleReportSubmissions() {
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const { nodeId: userNodeId } = useUserNode();
  const { moduleId = "", tenantId = "", nodeId = "" } = useParams<{
    moduleId: string;
    tenantId?: string;
    nodeId?: string;
  }>();

  const effectiveNodeId = nodeId || userNodeId || "";
  const effectiveTenantId = tenantId || user?.tenantId || "";

  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Module Report");
  const [moduleForm, setModuleForm] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [month, setMonth] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [columns, setColumns] = useState<ModuleColumn[]>([]);
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);

  const [sortKey, setSortKey] = useState<string>("submitted_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [activeMode, setActiveMode] = useState<"view" | "edit" | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string>("");
  const [activeSubmission, setActiveSubmission] = useState<SubmissionDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch, month, effectiveNodeId]);

  const waitForJobTerminalStatus = async (
    jobId: string,
    opts: { attempts?: number; intervalMs?: number } = {}
  ) => {
    const attempts = opts.attempts ?? 25;
    const intervalMs = opts.intervalMs ?? 1200;

    for (let i = 0; i < attempts; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      // eslint-disable-next-line no-await-in-loop
      const res = await api.get(`/submissions/activity-log/job/${jobId}`);
      const logs = res.data?.data || res.data?.results || [];
      const terminal = logs.find((entry: any) => {
        const status = String(entry?.status || "").toLowerCase();
        return status === "success" || status === "failed";
      });
      if (terminal) return terminal;
    }

    throw new Error("No terminal job status received in polling window");
  };

  const loadModuleForm = useCallback(async () => {
    if (!moduleId) return;
    try {
      const res = await api.get(`/project-forms/project/${moduleId}`);
      setModuleForm(res.data || null);
      setProjectName(
        res.data?.configuration?.projectName ||
          res.data?.projectName ||
          "Module Report"
      );
    } catch {
      setModuleForm(null);
    }
  }, [api, moduleId]);

  const loadTable = useCallback(async () => {
    if (!moduleId) return;
    if (!effectiveNodeId && !user?.isOwner && !user?.isSuper && !user?.isSaby) {
      setTableError("Node ID is required to load this module report.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setTableError(null);
      const params: Record<string, any> = {
        project_id: moduleId,
        node_id: effectiveNodeId || undefined,
        search: debouncedSearch || undefined,
        month: month || undefined,
        limit: pageSize,
        offset: pageIndex * pageSize,
      };
      const response = await api.get("/submission-reports/module-table", { params });
      const payload = response.data || {};
      setColumns(payload.columns || []);
      setDisplayOrder(payload.display_order || []);
      setRows(payload.rows || []);
      setTotal(Number(payload.total || 0));
    } catch (error: any) {
      setTableError(
        error?.response?.data?.message || error?.message || "Failed to load module report"
      );
    } finally {
      setLoading(false);
    }
  }, [
    api,
    debouncedSearch,
    effectiveNodeId,
    moduleId,
    month,
    pageIndex,
    pageSize,
    user?.isOwner,
    user?.isSaby,
    user?.isSuper,
  ]);

  useEffect(() => {
    loadModuleForm();
  }, [loadModuleForm]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  const orderedColumns = useMemo(() => {
    const keyed = new Map(columns.map((column) => [column.key, column]));
    const order = displayOrder.length ? displayOrder : columns.map((column) => column.key);
    return order
      .map((key) => keyed.get(key))
      .filter((column): column is ModuleColumn => Boolean(column))
      .filter((column) => !["sn", "submission_id"].includes(column.key));
  }, [columns, displayOrder]);

  const sortableRows = useMemo(() => {
    if (!sortKey) return rows;
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const av = a?.[sortKey];
      const bv = b?.[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDirection === "asc" ? av - bv : bv - av;
      }
      return sortDirection === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [rows, sortDirection, sortKey]);

  const toggleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const openSubmission = async (submissionId: string, mode: "view" | "edit") => {
    try {
      setActiveMode(mode);
      setActiveSubmissionId(submissionId);
      setModalLoading(true);
      const response = await api.get(`/submissions/${submissionId}`);
      const submission = response.data?.submission;
      setActiveSubmission({
        id: submission?.id || submissionId,
        status: submission?.status || "submitted",
        data: submission?.data || submission?.payload || {},
        payload: submission?.payload || submission?.data || {},
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load submission");
      setActiveMode(null);
      setActiveSubmissionId("");
      setActiveSubmission(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setActiveMode(null);
    setActiveSubmissionId("");
    setActiveSubmission(null);
    setModalLoading(false);
  };

  const handleEditSave = async (values: Record<string, any>) => {
    if (!activeSubmissionId) return;
    try {
      setSaving(true);
      const response = await api.patch(`/submissions/${activeSubmissionId}`, {
        payload: values,
        status: activeSubmission?.status || "submitted",
      });

      const jobId = response.data?.jobId;
      if (jobId) {
        toast.loading("Update queued, waiting for completion…", { id: `job-${jobId}` });
        const terminal = await waitForJobTerminalStatus(jobId);
        toast.dismiss(`job-${jobId}`);
        if (String(terminal?.status || "").toLowerCase() === "failed") {
          throw new Error(terminal?.message || "Update job failed");
        }
      }
      toast.success("Submission updated");
      closeModal();
      await loadTable();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm("Delete this submission permanently?")) return;
    try {
      const response = await api.delete(`/submissions/${submissionId}`);
      const jobId = response.data?.jobId;
      if (jobId) {
        toast.loading("Delete queued, waiting for completion…", { id: `job-${jobId}` });
        const terminal = await waitForJobTerminalStatus(jobId);
        toast.dismiss(`job-${jobId}`);
        if (String(terminal?.status || "").toLowerCase() === "failed") {
          throw new Error(terminal?.message || "Delete job failed");
        }
      }
      toast.success("Submission deleted");
      await loadTable();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Delete failed");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectName} — Module Report
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tenant: {effectiveTenantId || "auto"} · Node: {effectiveNodeId || "auto"} ·
            Total: {total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTable}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Modules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search submissions..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
        <input
          type="month"
          value={month ? month.slice(0, 7) : ""}
          onChange={(e) => setMonth(e.target.value ? `${e.target.value}-01` : "")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
        <select
          value={String(pageSize)}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          Backend pagination/filtering enabled
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : tableError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {tableError}
        </div>
      ) : orderedColumns.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          No report columns available for this module yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {orderedColumns.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
                    >
                      <button
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 hover:text-blue-600"
                      >
                        {column.label}
                        {sortKey === column.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : null}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={orderedColumns.length + 1}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      No submissions available for this module.
                    </td>
                  </tr>
                ) : (
                  sortableRows.map((row, index) => {
                    const submissionId = String(
                      row.submission_id || row.id || `row-${pageIndex}-${index}`
                    );
                    return (
                      <tr
                        key={submissionId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        {orderedColumns.map((column) => {
                          const value = row[column.key];
                          return (
                            <td
                              key={`${submissionId}-${column.key}`}
                              className="max-w-[220px] truncate px-4 py-3 text-xs text-gray-700 dark:text-gray-300"
                              title={
                                value === null || value === undefined ? "—" : String(value)
                              }
                            >
                              {value === null || value === undefined || String(value) === ""
                                ? "—"
                                : String(value)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openSubmission(submissionId, "view")}
                              className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openSubmission(submissionId, "edit")}
                              className="rounded-md border border-gray-200 p-1.5 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(submissionId)}
                              className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs dark:border-gray-700">
            <span className="text-gray-500">
              Page {pageIndex + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pageIndex <= 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                className="rounded-md border border-gray-300 px-2.5 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pageIndex + 1 >= totalPages}
                onClick={() => setPageIndex((p) => p + 1)}
                className="rounded-md border border-gray-300 px-2.5 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {activeMode === "view" ? "View Submission" : "Edit Submission"}
              </h2>
              <button
                disabled={saving}
                onClick={closeModal}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(90vh-56px)] overflow-y-auto p-4">
              {modalLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                </div>
              ) : moduleForm && activeSubmission ? (
                <ParityFormRenderer
                  form={moduleForm}
                  mode={activeMode}
                  initialValues={activeSubmission.data || {}}
                  submitLabel="Save Submission"
                  onSubmit={activeMode === "edit" ? handleEditSave : undefined}
                  disableSubmit={saving}
                />
              ) : (
                <div className="text-sm text-gray-500">Unable to load submission details.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

