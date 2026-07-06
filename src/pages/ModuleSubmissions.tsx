import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Archive,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useUserNode } from "../hooks/useUserNode";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_def_id: string;
  step_name: string;
  step_type: string;
  step_order: number;
  status: string;
  assignee_role?: string;
  assignee_users?: string[];
  action?: string;
  action_by_user_name?: string;
  comments?: string;
  due_at?: string;
  actioned_at?: string;
}

interface WorkflowInstance {
  id: string;
  submission_id: string;
  workflow_def_id: string;
  workflow_name: string;
  workflow_type: string;
  status: string;
  current_step_id?: string;
  submitted_by_user_name?: string;
  initiated_at?: string;
  completed_at?: string;
  steps: WorkflowStep[];
}

interface SubmissionRecord {
  id: string;
  tenant_id: string;
  project_id: string;
  project_name?: string;
  form_id?: string;
  node_id?: string;
  user_id?: string;
  source?: string;
  status: string;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  is_locked?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  queued: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  processing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400",
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  submitted: <Clock className="h-3.5 w-3.5" />,
  queued: <Clock className="h-3.5 w-3.5" />,
  processing: <RefreshCw className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  failed: <AlertCircle className="h-3.5 w-3.5" />,
  archived: <Archive className="h-3.5 w-3.5" />,
};

const ALL_STATUSES = ["submitted", "queued", "processing", "completed", "failed", "archived"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "—";

function DataViewer({ data }: { data?: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false);
  if (!data || Object.keys(data).length === 0)
    return <span className="text-gray-400 text-xs italic">No data</span>;

  const entries = Object.entries(data);
  const preview = entries.slice(0, 2);

  return (
    <div className="text-xs text-gray-700 dark:text-gray-300">
      {(expanded ? entries : preview).map(([k, v]) => (
        <div key={k} className="flex gap-1">
          <span className="font-medium text-gray-500 dark:text-gray-400 min-w-0 shrink-0">{k}:</span>
          <span className="truncate max-w-[200px]">
            {typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}
          </span>
        </div>
      ))}
      {entries.length > 2 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="mt-0.5 flex items-center gap-0.5 text-blue-600 hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> +{entries.length - 2} more</>
          )}
        </button>
      )}
    </div>
  );
}

// ── Workflow helpers ──────────────────────────────────────────────────────────

const WF_STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  approved:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled:   "bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400",
  skipped:     "bg-gray-100 text-gray-400 dark:bg-gray-700/30 dark:text-gray-500",
};

const WF_TYPE_LABELS: Record<string, string> = {
  approval:     "Approval",
  review:       "Review",
  notification: "Notification",
  hr_leave:     "Leave Approval",
  payment_auth: "Payment Auth",
  custom:       "Custom",
};

