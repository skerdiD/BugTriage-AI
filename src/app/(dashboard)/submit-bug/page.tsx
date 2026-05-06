"use client";

import {
  CheckCircle2,
  FileText,
  ImageIcon,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const aiOutput = [
  "AI Summary",
  "Severity Level",
  "Category",
  "Reproduction Steps",
  "Possible Root Cause",
  "Suggested Fix",
  "Priority Score",
  "Confidence Score",
];

export default function SubmitBugPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Submit Bug Report"
        description="Provide issue details and AI will analyze it into a structured engineering ticket."
        badge="AI assisted"
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Bug Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Bug Title *</Label>
              <Input
                id="title"
                defaultValue="Payment form fails on Safari mobile"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                className="min-h-32 rounded-xl border-white/10 bg-white/[0.04]"
                defaultValue="User reported that when trying to complete checkout on Safari iOS, the payment form becomes unresponsive after entering card details. Submit button appears disabled even with valid input."
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="steps">Steps to Reproduce</Label>
                <Textarea
                  id="steps"
                  className="min-h-28 rounded-xl border-white/10 bg-white/[0.04] font-mono text-xs"
                  defaultValue={`1. Navigate to /checkout on Safari iOS
2. Fill in shipping information
3. Enter credit card details
4. Try to submit payment`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="behavior">Expected vs Actual Behavior</Label>
                <Textarea
                  id="behavior"
                  className="min-h-28 rounded-xl border-white/10 bg-white/[0.04]"
                  defaultValue={`Expected: Payment form submits and processes transaction.

Actual: Submit button remains disabled and checkout freezes.`}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Browser</Label>
                <Select defaultValue="safari">
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chrome">Chrome</SelectItem>
                    <SelectItem value="safari">Safari</SelectItem>
                    <SelectItem value="firefox">Firefox</SelectItem>
                    <SelectItem value="edge">Edge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Device</Label>
                <Select defaultValue="ios">
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="ios">iOS Mobile</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Environment</Label>
                <Select defaultValue="production">
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.04]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="page">Affected Page / Component</Label>
              <Input
                id="page"
                defaultValue="/checkout/payment"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center transition hover:border-violet-500/40 hover:bg-violet-500/[0.04]">
                <ImageIcon className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">Drop image here or click to upload</p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>

              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center transition hover:border-violet-500/40 hover:bg-violet-500/[0.04]">
                <FileText className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">Drop log file or paste output</p>
                <p className="mt-1 text-xs text-muted-foreground">TXT, LOG files</p>
              </div>
            </div>

            <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold hover:from-violet-500 hover:to-fuchsia-500">
              <Sparkles className="mr-2 size-4" />
              Analyze with AI
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-purple-500/8 to-transparent shadow-xl shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-violet-300" />
              <CardTitle>AI Will Generate</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Our AI will analyze your bug report and automatically generate a clean,
              structured engineering ticket.
            </p>

            <div className="mt-6 space-y-4">
              {aiOutput.map((item) => (
                <div key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-300" />
                  <div>
                    <p className="text-sm font-semibold">{item}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Generated from the raw bug context.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6 bg-white/10" />

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Estimated analysis time</p>
                <Badge className="bg-emerald-500/15 text-emerald-300">5-10 sec</Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                You can review and edit the AI-generated ticket before creating it.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <UploadCloud className="size-4 text-sky-300" />
                <p className="text-sm font-medium">Attachments supported later</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Screenshots, logs, and files will be connected after storage is added.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}