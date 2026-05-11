"use client";

import type { ComponentType } from "react";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Code2,
  Download,
  FileText,
  Globe2,
  ImageIcon,
  Laptop,
  Loader2,
  MessageSquare,
  MonitorSmartphone,
  PackageCheck,
  Send,
  ShieldAlert,
  Sparkles,
  Tags,
  UserRound,
} from "lucide-react";
import { TicketStatus as DbTicketStatus } from "@prisma/client";

import {
  addTicketCommentAction,
  updateTicketStatusAction,
} from "@/app/(dashboard)/tickets/[ticketId]/actions";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  UiTicket as Ticket,
  UiTicketStatus as TicketStatus,
} from "@/lib/dashboard/types";

type TicketDetailClientProps = {
  ticket: Ticket;
};

const workflowStatuses: TicketStatus[] = [
  "New",
  "Investigating",
  "In Progress",
  "Fixed",
  "Closed",
];

const uiToDbStatus: Record<TicketStatus, DbTicketStatus> = {
  New: DbTicketStatus.NEW,
  Investigating: DbTicketStatus.INVESTIGATING,
  "In Progress": DbTicketStatus.IN_PROGRESS,
  Fixed: DbTicketStatus.FIXED,
  Closed: DbTicketStatus.CLOSED,
};

