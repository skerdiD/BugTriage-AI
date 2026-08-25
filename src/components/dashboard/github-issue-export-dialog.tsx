"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UiGitHubExportStatus } from "@/lib/dashboard/types";

type GitHubIssueExportDialogProps = {
  ticketCode: string;
  canExport: boolean;
  status: UiGitHubExportStatus;
  issueUrl: string | null;
  issueNumber: number | null;
  exportedAt: string | null;
  failureMessage: string | null;
};

type ExportResponse =
  | {
      ok: true;
      issueUrl: string;
      issueNumber: number;
    }
  | {
      ok: false;
      error: string;
    };

export function GitHubIssueExportDialog({
  ticketCode,
  canExport,
  status,
  issueUrl,
  issueNumber,
  exportedAt,
  failureMessage,
}: GitHubIssueExportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const exportInFlightRef = useRef(false);

  if (status === "EXPORTED" && issueUrl) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="w-fit rounded-xl border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
        >
          <a href={issueUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 size-4" />
            View GitHub issue{issueNumber ? ` #${issueNumber}` : ""}
          </a>
        </Button>
        <span className="text-xs text-emerald-200/80">
          Exported{exportedAt ? ` ${exportedAt}` : ""}
        </span>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isExporting || exportInFlightRef.current || !canExport) {
      return;
    }

    exportInFlightRef.current = true;
    setIsExporting(true);
    setError("");

    try {
      const response = await fetch("/api/github/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketCode,
        }),
      });

      const result = (await response.json()) as ExportResponse;

      if (!response.ok || !result.ok) {
        setError(result.ok ? "GitHub export failed. Please try again." : result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("GitHub export failed. Check your connection and try again.");
    } finally {
      exportInFlightRef.current = false;
      setIsExporting(false);
    }
  }

  const isPersistedExporting = status === "EXPORTING";
  const isDisabled = isExporting || isPersistedExporting || !canExport;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          className="w-fit rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
        >
          {isPersistedExporting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <GitPullRequest className="mr-2 size-4" />
          )}
          {isPersistedExporting
            ? "Export in progress"
            : status === "FAILED"
              ? "Retry GitHub export"
              : "Send to GitHub"}
        </Button>
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-[#15121d] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a GitHub issue</DialogTitle>
          <DialogDescription>
            Copy this ticket into the connected repository. The original report,
            triage draft, and useful metadata will be formatted for GitHub.
          </DialogDescription>
        </DialogHeader>

        {status === "FAILED" && failureMessage ? (
          <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Previous export failed</p>
              <p className="mt-1 text-red-100/80">{failureMessage}</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>
              Only workspace owners and admins can do this. Once GitHub accepts the
              issue, this ticket keeps the link and will not create a duplicate.
            </p>
          </div>
        )}

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <DialogFooter className="border-white/10 bg-white/[0.03]">
            <Button
              type="submit"
              disabled={isExporting}
              className="rounded-xl bg-violet-600 hover:bg-violet-500"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <GitPullRequest className="mr-2 size-4" />
                  {status === "FAILED" ? "Try again" : "Create GitHub issue"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
