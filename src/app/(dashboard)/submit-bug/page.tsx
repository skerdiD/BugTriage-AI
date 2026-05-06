"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  ImageIcon,
  Loader2,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/dashboard/page-header";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
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

const bugFormSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(120, "Bug title must be less than 120 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(1200, "Description must be less than 1200 characters."),
  stepsToReproduce: z
    .string()
    .min(10, "Add at least one clear reproduction step.")
    .max(1000, "Steps must be less than 1000 characters."),
  expectedBehavior: z
    .string()
    .min(8, "Expected behavior must be at least 8 characters.")
    .max(600, "Expected behavior must be less than 600 characters."),
  actualBehavior: z
    .string()
    .min(8, "Actual behavior must be at least 8 characters.")
    .max(600, "Actual behavior must be less than 600 characters."),
  browser: z.string().min(1, "Select a browser."),
  device: z.string().min(1, "Select a device."),
  environment: z.string().min(1, "Select an environment."),
  affectedPage: z
    .string()
    .min(2, "Affected page or component is required.")
    .max(160, "Affected page must be less than 160 characters."),
  consoleLogs: z
    .string()
    .max(2500, "Console logs must be less than 2500 characters.")
    .optional(),
});

type BugFormValues = z.infer<typeof bugFormSchema>;

type MockedAiAnalysis = {
  summary: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: string;
  reproductionSteps: string[];
  possibleRootCause: string;
  suggestedFix: string;
  priorityScore: number;
  confidenceScore: number;
};

const aiPreviewItems = [
  {
    title: "AI Summary",
    description: "Clear, concise description of the issue",
  },
  {
    title: "Severity Level",
    description: "Critical, High, Medium, or Low",
  },
  {
    title: "Category",
    description: "Component or feature area affected",
  },
  {
    title: "Reproduction Steps",
    description: "Cleaned and structured steps",
  },
  {
    title: "Possible Root Cause",
    description: "Technical analysis of what might be wrong",
  },
  {
    title: "Suggested Fix",
    description: "Recommended solution approach",
  },
  {
    title: "Priority Score",
    description: "0 to 100 based on impact and urgency",
  },
  {
    title: "Confidence Score",
    description: "AI confidence in the analysis",
  },
];

const defaultValues: BugFormValues = {
  title: "Payment form fails on Safari mobile",
  description:
    "User reported that when trying to complete checkout on Safari iOS, the payment form becomes unresponsive after entering card details. Submit button appears disabled even with valid input.",
  stepsToReproduce:
    "1. Navigate to /checkout on Safari iOS\n2. Fill in shipping information\n3. Enter credit card details\n4. Try to submit payment",
  expectedBehavior:
    "Payment form should submit successfully and process the transaction.",
  actualBehavior:
    "Submit button remains disabled and the checkout page becomes unresponsive.",
  browser: "safari",
  device: "ios-mobile",
  environment: "production",
  affectedPage: "/checkout/payment",
  consoleLogs:
    "TypeError: Cannot read properties of undefined reading paymentIntent\nat PaymentForm.submitPayment",
};

function buildMockedAnalysis(values: BugFormValues): MockedAiAnalysis {
  return {
    summary:
      "Users on Safari iOS cannot complete checkout because the payment form becomes unresponsive after valid card details are entered.",
    severity: "Critical",
    category: "Payment / Checkout",
    reproductionSteps: values.stepsToReproduce
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean),
    possibleRootCause:
      "The payment submit state may be blocked by Safari-specific validation behavior or an undefined payment intent response during form submission.",
    suggestedFix:
      "Audit the payment form state handling, add defensive checks around the payment intent response, test Safari iOS validation events, and ensure the submit button revalidates after card input changes.",
    priorityScore: 96,
    confidenceScore: 94,
  };
}

function severityBadgeClass(severity: MockedAiAnalysis["severity"]) {
  if (severity === "Critical") {
    return "border-red-500/25 bg-red-500/15 text-red-300";
  }

  if (severity === "High") {
    return "border-orange-500/25 bg-orange-500/15 text-orange-300";
  }

  if (severity === "Medium") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-300";
  }

  return "border-sky-500/25 bg-sky-500/15 text-sky-300";
}

