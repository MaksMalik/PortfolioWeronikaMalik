"use client";

import { useEffect } from "react";
import { useAdminEdit } from "@/components/admin/admin-edit-context";

function upsertMeta(selector: string, attrs: Record<string, string>, value?: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!value?.trim()) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attrs).forEach(([key, attrValue]) => {
      element?.setAttribute(key, attrValue);
    });
    document.head.appendChild(element);
  }

  element.setAttribute("content", value);
}

export function SeoMetadata() {
  const { content, contentReady } = useAdminEdit();

  useEffect(() => {
    if (!contentReady) return;

    const seo = content.seo;
    const title = seo?.title?.trim() ?? "";
    const description = seo?.description?.trim() ?? "";
    const image = seo?.image?.enabled !== false ? seo?.image?.src?.trim() ?? "" : "";

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, image);
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, image);
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, image ? "summary_large_image" : undefined);
  }, [
    content.seo?.description,
    content.seo?.image?.enabled,
    content.seo?.image?.src,
    content.seo?.title,
    contentReady
  ]);

  return null;
}
