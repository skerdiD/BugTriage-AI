"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, ExternalLink, GitPullRequest, Loader2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GitHubIssueExportDialogProps = {
  ticketCode: string;
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
}: GitHubIssueExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [exportedIssue, setExportedIssue] = useState<{
    url: string;
    number: number;
  } | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setError("");
      setExportedIssue(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setError("");
    setExportedIssue(null);

    try {
      const response = await fetch("/api/github/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketCode,
          owner,
          repo,
          token,
        }),
      });

      const result = (await response.json()) as ExportResponse;

      if (!response.ok || !result.ok) {
        setError(
          result.ok
            ? "GitHub export failed. Please try again."
            : result.error
        );
        return;
      }

      setToken("");
      setExportedIssue({
        url: result.issueUrl,
        number: result.issueNumber,
      });
    } catch {
      setError("GitHub export failed. Check your connection and try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-fit rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
        >
          <GitPullRequest className="mr-2 size-4" />
          Export to GitHub Issue
        </Button>
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-[#15121d] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export to GitHub Issue</DialogTitle>
          <DialogDescription>
            Create a GitHub Issue from this AI-generated ticket. The token is
            used only for this request and is not stored.
          </DialogDescription>
        </DialogHeader>

        {exportedIssue ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">Exported to GitHub Issues</p>
                <p className="mt-1 text-emerald-100/80">
                  Issue #{exportedIssue.number} was created successfully.
                </p>
              </div>
            </div>

            <Button
              asChild
              className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-500"
            >
              <a href={exportedIssue.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Open GitHub Issue
              </a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github-owner">Repo owner</Label>
                <Input
                  id="github-owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  placeholder="skerdiD"
                  autoComplete="off"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                  disabled={isExporting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github-repo">Repo name</Label>
                <Input
                  id="github-repo"
                  value={repo}
                  onChange={(event) => setRepo(event.target.value)}
                  placeholder="BugTriage-AI"
                  autoComplete="off"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                  disabled={isExporting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-token">Personal access token</Label>
              <Input
                id="github-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="ghp_..."
                type="password"
                autoComplete="off"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                disabled={isExporting}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </p>
            ) : null}

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
                    Create GitHub Issue
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
