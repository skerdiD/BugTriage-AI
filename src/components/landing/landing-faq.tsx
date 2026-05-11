"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: string;
};

type LandingFaqProps = {
  items: FaqItem[];
};

export function LandingFaq({ items }: LandingFaqProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="grid gap-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className="rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
              onClick={() => {
                setOpenIndex((currentIndex) => (currentIndex === index ? -1 : index));
              }}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left outline-none transition-colors hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <span className="text-base font-medium text-white">{item.question}</span>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              >
                <ChevronDown className="size-4 text-zinc-300" />
              </span>
            </button>
            <div
              id={`faq-panel-${index}`}
              className={cn(
                "grid overflow-hidden px-6 transition-[grid-template-rows,opacity,padding-bottom] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] pb-0 opacity-70"
              )}
            >
              <div className="overflow-hidden text-sm leading-7 text-zinc-400">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
