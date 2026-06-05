import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  type FirestoreError,
  type Unsubscribe
} from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { SITE_CONTENT_SCHEMA_VERSION, siteContent } from "@/lib/site-content";
import type { SiteContent, ContentVersion } from "@/lib/types";
import { cloneContent } from "@/lib/utils";

const SITE_CONTENT_COLLECTION = "siteContent";
export type ContentTarget = "live" | "preview";

function contentDocRef(target: ContentTarget = "live") {
  return doc(
    firebaseDb,
    SITE_CONTENT_COLLECTION,
    target === "live" ? "eliana-loren" : "eliana-loren-preview"
  );
}

function parseContentPayload(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "content" in payload &&
    (payload as { content?: unknown }).content
  ) {
    const content = (payload as { content: unknown }).content;

    // Merge content with siteContent defaults to handle missing schema fields gracefully without losing user data!
    const merged = cloneContent(siteContent);
    
    const mergeDeep = (target: Record<string, unknown>, source: Record<string, unknown>) => {
      if (!source) return;
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
    };
    
    if (content && typeof content === "object" && !Array.isArray(content)) {
      mergeDeep(
        merged as unknown as Record<string, unknown>,
        content as Record<string, unknown>
      );
    }
    
    // Always force schemaVersion to current version
    merged.schemaVersion = SITE_CONTENT_SCHEMA_VERSION;
    return merged;
  }

  return cloneContent(siteContent);
}

export function subscribeSiteContent(
  onContent: (content: SiteContent) => void,
  onError?: (error: FirestoreError) => void,
  target: ContentTarget = "live"
): Unsubscribe {
  return onSnapshot(
    contentDocRef(target),
    (snapshot) => {
      onContent(snapshot.exists() ? parseContentPayload(snapshot.data()) : cloneContent(siteContent));
    },
    (error) => {
      onError?.(error);
      onContent(cloneContent(siteContent));
    }
  );
}

export async function fetchSiteContent(target: ContentTarget = "live") {
  const snapshot = await getDoc(contentDocRef(target));
  return snapshot.exists() ? parseContentPayload(snapshot.data()) : cloneContent(siteContent);
}

export async function saveSiteContent(content: SiteContent, target: ContentTarget = "live") {
  await setDoc(
    contentDocRef(target),
    {
      content: cloneContent(content),
      schemaVersion: SITE_CONTENT_SCHEMA_VERSION,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function compressImageFile(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return { blob: file, contentType: file.type || "image/jpeg", extension: file.name.split(".").pop() ?? "jpg" };
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const maxSize = 2400;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return { blob: file, contentType: file.type || "image/jpeg", extension: file.name.split(".").pop() ?? "jpg" };
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.92);
    });

    return {
      blob: blob ?? file,
      contentType: blob ? "image/webp" : file.type || "image/jpeg",
      extension: blob ? "webp" : file.name.split(".").pop() ?? "jpg"
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function uploadImageFile(file: File, folder: string): Promise<string> {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    throw new Error(
      "Musisz być zalogowany jako administrator, aby przesyłać obrazy. Odśwież stronę i zaloguj się ponownie."
    );
  }

  try {
    await currentUser.getIdToken(true);
  } catch {
    throw new Error("Sesja wygasła. Odśwież stronę i zaloguj się ponownie.");
  }

  const compressed = await compressImageFile(file);

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Nie udało się przekonwertować obrazu do formatu Base64."));
      }
    };
    reader.onerror = () => reject(new Error("Błąd podczas odczytu pliku obrazu."));
    reader.readAsDataURL(compressed.blob);
  });
}

export function versionsCollectionRef() {
  return collection(firebaseDb, "siteContent", "eliana-loren-preview", "versions");
}

function isPermissionDenied(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  );
}

export async function fetchContentVersions(): Promise<ContentVersion[]> {
  try {
    const q = query(versionsCollectionRef(), orderBy("timestamp", "desc"), limit(10));
    const snapshot = await getDocs(q);
    const versions: ContentVersion[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data && data.id && data.content) {
        versions.push({
          id: data.id,
          timestamp: data.timestamp,
          type: data.type,
          label: data.label,
          content: data.content
        });
      }
    });
    return versions;
  } catch (error) {
    if (!isPermissionDenied(error)) {
      console.warn("[Versions] Could not fetch versions:", error);
    }
    return [];
  }
}

export async function saveContentVersion(version: ContentVersion) {
  try {
    const docRef = doc(versionsCollectionRef(), version.id);
    await setDoc(docRef, {
      id: version.id,
      timestamp: version.timestamp,
      type: version.type,
      label: version.label,
      content: cloneContent(version.content),
      createdAt: serverTimestamp()
    });

    // Clean up older versions if more than 10
    const q = query(versionsCollectionRef(), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.size > 10) {
      const docs = snapshot.docs;
      const deletePromises = docs.slice(10).map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    }
  } catch (error) {
    if (!isPermissionDenied(error)) {
      console.warn("[Versions] Could not save version:", error);
    }
  }
}

export async function deleteContentVersion(versionId: string) {
  try {
    const docRef = doc(versionsCollectionRef(), versionId);
    await deleteDoc(docRef);
  } catch (error) {
    if (!isPermissionDenied(error)) {
      console.warn("[Versions] Could not delete version:", error);
    }
  }
}
