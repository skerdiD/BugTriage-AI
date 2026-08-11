"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { analyzeAndCreateTicketAction } from "@/app/(dashboard)/submit-bug/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import type { UploadDropzoneProps } from "@/components/dashboard/upload-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  bugReportFormSchema,
  defaultBugReportValues,
  type BugReportFormValues,
} from "@/lib/validation/bug-report";

const ticketDraftItems = [
  {
    title: "A concise summary",
    detail: "A scannable description of the problem and its impact.",
  },
  {
    title: "Suggested severity and category",
    detail: "A consistent first pass for the team to confirm.",
  },
  {
    title: "Reproduction steps",
    detail: "The sequence cleaned up without losing the original context.",
  },
  {
    title: "Likely cause",
    detail: "A practical starting point for the investigation.",
  },
  {
    title: "Suggested next step",
    detail: "A focused action the assignee can review and refine.",
  },
  {
    title: "Priority and confidence",
    detail: "Signals to help the team decide what to review first.",
  },
];

const UploadDropzone = dynamic<UploadDropzoneProps>(
  () =>
    import("@/components/dashboard/upload-dropzone").then(
      (mod) => mod.UploadDropzone
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[190px] rounded-2xl bg-white/10" />,
  }
);

export default function SubmitBugPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [logFiles, setLogFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitWarning, setSubmitWarning] = useState("");
  const [createdCode, setCreatedCode] = useState("");

  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportFormSchema),
    defaultValues: defaultBugReportValues,
    mode: "onSubmit",
  });

  const isSubmitting = isPending || form.formState.isSubmitting;

  const totalUploadBytes = useMemo(
    () =>
      [...screenshotFiles, ...logFiles].reduce((sum, file) => sum + file.size, 0),
    [logFiles, screenshotFiles]
  );

  const totalUploadSizeLabel = useMemo(() => {
    if (totalUploadBytes === 0) {
      return "No files selected yet.";
    }

    return `${(
      totalUploadBytes /
      (1024 * 1024)
    ).toFixed(1)} MB selected across ${screenshotFiles.length + logFiles.length} file(s).`;
  }, [logFiles.length, screenshotFiles.length, totalUploadBytes]);

  function submit(values: BugReportFormValues) {
    setSubmitError("");
    setSubmitWarning("");
    setCreatedCode("");

    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });

    screenshotFiles.forEach((file) => {
      formData.append("screenshots", file);
    });

    logFiles.forEach((file) => {
      formData.append("logs", file);
    });

    startTransition(async () => {
      const result = await analyzeAndCreateTicketAction(formData);

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      setCreatedCode(result.ticketCode);

      if (result.aiFailed && result.warning) {
        setSubmitWarning(result.warning);

        window.setTimeout(() => {
          router.push(`/tickets/${result.ticketCode}`);
        }, 1200);

        return;
      }

      router.push(`/tickets/${result.ticketCode}`);
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Report a bug"
        description="Share what happened and attach any evidence you have. You can review the generated ticket before moving it through the workflow."
        badge="Private workspace"
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                <UploadCloud className="size-5 text-violet-300" />
              </div>
              <div>
                <CardTitle>Start with what you know</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  A clear description matters more than perfect formatting.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bug title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Example: Payment form fails on Safari mobile"
                          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what happened, who experienced it, and any useful context."
                          className="min-h-32 rounded-xl border-white/10 bg-white/[0.04]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include what the user reported, when it happened, and how often it occurs.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="browser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Browser *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                              <SelectValue placeholder="Select browser" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="chrome">Chrome</SelectItem>
                            <SelectItem value="safari">Safari</SelectItem>
                            <SelectItem value="firefox">Firefox</SelectItem>
                            <SelectItem value="edge">Edge</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="device"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                              <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="desktop">Desktop</SelectItem>
                            <SelectItem value="ios-mobile">iOS Mobile</SelectItem>
                            <SelectItem value="android-mobile">Android Mobile</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="environment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environment *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                              <SelectValue placeholder="Select environment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="affectedPage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affected page or component *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Example: /checkout/payment or PaymentForm.tsx"
                          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use the route, screen, feature area, or component name engineers
                        will recognize fastest.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stepsToReproduce"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Steps to reproduce *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={"1. Open checkout\n2. Enter card details\n3. Click submit"}
                          className="min-h-36 rounded-xl border-white/10 bg-white/[0.04] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use one step per line to keep the sequence easy to scan.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <div className="grid gap-5">
                    <FormField
                      control={form.control}
                      name="expectedBehavior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected behavior *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What should happen?"
                              className="min-h-16 rounded-xl border-white/10 bg-white/[0.04]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualBehavior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual behavior *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What actually happened?"
                              className="min-h-16 rounded-xl border-white/10 bg-white/[0.04]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <UploadDropzone
                    title="Screenshots"
                    description="Drop image files here or click to upload"
                    helperText="PNG, JPG, and WEBP up to 10MB each. Up to 3 files."
                    icon={ImageIcon}
                    accept={{
                      "image/png": [".png"],
                      "image/jpeg": [".jpg", ".jpeg"],
                      "image/webp": [".webp"],
                    }}
                    files={screenshotFiles}
                    onFilesChange={setScreenshotFiles}
                  />

                  <UploadDropzone
                    title="Console logs"
                    description="Drop log files here or click to upload"
                    helperText="TXT, LOG, and JSON up to 10MB each. Up to 3 files."
                    icon={FileText}
                    accept={{
                      "text/plain": [".txt", ".log"],
                      "application/json": [".json"],
                    }}
                    files={logFiles}
                    onFilesChange={setLogFiles}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">Upload summary</span>
                    <Badge className="border-white/10 bg-white/[0.05] text-slate-200">
                      20MB total ticket limit
                    </Badge>
                  </div>
                  <p className="mt-2 leading-6">
                    {totalUploadSizeLabel} Private files are stored securely and only
                    surfaced back through authorized ticket views.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="consoleLogs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste console logs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste console output, stack traces, or network errors here."
                          className="min-h-28 rounded-xl border-white/10 bg-white/[0.04] font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional, but useful when the error is difficult to reproduce.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submitError ? (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{submitError}</p>
                  </div>
                ) : null}

                {submitWarning ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>{submitWarning}</p>
                  </div>
                ) : null}

                {createdCode ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    <p>Ticket {createdCode} created. Redirecting to ticket detail...</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-fuchsia-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating ticket...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Analyze and create ticket
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="sticky top-24 rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-purple-500/8 to-transparent shadow-xl shadow-black/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                  <WandSparkles className="size-5 text-violet-300" />
                </div>
                <div>
                  <CardTitle>Your ticket draft will include</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review and adjust any suggestion after the ticket is created.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                {ticketDraftItems.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <Badge className="border-emerald-500/25 bg-emerald-500/15 text-emerald-300">
                    Private by default
                  </Badge>
                  <p className="text-sm font-semibold">Workspace-only attachments</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Files stay private, and generated fields are checked before the
                  ticket is saved.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
