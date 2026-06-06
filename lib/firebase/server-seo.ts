import type { Metadata } from "next";
import { SITE_CONTENT_SCHEMA_VERSION, siteContent } from "@/lib/site-content";
import type { SeoContent, SiteContent } from "@/lib/types";
import { cloneContent } from "@/lib/utils";

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue ?? "";
  if ("booleanValue" in value) return value.booleanValue ?? false;
  if ("integerValue" in value) return Number(value.integerValue ?? 0);
  if ("doubleValue" in value) return value.doubleValue ?? 0;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return value.arrayValue?.values?.map(decodeFirestoreValue) ?? [];
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields ?? {}).map(([key, nestedValue]) => [
        key,
        decodeFirestoreValue(nestedValue)
      ])
    );
  }
  return undefined;
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>) {
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];

    if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)) {
      const targetValue = target[key];
      if (!targetValue || typeof targetValue !== "object" || Array.isArray(targetValue)) {
        target[key] = {};
      }
      mergeDeep(target[key] as Record<string, unknown>, sourceValue as Record<string, unknown>);
    } else {
      target[key] = sourceValue;
    }
  });
}

function mergeContentDefaults(source: unknown): SiteContent | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }

  const merged = cloneContent(siteContent);
  mergeDeep(
    merged as unknown as Record<string, unknown>,
    source as Record<string, unknown>
  );
  const incomingSchemaVersion = Number((source as { schemaVersion?: unknown }).schemaVersion ?? 0);
  if (incomingSchemaVersion < 8 && merged.portalCursorEnabled === true) {
    merged.portalCursorEnabled = false;
  }
  merged.schemaVersion = SITE_CONTENT_SCHEMA_VERSION;
  return merged;
}

async function fetchFirestoreDoc(docId: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return null;
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/siteContent/${docId}?key=${apiKey}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<{
    fields?: Record<string, FirestoreValue>;
  }>;
}

export async function fetchLiveSiteContent(): Promise<SiteContent | null> {
  try {
    const mainPayload = await fetchFirestoreDoc("eliana-loren");
    const decodedContent = mainPayload?.fields?.content
      ? decodeFirestoreValue(mainPayload.fields.content)
      : null;
    const content = mergeContentDefaults(decodedContent);

    if (!content) {
      return null;
    }

    const imagesPayload = await fetchFirestoreDoc("eliana-loren-images");
    const galleryImages = imagesPayload?.fields?.galleryImages
      ? decodeFirestoreValue(imagesPayload.fields.galleryImages)
      : null;
    const portfolioImages = imagesPayload?.fields?.portfolioImages
      ? decodeFirestoreValue(imagesPayload.fields.portfolioImages)
      : null;

    if (Array.isArray(galleryImages)) {
      content.gallery = content.gallery.map((session) => {
        const found = galleryImages.find(
          (item): item is { id: string; images: SiteContent["gallery"][0]["images"] } =>
            Boolean(item && typeof item === "object" && "id" in item && (item as { id?: unknown }).id === session.id)
        );
        return found ? { ...session, images: found.images ?? [] } : session;
      });
    }

    if (Array.isArray(portfolioImages)) {
      content.portfolio = content.portfolio.map((project) => {
        const found = portfolioImages.find(
          (item): item is { id: string; images: SiteContent["portfolio"][0]["images"] } =>
            Boolean(item && typeof item === "object" && "id" in item && (item as { id?: unknown }).id === project.id)
        );
        return found ? { ...project, images: found.images ?? [] } : project;
      });
    }

    return content;
  } catch {
    return null;
  }
}

function metadataFromSeo(seo: SeoContent | undefined): Metadata {
  const title = seo?.title?.trim() || undefined;
  const description = seo?.description?.trim() || undefined;
  const image = seo?.image?.enabled !== false ? seo?.image?.src?.trim() || undefined : undefined;
  const imageAlt = seo?.image?.alt?.trim() || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, alt: imageAlt }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export async function fetchLiveSeoMetadata(): Promise<Metadata> {
  try {
    const content = await fetchLiveSiteContent();
    const seo = content?.seo ?? siteContent.seo;

    return metadataFromSeo(seo);
  } catch {
    return {};
  }
}