export function TicketDetailClient({ ticket }: TicketDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [commentText, setCommentText] = useState("");
  const [statusError, setStatusError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isCommentPending, startCommentTransition] = useTransition();

  const statusIndex = workflowStatuses.indexOf(status);

  const workflowProgress = useMemo(() => {
    if (statusIndex < 0) return 0;
    return Math.round(((statusIndex + 1) / workflowStatuses.length) * 100);
  }, [statusIndex]);

  function handleStatusChange(nextStatus: TicketStatus) {
    if (nextStatus === status) {
      return;
    }

    const previousStatus = status;
    setStatus(nextStatus);
    setStatusError("");

    startStatusTransition(async () => {
      const result = await updateTicketStatusAction({
        ticketCode: ticket.id,
        status: uiToDbStatus[nextStatus],
      });

      if (!result.ok) {
        setStatus(previousStatus);
        setStatusError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleAddComment() {
    const trimmed = commentText.trim();

    if (!trimmed) {
      setCommentError("Comment cannot be empty.");
      return;
    }

    setCommentError("");

    startCommentTransition(async () => {
      const result = await addTicketCommentAction({
        ticketCode: ticket.id,
        body: trimmed,
      });

      if (!result.ok) {
        setCommentError(result.error);
        return;
      }

      setCommentText("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-5">
          <Button
            asChild
            variant="outline"
            className="w-fit rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          >
            <Link href="/tickets">
              <ArrowLeft className="mr-2 size-4" />
              Back to tickets
            </Link>
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {ticket.id}
              </span>
              <StatusBadge status={status} />
              <SeverityBadge severity={ticket.severity} />
              <Badge className="rounded-full border-white/10 bg-white/[0.06] text-slate-200">
                {ticket.category}
              </Badge>
            </div>

            <h1 className="mt-4 max-w-5xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              {ticket.title}
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              Review the original report, structured AI output, attachments, comments,
              and ticket activity in one workspace-safe view.
            </p>
          </div>
        </div>

        <Card className="w-full rounded-3xl border-violet-500/20 bg-violet-500/10 shadow-xl shadow-black/20 xl:max-w-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                  <Bot className="size-5 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Confidence</p>
                  <p className="text-2xl font-bold text-violet-200">
                    {ticket.confidence}%
                  </p>
                </div>
              </div>

              <Badge className="rounded-full border-emerald-500/25 bg-emerald-500/15 text-emerald-300">
                {ticket.confidence > 0 ? "Ready" : "Pending"}
              </Badge>
            </div>

            <div className="mt-5">
              <Progress value={ticket.confidence} className="h-2 bg-white/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.7fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <FileText className="size-5 text-sky-300" />
                </div>
                <div>
                  <CardTitle>Original Bug Report</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Raw user or support input before AI triage.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  {ticket.originalReport}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-purple-500/7 to-transparent shadow-xl shadow-black/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                  <Sparkles className="size-5 text-violet-300" />
                </div>
                <div>
                  <CardTitle>AI Analysis</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Structured engineering output generated from the report.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  AI-generated summary
                </p>
                <p className="mt-3 text-sm leading-7 text-white">
                  {ticket.aiSummary}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldAlert className="size-4 text-red-300" />
                    <p className="font-semibold">Possible Root Cause</p>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {ticket.possibleRootCause}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <PackageCheck className="size-4 text-emerald-300" />
                    <p className="font-semibold">Suggested Fix</p>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {ticket.suggestedFix}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.45fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-violet-300" />
                    <p className="font-semibold">Reproduction Steps</p>
                  </div>

                  <div className="space-y-3">
                    {ticket.reproductionSteps.map((step, index) => (
                      <div
                        key={`${ticket.id}-step-${index + 1}`}
                        className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-200">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-muted-foreground">Priority Score</p>
                  <p className="mt-3 text-5xl font-bold tracking-tight text-red-300">
                    {ticket.priorityScore}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">out of 100</p>

                  <Progress
                    value={ticket.priorityScore}
                    className="mt-5 h-2 bg-white/10"
                  />

                  <Separator className="my-5 bg-white/10" />

                  <div className="flex items-center gap-2">
                    <Tags className="size-4 text-violet-300" />
                    <p className="text-sm font-semibold">Tags</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {ticket.tags.length > 0 ? (
                      ticket.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="rounded-full border-white/10 bg-white/[0.06] text-slate-200"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No AI tags were recorded for this ticket.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              {ticket.attachments.length > 0 ? (
                ticket.attachments.map((attachment) => {
                  const Icon = attachment.type === "screenshot" ? ImageIcon : Code2;

                  return (
                    <div
                      key={attachment.id}
                      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                            <Icon className="size-5 text-violet-300" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {attachment.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {attachment.size} | {attachment.format}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              Uploaded {attachment.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          asChild={Boolean(attachment.downloadUrl)}
                          disabled={!attachment.downloadUrl}
                          className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                        >
                          {attachment.downloadUrl ? (
                            <a
                              href={attachment.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Download ${attachment.name}`}
                            >
                              <Download className="size-4" />
                            </a>
                          ) : (
                            <span aria-hidden="true">
                              <Download className="size-4" />
                            </span>
                          )}
                        </Button>
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Preview
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {attachment.preview}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground md:col-span-2">
                  No files were attached to this ticket.
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="size-5 text-violet-300" />
                  <CardTitle>Comments</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add an internal engineering note..."
                    aria-label="Internal engineering note"
                    className="min-h-24 rounded-2xl border-white/10 bg-white/[0.04]"
                  />

                  {commentError ? (
                    <p
                      role="alert"
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    >
                      {commentError}
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    disabled={isCommentPending}
                    onClick={handleAddComment}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500"
                  >
                    {isCommentPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving Comment...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" />
                        Add Comment
                      </>
                    )}
                  </Button>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  {ticket.comments.length > 0 ? (
                    ticket.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-xs font-bold text-white">
                            {comment.initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="font-semibold text-white">
                                {comment.author}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {comment.role}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {comment.createdAt}
                            </p>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                              {comment.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
                      No comments yet. Add the first internal note to capture the next
                      investigation step.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Activity className="size-5 text-sky-300" />
                  <CardTitle>Activity Timeline</CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                {ticket.activity.length > 0 ? (
                  <div className="space-y-5">
                    {ticket.activity.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                            <ChevronRight className="size-4 text-violet-300" />
                          </div>
                          {index !== ticket.activity.length - 1 ? (
                            <div className="h-full w-px bg-white/10" />
                          ) : null}
                        </div>

                        <div className="pb-5">
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
                    Activity will appear here as the ticket moves through triage,
                    comments, and status changes.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="sticky top-24 rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
            <CardHeader>
              <CardTitle>Status Workflow</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Update ticket status
                </p>
                <Select
                  value={status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowStatuses.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusError ? (
                  <p
                    role="alert"
                    className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    {statusError}
                  </p>
                ) : null}
                {isStatusPending ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Saving status update...
                  </p>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Workflow progress</span>
                  <span className="font-semibold text-violet-300">
                    {workflowProgress}%
                  </span>
                </div>
                <Progress value={workflowProgress} className="h-2 bg-white/10" />
              </div>

              <div className="space-y-3">
                {workflowStatuses.map((item, index) => {
                  const isActive = item === status;
                  const isComplete = index < statusIndex;

                  return (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div
                        className={
                          isActive || isComplete
                            ? "flex size-8 items-center justify-center rounded-full bg-violet-500 text-white"
                            : "flex size-8 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground"
                        }
                      >
                        {isComplete ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-white">{item}</p>
                        <p className="text-xs text-muted-foreground">
                          {isActive ? "Current status" : "Workflow stage"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
            <CardHeader>
              <CardTitle>Ticket Metadata</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <MetadataRow
                icon={UserRound}
                label="Assignee"
                value={`${ticket.assignee} | ${ticket.assigneeRole}`}
              />
              <MetadataRow icon={Globe2} label="Browser" value={ticket.browser} />
              <MetadataRow
                icon={MonitorSmartphone}
                label="Device"
                value={ticket.device}
              />
              <MetadataRow
                icon={Laptop}
                label="Environment"
                value={ticket.environment}
              />
              <MetadataRow
                icon={Code2}
                label="Affected Page"
                value={ticket.affectedPage}
              />
              <MetadataRow
                icon={CalendarClock}
                label="Created"
                value={ticket.createdDate}
              />
              <MetadataRow
                icon={CalendarClock}
                label="Updated"
                value={ticket.updatedDate}
              />
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

type MetadataRowProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function MetadataRow({ icon: Icon, label, value }: MetadataRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
        <Icon className="size-4 text-violet-300" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