export default function SubmitBugPage() {
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [logFiles, setLogFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MockedAiAnalysis | null>(null);

  const form = useForm<BugFormValues>({
    resolver: zodResolver(bugFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const analysisProgress = useMemo(() => {
    if (isAnalyzing) return 68;
    if (analysis) return 100;
    return 0;
  }, [analysis, isAnalyzing]);

  function onSubmit(values: BugFormValues) {
    setIsAnalyzing(true);
    setAnalysis(null);

    window.setTimeout(() => {
      setAnalysis(buildMockedAnalysis(values));
      setIsAnalyzing(false);
    }, 1400);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Submit Bug Report"
        description="Provide details about the issue and AI will analyze it for you"
        badge="AI assisted"
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                <UploadCloud className="size-5 text-violet-300" />
              </div>
              <div>
                <CardTitle>Bug Details</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add enough context so the AI can generate a useful engineering ticket.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bug Title *</FormLabel>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                              <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="desktop">Desktop</SelectItem>
                            <SelectItem value="ios-mobile">iOS Mobile</SelectItem>
                            <SelectItem value="android-mobile">
                              Android Mobile
                            </SelectItem>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                      <FormLabel>Affected Page / Component *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Example: /checkout/payment or PaymentForm.tsx"
                          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                          {...field}
                        />
                      </FormControl>
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
                        <FormLabel>Steps to Reproduce *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="1. Open checkout&#10;2. Enter card details&#10;3. Click submit"
                            className="min-h-36 rounded-xl border-white/10 bg-white/[0.04] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
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
                          <FormLabel>Expected Behavior *</FormLabel>
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
                          <FormLabel>Actual Behavior *</FormLabel>
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
                    title="Screenshot"
                    description="Drop image here or click to upload"
                    helperText="PNG, JPG, WEBP up to 10MB"
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
                    title="Console Logs"
                    description="Drop log file here or click to upload"
                    helperText="TXT, LOG files"
                    icon={FileText}
                    accept={{
                      "text/plain": [".txt", ".log"],
                      "application/json": [".json"],
                    }}
                    files={logFiles}
                    onFilesChange={setLogFiles}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="consoleLogs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste Console Logs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste console output, stack traces, or network errors here."
                          className="min-h-28 rounded-xl border-white/10 bg-white/[0.04] font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional, but useful for better root cause analysis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isAnalyzing}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-fuchsia-500"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Analyzing bug report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Analyze with AI
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
                  <CardTitle>AI Will Generate</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Structured output from messy bug context.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                {aiPreviewItems.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Analysis progress</span>
                  <span className="text-sm font-semibold text-violet-300">
                    {analysisProgress}%
                  </span>
                </div>
                <Progress value={analysisProgress} className="h-2 bg-white/10" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-4 text-orange-300" />
                  <p className="text-sm font-semibold">No real AI connected yet</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  This page currently simulates the AI analysis flow with mock output.
                </p>
              </div>
            </CardContent>
          </Card>

          {analysis ? (
            <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.055] shadow-xl shadow-black/20">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Mocked AI Analysis</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Preview generated after submission.
                    </p>
                  </div>
                  <Badge className={severityBadgeClass(analysis.severity)}>
                    {analysis.severity}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {analysis.summary}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="mt-2 font-semibold">{analysis.category}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-muted-foreground">Priority Score</p>
                    <p className="mt-2 text-2xl font-bold text-red-300">
                      {analysis.priorityScore}/100
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="mt-2 text-2xl font-bold text-violet-300">
                      {analysis.confidenceScore}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-2 font-semibold text-emerald-300">
                      Ready for review
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Reproduction Steps
                  </p>
                  <div className="mt-3 space-y-2">
                    {analysis.reproductionSteps.map((step) => (
                      <div
                        key={step}
                        className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                      >
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-violet-300" />
                        <p className="text-sm leading-5 text-muted-foreground">
                          {step.replace(/^\d+\.\s*/, "")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Possible Root Cause
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {analysis.possibleRootCause}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Suggested Fix
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {analysis.suggestedFix}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </section>
    </div>
  );
}