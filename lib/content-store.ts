"use client";

import { useEffect, useState } from "react";
import { subscribeSiteContent, type ContentTarget } from "@/lib/firebase/content";
import { siteContent } from "@/lib/site-content";
import type { SiteContent } from "@/lib/types";
import { cloneContent } from "@/lib/utils";

export function useSiteContent(target: ContentTarget = "live") {
  const [content, setContent] = useState<SiteContent>(() => cloneContent(siteContent));

  useEffect(() => {
    return subscribeSiteContent((nextContent) => setContent(nextContent), undefined, target);
  }, [target]);

  return content;
}
