"use client";

import {
  Loader2, Zap, Plus, Trash2, Mail, MessageCircle, Webhook,
  Rss, ChevronDown, ChevronUp, Pause, Check, ArrowRight, Edit
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const TRIGGER_OPTIONS = [
  { value: "new_post", label: "New Post Published", description: "Triggers whenever a post is published in this organization." },
  { value: "scheduled", label: "Scheduled Event", description: "Triggers on a fixed schedule.", hasSchedule: true },
  { value: "manual", label: "Manual Trigger", description: "Triggers only when explicitly selected during post creation." },
];

const ACTION_TYPES = [
  { value: "email", label: "Send Email", icon: Mail, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", description: "Send post content via email using your own SMTP server." },
  { value: "discord", label: "Discord Webhook", icon: MessageCircle, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400", description: "Post a message to a Discord channel via webhook." },
  { value: "http", label: "HTTP Webhook", icon: Webhook, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", description: "Send a JSON payload to any URL." },
  { value: "slack", label: "Slack", icon: MessageCircle, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", description: "Post to a Slack channel." },
  { value: "twitter", label: "Twitter (X)", icon: Webhook, color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400", description: "Post to X." },
  { value: "bluesky", label: "Bluesky", icon: Webhook, color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400", description: "Post to Bluesky." },
];

interface Action {
  type: string;
  config: Record<string, string>;
}

interface WorkflowForm {
  name: string;
  trigger: string;
  actions: Action[];
}

function ActionEditor({ action, onChange, onRemove }: { action: Action; onChange: (a: Action) => void; onRemove: () => void }) {
  const def = ACTION_TYPES.find((a) => a.value === action.type)!;
  const Icon = def?.icon ?? Webhook;
  const [handle, setHandle] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${def?.color}`}>
          <Icon className="h-4 w-4" />
          {def?.label}
        </div>
        <button onClick={onRemove} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {action.type === "email" && (
        <div className="space-y-2">
          <input type="text" placeholder="SMTP Host" value={action.config.smtpHost || ""} onChange={(e) => onChange({ ...action, config: { ...action.config, smtpHost: e.target.value } })} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
          <input type="number" placeholder="SMTP Port" value={action.config.smtpPort || ""} onChange={(e) => onChange({ ...action, config: { ...action.config, smtpPort: e.target.value } })} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
          <input type="text" placeholder="SMTP Username" value={action.config.smtpUser || ""} onChange={(e) => onChange({ ...action, config: { ...action.config, smtpUser: e.target.value } })} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
          <input type="password" placeholder="SMTP Password" value={action.config.smtpPass || ""} onChange={(e) => onChange({ ...action, config: { ...action.config, smtpPass: e.target.value } })} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
          <input type="text" placeholder="From Email" value={action.config.fromEmail || ""} onChange={(e) => onChange({ ...action, config: { ...action.config, fromEmail: e.target.value } })} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
          <input type="text" placeholder="To (comma-separated)" value={action.config.to || ""} onChange={(e) => onChange({ ...action, config: { ...action.config, to: e.target.value } })} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
        </div>
      )}

      {action.type === "discord" && (
        <input
          type="url"
          placeholder="Discord Webhook URL"
          value={action.config.webhookUrl || ""}
          onChange={(e) => onChange({ ...action, config: { ...action.config, webhookUrl: e.target.value } })}
          className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
        />
      )}

      {action.type === "slack" && (
        <input
          type="url"
          placeholder="Slack Webhook URL"
          value={action.config.webhookUrl || ""}
          onChange={(e) => onChange({ ...action, config: { ...action.config, webhookUrl: e.target.value } })}
          className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
        />
      )}

      {action.type === "twitter" && (
        <div className="space-y-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> Twitter integration is currently disabled as it requires a paid API subscription.
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This will automatically tweet the post title and content.
          </p>
        </div>
      )}

      {action.type === "bluesky" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mt-2">
            Connect your Bluesky account to automate posts.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Handle" 
              className="px-3 py-2 border rounded-lg bg-background text-sm flex-1"
              onChange={(e) => setHandle(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="px-3 py-2 border rounded-lg bg-background text-sm flex-1"
              onChange={(e) => setPass(e.target.value)}
            />
            <Button size="sm" onClick={async () => {
              const res = await fetch("/api/bluesky/connect", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({handle, password: pass}), credentials: "include" });
              if (res.ok) toast.success("Bluesky connected!");
              else toast.error("Failed to connect");
            }}>Connect</Button>
          </div>
        </div>
      )}

      {action.type === "http" && (
        <div className="space-y-2">
          <input
            type="url"
            placeholder="Endpoint URL"
            value={action.config.url || ""}
            onChange={(e) => onChange({ ...action, config: { ...action.config, url: e.target.value } })}
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
          />
          <select
            value={action.config.method || "POST"}
            onChange={(e) => onChange({ ...action, config: { ...action.config, method: e.target.value } })}
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
      )}

      {action.type === "rss" && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          RSS feed is automatically maintained at <span className="font-mono text-primary">/api/rss/[org-slug]</span>. No additional config needed.
        </p>
      )}
    </div>
  );
}

function WorkflowCard({ workflow, onToggle, onDelete, onEdit }: { workflow: any; onToggle: () => void; onDelete: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const actions: Action[] = JSON.parse(workflow.actions || "[]");
  const triggerDef = TRIGGER_OPTIONS.find((t) => t.value === workflow.trigger);

  return (
    <div className={cn("bg-background rounded-xl border overflow-hidden transition-all", workflow.active ? "" : "opacity-60")}>
      <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={cn("mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0", workflow.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{workflow.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground/70">Trigger:</span> {triggerDef?.label || workflow.trigger}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground/70">Actions:</span>{" "}
              {actions.map((a) => ACTION_TYPES.find((t) => t.value === a.type)?.label || a.type).join(", ") || "None"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", workflow.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200" : "bg-muted text-muted-foreground hover:bg-muted/80")}
          >
            {workflow.active ? <><Check className="h-3.5 w-3.5" /> Active</> : <><Pause className="h-3.5 w-3.5" /> Paused</>}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onEdit} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && actions.length > 0 && (
        <div className="border-t px-4 sm:px-5 py-4 space-y-3 bg-muted/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action Details</p>
          {actions.map((action, i) => {
            const def = ACTION_TYPES.find((a) => a.value === action.type);
            const Icon = def?.icon ?? Webhook;
            return (
              <div key={i} className={`flex items-start gap-3 rounded-lg p-3 text-sm ${def?.color || "bg-muted"}`}>
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{def?.label}</p>
                  {Object.entries(action.config || {}).filter(([, v]) => v).map(([k, v]) => (
                    <p key={k} className="text-xs opacity-80 truncate">{k}: {v as string}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AutomationPage() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"trigger" | "actions" | "name">("trigger");
  const [form, setForm] = useState<WorkflowForm>({ name: "", trigger: "", actions: [] });
  const [workflowToDelete, setWorkflowToDelete] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    async function load() {
      const res = await fetch("/api/orgs/user/mine", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
        if (data.length > 0) setSelectedOrgId(data[0].id.toString());
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!selectedOrgId) return;
    fetchWorkflows();
  }, [selectedOrgId]);

  async function fetchWorkflows() {
    const res = await fetch(`/api/workflows/org/${selectedOrgId}`, { credentials: "include" });
    if (res.ok) setWorkflows(await res.json());
  }

  async function saveWorkflow() {
    if (!form.name || !form.trigger || form.actions.length === 0) {
      toast.error("Please complete all steps before saving.");
      return;
    }
    setSaving(true);
    const url = editingWorkflow ? `/api/workflows/${editingWorkflow.id}` : "/api/workflows";
    const method = editingWorkflow ? "PUT" : "POST";
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: parseInt(selectedOrgId),
        name: form.name,
        trigger: form.trigger,
        actions: JSON.stringify(form.actions),
        active: editingWorkflow ? editingWorkflow.active : true
      }),
      credentials: "include",
    });
    if (res.ok) {
      toast.success(editingWorkflow ? "Automation workflow updated!" : "Automation workflow created!");
      setShowCreate(false);
      setEditingWorkflow(null);
      setForm({ name: "", trigger: "", actions: [] });
      setStep("trigger");
      fetchWorkflows();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save workflow");
    }
    setSaving(false);
  }

  function editWorkflow(workflow: any) {
    setEditingWorkflow(workflow);
    setForm({
      name: workflow.name,
      trigger: workflow.trigger,
      actions: JSON.parse(workflow.actions),
    });
    setStep("trigger");
    setShowCreate(true);
  }

  async function toggleWorkflow(workflow: any) {
    const res = await fetch(`/api/workflows/${workflow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...workflow, active: !workflow.active }),
      credentials: "include",
    });
    if (res.ok) {
      setWorkflows((prev) => prev.map((w) => w.id === workflow.id ? { ...w, active: !w.active } : w));
    }
  }

  async function deleteWorkflow(id: number) {
    await fetch(`/api/workflows/${id}`, { method: "DELETE", credentials: "include" });
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    toast.success("Workflow deleted.");
    setWorkflowToDelete(null);
  }

  function addAction(type: string) {
    setForm((prev) => ({ ...prev, actions: [...prev.actions, { type, config: {} }] }));
  }

  if (loading || authLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedOrg = orgs.find((o) => o.id.toString() === selectedOrgId);
  const canManage = selectedOrg?.role === "owner" || selectedOrg?.role === "admin" || selectedOrg?.role === "editor";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Modal isOpen={workflowToDelete !== null} onClose={() => setWorkflowToDelete(null)} title="Delete Workflow">
        <p className="text-muted-foreground mb-4">Are you sure you want to delete this workflow?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setWorkflowToDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteWorkflow(workflowToDelete!)}>Delete</Button>
        </div>
      </Modal>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically push posts to external platforms when published.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {orgs.length > 0 && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-background text-sm font-medium"
            >
              {orgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          )}
          {canManage && (
            <div className="flex gap-2">
              <a href={`/api/rss/${selectedOrg?.slug}`} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                <Rss className="h-4 w-4" />
                RSS
              </a>
              <button
                onClick={() => { setShowCreate(true); setStep("trigger"); setForm({ name: "", trigger: "", actions: [] }); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Workflow
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Wizard */}
      {showCreate && (
        <div className="bg-background rounded-2xl border shadow-sm overflow-hidden">
          {/* Steps indicator */}
          <div className="flex border-b">
            {(["trigger", "actions", "name"] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  step === s ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {i + 1}. {s === "trigger" ? "Choose Trigger" : s === "actions" ? "Add Actions" : "Name & Save"}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {/* Step 1: Trigger */}
            {step === "trigger" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">When should this workflow run?</p>
                {TRIGGER_OPTIONS.map((trigger) => (
                  <button
                    key={trigger.value}
                    onClick={() => { 
                      setForm((prev) => ({ ...prev, trigger: trigger.value })); 
                      if (!trigger.hasSchedule) setStep("actions");
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      form.trigger === trigger.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="font-semibold text-sm">{trigger.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{trigger.description}</p>
                    
                    {trigger.hasSchedule && form.trigger === trigger.value && (
                      <div className="mt-3 pt-3 border-t">
                        <label className="text-xs font-medium">Frequency</label>
                        <select 
                          className="w-full px-2 py-1 mt-1 border rounded text-xs"
                          onChange={(e) => setForm(prev => ({...prev, config: {...prev.config, frequency: e.target.value}}))}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <label className="text-xs font-medium mt-2 block">At Time</label>
                        <input 
                          type="time" 
                          className="w-full px-2 py-1 mt-1 border rounded text-xs"
                          onChange={(e) => setForm(prev => ({...prev, config: {...prev.config, time: e.target.value}}))}
                        />
                        <Button size="sm" className="mt-2 text-xs w-full" onClick={() => setStep("actions")}>Continue</Button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Actions */}
            {step === "actions" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">What should happen? Add one or more actions.</p>

                {/* Current actions */}
                {form.actions.map((action, i) => (
                  <ActionEditor
                    key={i}
                    action={action}
                    onChange={(updated) => setForm((prev) => ({ ...prev, actions: prev.actions.map((a, j) => j === i ? updated : a) }))}
                    onRemove={() => setForm((prev) => ({ ...prev, actions: prev.actions.filter((_, j) => j !== i) }))}
                  />
                ))}

                {/* Add action buttons */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Add Action</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {ACTION_TYPES.map((actionType) => {
                      const Icon = actionType.icon;
                      return (
                        <button
                          key={actionType.value}
                          onClick={() => addAction(actionType.value)}
                          className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed text-sm transition-all hover:border-primary/60 hover:bg-primary/5 border-border"
                        >
                          <div className={`p-1.5 rounded-lg ${actionType.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-medium leading-tight">{actionType.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.actions.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setStep("name")}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Name & Save */}
            {step === "name" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workflow Name</label>
                  <input
                    type="text"
                    placeholder='e.g. "Publish to Discord & Email"'
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus
                  />
                </div>

                {/* Summary */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Summary</p>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span><strong>Trigger:</strong> {TRIGGER_OPTIONS.find((t) => t.value === form.trigger)?.label}</span>
                  </div>
                  <div className="space-y-1">
                    {form.actions.map((a, i) => {
                      const def = ACTION_TYPES.find((t) => t.value === a.type);
                      const Icon = def?.icon ?? Webhook;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span><strong>Action {i + 1}:</strong> {def?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                  <button
                    onClick={saveWorkflow}
                    disabled={saving || !form.name.trim()}
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Workflow
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Workflows */}
      {workflows.length === 0 && !showCreate ? (
        <div className="text-center py-16 bg-background border rounded-2xl text-muted-foreground">
          <Zap className="h-14 w-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">No automations yet</p>
          <p className="text-sm mt-1">Create a workflow to automatically distribute posts across platforms.</p>
          {canManage && (
            <button
              onClick={() => { setShowCreate(true); setStep("trigger"); }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Workflow
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onToggle={() => toggleWorkflow(workflow)}
              onDelete={() => setWorkflowToDelete(workflow.id)}
              onEdit={() => editWorkflow(workflow)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
