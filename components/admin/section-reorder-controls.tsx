"use client";

import { useAdminEdit } from "./admin-edit-context";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionReorderControlsProps = {
  sectionId: string;
  className?: string;
};

export function SectionReorderControls({ sectionId, className }: SectionReorderControlsProps) {
  const { content, updateContent } = useAdminEdit();
  
  const defaultOrder = ["hero", "about", "portfolio", "showreel", "gallery", "press", "contact"];
  const currentOrder = content.sectionsOrder ?? defaultOrder;
  const currentIndex = currentOrder.indexOf(sectionId);

  if (currentIndex === -1) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === currentOrder.length - 1;

  const moveSection = (direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    updateContent((draft) => {
      const order = draft.sectionsOrder ? [...draft.sectionsOrder] : [...defaultOrder];
      // Swap elements
      const temp = order[currentIndex];
      order[currentIndex] = order[targetIndex];
      order[targetIndex] = temp;
      draft.sectionsOrder = order;
    });
  };

  return (
    <div className={cn("flex flex-col gap-1 bg-white border border-ink/10 p-1 shadow-[0_4px_12px_rgba(16,16,16,0.08)] rounded-full backdrop-blur-md mt-1.5", className)}>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => moveSection("up")}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/10 bg-porcelain text-ink/75 hover:bg-ink hover:text-white disabled:opacity-20 disabled:hover:bg-porcelain disabled:hover:text-ink/75 transition-all cursor-pointer shadow-sm"
        title="Przesuń w górę"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => moveSection("down")}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/10 bg-porcelain text-ink/75 hover:bg-ink hover:text-white disabled:opacity-20 disabled:hover:bg-porcelain disabled:hover:text-ink/75 transition-all cursor-pointer shadow-sm"
        title="Przesuń w dół"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