function WorkflowPanel({
  submissionId,
  onAction,
}: {
  submissionId: string;
  onAction?: () => void;
}) {
  const { api, user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/submissions/${submissionId}/workflows`);
        if (!cancelled) setWorkflows(res.data?.workflows || []);
      } catch {
        if (!cancelled) setWorkflows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [submissionId, api]);

  const handleAction = async (
    wfId: string,
    stepDefId: string,
    action: "approved" | "rejected" | "reviewed"
  ) => {
    const key = `${wfId}:${stepDefId}`;
    setActioning(key);
    try {
      await api.post(
        `/submissions/${submissionId}/workflows/${wfId}/action/${stepDefId}`,
        { action, comments: commentMap[key] || "" }
      );
      toast.success(`Step ${action} successfully`);
      // Refresh
      const res = await api.get(`/submissions/${submissionId}/workflows`);
      setWorkflows(res.data?.workflows || []);
      onAction?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} step`);
    } finally {
      setActioning(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading workflows…
      </div>
    );

  if (workflows.length === 0)
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
        No workflow add-ons are configured for this module.
      </p>
    );

  return (
    <div className="space-y-4">
      {workflows.map((wf) => (
        <div key={wf.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Workflow header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {wf.workflow_name}
              </span>
              <span className="text-xs text-gray-400">
                ({WF_TYPE_LABELS[wf.workflow_type] || wf.workflow_type})
              </span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${WF_STATUS_COLORS[wf.status] || WF_STATUS_COLORS.pending}`}>
              {wf.status.replace("_", " ")}
            </span>
          </div>

          {/* Steps */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {(wf.steps || []).map((step, idx) => {
              const key = `${wf.id}:${step.step_def_id}`;
              const isActive = step.status === "in_progress";
              const isDone = ["approved", "rejected", "completed", "skipped"].includes(step.status);

              return (
                <div key={step.id} className={`px-4 py-3 ${isActive ? "bg-blue-50/40 dark:bg-blue-950/20" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                        style={{ borderColor: isActive ? "#3b82f6" : isDone ? "#10b981" : "#d1d5db" }}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{step.step_name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {step.assignee_role ? `Role: ${step.assignee_role}` : "Unassigned"}
                          {step.due_at && ` · Due ${new Date(step.due_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${WF_STATUS_COLORS[step.status] || WF_STATUS_COLORS.pending}`}>
                      {step.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Actioned info */}
                  {isDone && step.action_by_user_name && (
                    <div className="mt-2 ml-7 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{step.action_by_user_name}</span>
                      {" "}{step.action} on {formatDate(step.actioned_at)}
                      {step.comments && (
                        <span className="flex items-center gap-1 mt-0.5">
                          <MessageSquare className="h-3 w-3" /> {step.comments}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons — only for in_progress steps */}
                  {isActive && (
                    <div className="mt-3 ml-7 space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Optional comment…"
                        value={commentMap[key] || ""}
                        onChange={(e) =>
                          setCommentMap((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs px-3 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        {step.step_type !== "notification" && (
                          <>
                            <button
                              disabled={!!actioning}
                              onClick={() => handleAction(wf.id, step.step_def_id, "approved")}
                              className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                            >
                              {actioning === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                              Approve
                            </button>
                            {step.step_type === "approval" && (
                              <button
                                disabled={!!actioning}
                                onClick={() => handleAction(wf.id, step.step_def_id, "rejected")}
                                className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                              >
                                {actioning === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                                Reject
                              </button>
                            )}
                          </>
                        )}
                        {step.step_type === "review" && (
                          <button
                            disabled={!!actioning}
                            onClick={() => handleAction(wf.id, step.step_def_id, "reviewed")}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          >
                            {actioning === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            Mark Reviewed
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ModuleSubmissions() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const { nodeId: userNodeId } = useUserNode();

  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("Module");
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit modal
  const [editing, setEditing] = useState<SubmissionRecord | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editStatus, setEditStatus] = useState("submitted");
  const [saving, setSaving] = useState(false);

  // Detail view
  const [viewing, setViewing] = useState<SubmissionRecord | null>(null);

  // Retry loading
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
      if (terminal) {
        return terminal;
      }
    }

    throw new Error("No terminal job status received in polling window");
  };

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!userNodeId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let tenantId = user?.tenantId || "";

      if (projectId) {
        // Fetch project form to get name and tenantId
        const [formRes] = await Promise.allSettled([
          api.get(`/project-forms/project/${projectId}`),
        ]);

        const formData =
          formRes.status === "fulfilled" ? formRes.value.data : null;
        const name =
          formData?.configuration?.projectName || formData?.projectName || "Module";
        setProjectName(name);
        tenantId =
          formData?.tenantId ||
          formData?.tenant_id ||
          user?.tenantId ||
          "";
      } else {
        setProjectName("All Modules");
      }

      if (!tenantId) {
        toast.error("Unable to determine tenant — submissions cannot be loaded.");
        return;
      }

      // Fetch from unified /submissions endpoint (PostgreSQL)
      const params = new URLSearchParams({
        tenant_id: tenantId,
        nodeId: userNodeId,
      });
      if (projectId) params.set("project_id", projectId);
      const subRes = await api.get(`/submissions?${params.toString()}`);
      const rows: SubmissionRecord[] = subRes.data?.results || subRes.data?.submissions || subRes.data || [];
      setSubmissions(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [projectId, api, user, userNodeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const openEdit = (s: SubmissionRecord) => {
    if (s.is_locked) {
      toast.error("Submission period is locked and cannot be edited");
      return;
    }
    setEditing(s);
    setEditStatus(s.status || "submitted");
    setEditJson(JSON.stringify(s.data || {}, null, 2));
  };
  const closeEdit = () => { setEditing(null); setEditJson(""); };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const parsed = JSON.parse(editJson || "{}");
      const updateRes = await api.patch(`/submissions/${editing.id}`, {
        payload: parsed,
        status: editStatus,
      });
      const jobId = updateRes.data?.jobId;
      if (jobId) {
        toast.loading("Update queued, waiting for completion…", { id: `job-${jobId}` });
        const terminal = await waitForJobTerminalStatus(jobId);
        toast.dismiss(`job-${jobId}`);
        if (String(terminal?.status || "").toLowerCase() === "failed") {
          throw new Error(terminal?.message || "Update job failed");
        }
      }
      toast.success("Submission updated");
      closeEdit();
      await loadData();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        toast.error("Invalid JSON — please fix before saving");
      } else {
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to update submission"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: SubmissionRecord) => {
    if (s.is_locked) {
      toast.error("Submission period is locked and cannot be deleted");
      return;
    }
    if (!window.confirm("Permanently delete this submission?")) return;
    try {
      const deleteRes = await api.delete(`/submissions/${s.id}`);
      const jobId = deleteRes.data?.jobId;
      if (jobId) {
        toast.loading("Delete queued, waiting for completion…", { id: `job-${jobId}` });
        const terminal = await waitForJobTerminalStatus(jobId);
        toast.dismiss(`job-${jobId}`);
        if (String(terminal?.status || "").toLowerCase() === "failed") {
          throw new Error(terminal?.message || "Delete job failed");
        }
      }
      toast.success("Submission deleted");
      await loadData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to delete submission"
      );
    }
  };

  const handleRetry = async (s: SubmissionRecord) => {
    if (s.status !== "failed") {
      toast.error("Only failed submissions can be retried");
      return;
    }
    try {
      setRetryingId(s.id);
      const res = await api.post(`/submissions/${s.id}/retry`);
      const jobId = res.data?.jobId;
      if (jobId) {
        toast.loading("Retry queued, waiting for completion…", { id: `job-${jobId}` });
        const terminal = await waitForJobTerminalStatus(jobId);
        toast.dismiss(`job-${jobId}`);
        if (String(terminal?.status || "").toLowerCase() === "failed") {
          throw new Error(terminal?.message || "Retry job failed");
        }
      }
      toast.success(res.data?.message || "Submission retried successfully");
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectName} — Submissions
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {submissions.length} total submission{submissions.length !== 1 ? "s" : ""}
            {statusFilter !== "all" && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
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

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", ...ALL_STATUSES].map((s) => {
          const count =
            s === "all"
              ? submissions.length
              : submissions.filter((sub) => sub.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}{" "}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  "Submission ID",
                  "Status",
                  "Source",
                  "Data Preview",
                  "Submitted At",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 ${
                      h === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                      {sub.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[sub.status] ?? STATUS_COLORS.submitted
                      }`}
                    >
                      {STATUS_ICONS[sub.status] ?? <Clock className="h-3.5 w-3.5" />}
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {sub.source || "—"}
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <DataViewer data={sub.data} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(sub.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => setViewing(sub)}
                        title="View details & workflows"
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        <GitBranch className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewing(sub)}
                        title="View full details"
                        className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(sub)}
                        title={sub.is_locked ? "Locked submission cannot be edited" : "Edit submission"}
                        disabled={Boolean(sub.is_locked)}
                        className="rounded-md border border-gray-200 p-1.5 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {sub.status === "failed" && (
                        <button
                          onClick={() => handleRetry(sub)}
                          disabled={retryingId === sub.id}
                          title="Retry failed submission"
                          className="rounded-md border border-amber-200 p-1.5 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                        >
                          {retryingId === sub.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(sub)}
                        title={sub.is_locked ? "Locked submission cannot be deleted" : "Delete submission"}
                        disabled={Boolean(sub.is_locked)}
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {statusFilter === "all"
                      ? "No submissions found for this module yet."
                      : `No "${statusFilter}" submissions.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Detail Modal ── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Submission Detail
              </h2>
              <button
                onClick={() => setViewing(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-3 text-sm">
              {[
                ["ID", viewing.id],
                ["Status", viewing.status],
                ["Source", viewing.source],
                ["Project ID", viewing.project_id],
                ["Form ID", viewing.form_id],
                ["Node ID", viewing.node_id],
                ["User ID", viewing.user_id],
                ["Submitted At", formatDate(viewing.created_at)],
                ["Updated At", formatDate(viewing.updated_at)],
              ].map(([label, val]) =>
                val ? (
                  <div key={label as string} className="flex gap-3">
                    <span className="w-28 shrink-0 font-medium text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                    <span className="break-all text-gray-800 dark:text-gray-200">{val}</span>
                  </div>
                ) : null
              )}
              <div>
                <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">Payload Data</p>
                <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-800 dark:text-gray-200">
                  {JSON.stringify(viewing.data ?? {}, null, 2)}
                </pre>
              </div>
              {viewing.meta && Object.keys(viewing.meta).length > 0 && (
                <div>
                  <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">Meta</p>
                  <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-800 dark:text-gray-200">
                    {JSON.stringify(viewing.meta, null, 2)}
                  </pre>
                </div>
              )}

              {/* ── Workflow Add-ons ── */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-medium text-gray-500 dark:text-gray-400">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                  Workflow Add-ons
                </p>
                <WorkflowPanel submissionId={viewing.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Edit Submission
              </h2>
              <button
                onClick={closeEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payload (JSON)
                </label>
                <textarea
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={closeEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
