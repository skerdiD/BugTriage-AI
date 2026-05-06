"use client";

import type { ComponentType } from "react";
import type { Accept } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, File, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  title: string;
  description: string;
  helperText: string;
  icon: ComponentType<{ className?: string }>;
  accept: Accept;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({
  title,
  description,
  helperText,
  icon: Icon,
  accept,
  files,
  onFilesChange,
}: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    accept,
    maxFiles: 3,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      onFilesChange([...files, ...acceptedFiles].slice(0, 3));
    },
  });

  function removeFile(fileName: string) {
    onFilesChange(files.filter((file) => file.name !== fileName));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white">{title}</p>

      <div
        {...getRootProps()}
        className={cn(
          "group cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-7 text-center transition",
          "hover:border-violet-500/40 hover:bg-violet-500/[0.04]",
          isDragActive && "border-violet-400 bg-violet-500/[0.08]",
          isFocused && "border-violet-400"
        )}
      >
        <input {...getInputProps()} />

        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] transition group-hover:border-violet-500/30 group-hover:bg-violet-500/10">
          <Icon className="size-6 text-muted-foreground transition group-hover:text-violet-300" />
        </div>

        <p className="mt-4 text-sm font-semibold text-white">
          {isDragActive ? "Drop files here" : description}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      </div>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <File className="size-3.5 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-medium text-white">
                      {file.name}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile(file.name);
                }}
                className="size-8 shrink-0 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}