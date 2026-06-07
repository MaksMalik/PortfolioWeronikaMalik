"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { ADMIN_EMAIL, firebaseAuth } from "@/lib/firebase/client";
import {
  subscribeSiteContent,
  saveSiteContent,
  type ContentTarget,
  fetchContentVersions,
  saveContentVersion,
  deleteContentVersion
} from "@/lib/firebase/content";
import { SITE_CONTENT_SCHEMA_VERSION, siteContent } from "@/lib/site-content";
import type { SiteContent, ContentVersion } from "@/lib/types";
import { cloneContent, createId } from "@/lib/utils";

type AdminEditContextType = {
  isAdmin: boolean;
  user: User | null;
  authLoading: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  previewTarget: ContentTarget;
  setPreviewTarget: (target: ContentTarget) => void;
  content: SiteContent;
  contentReady: boolean;
  updateContent: (recipe: (draft: SiteContent) => void) => void;
  isSaving: boolean;
  savedAt: string | null;
  statusMessage: string | null;
  setStatusMessage: (msg: string | null) => void;
  saveDraft: () => Promise<void>;
  publishLive: () => Promise<void>;
  logout: () => Promise<void>;
  hasBackup: boolean;
  restoreBackup: () => void;
  clearBackup: () => void;
  historyVersions: ContentVersion[];
  refreshHistoryVersions: () => Promise<void>;
  createVersionCheckpoint: (type?: ContentVersion["type"], customLabel?: string) => Promise<void>;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => Promise<void>;
  autosaveStatus: "idle" | "saving" | "saved" | "error";
  hasUnsavedEdits: boolean;
  remoteSaveBlocked: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const AdminEditContext = createContext<AdminEditContextType | undefined>(undefined);

function isPermissionDenied(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  );
}

function friendlyErrorMessage(error: unknown, fallback: string) {
  if (isPermissionDenied(error)) {
    return "Zmiany są zapisane lokalnie, ale Firebase odrzuca zapis online. Wdróż reguły Firestore albo odśwież logowanie admina.";
  }

  return error instanceof Error ? error.message : fallback;
}

const SESSION_CACHE_KEY = "strona_aktorska_live_cache";

function getCachedContent(): SiteContent | null {
  if (typeof window === "undefined") return null;
  try {
    // Try localStorage first (persists across browser restarts), then sessionStorage
    const raw = localStorage.getItem(SESSION_CACHE_KEY) ?? sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteContent;
    if ((parsed.schemaVersion ?? 0) < 8 && parsed.portalCursorEnabled === true) {
      parsed.portalCursorEnabled = false;
      parsed.schemaVersion = SITE_CONTENT_SCHEMA_VERSION;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedContent(content: SiteContent) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(content);
  try {
    localStorage.setItem(SESSION_CACHE_KEY, serialized);
    return;
  } catch {
    // localStorage full (likely base64 images) — fall back to sessionStorage
  }
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, serialized);
  } catch {
    // Both storages full — skip cache
  }
}

export function AdminEditProvider({
  children,
  initialContent
}: {
  children: React.ReactNode;
  initialContent?: SiteContent | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<ContentTarget>("live");
  
  const [content, setContent] = useState<SiteContent>(() => cloneContent(initialContent ?? siteContent));
  const [contentReady, setContentReady] = useState(Boolean(initialContent));
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasBackup, setHasBackup] = useState(false);

  // Load local cache and backup flag on client mount to prevent hydration mismatches
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = getCachedContent();
      const backupExists = Boolean(localStorage.getItem("strona_aktorska_draft_backup"));
      
      queueMicrotask(() => {
        if (cached) {
          setContent(cached);
          setContentReady(true);
        }

        if (backupExists) {
          setHasBackup(true);
        }
      });
    }
  }, []);
  const [historyVersions, setHistoryVersions] = useState<ContentVersion[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [remoteSaveBlocked, setRemoteSaveBlocked] = useState(false);
  const hasUnsavedEditsRef = useRef(false);
  const contentReadyRef = useRef(false);
  const savingInProgressRef = useRef(false);
  const pendingSaveContentRef = useRef<SiteContent | null>(null);
  
  // Undo/Redo state stack
  const [historyStates, setHistoryStates] = useState<SiteContent[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const pathname = usePathname();
  const isPreviewPage = pathname === "/preview";

  useEffect(() => {
    hasUnsavedEditsRef.current = hasUnsavedEdits;
  }, [hasUnsavedEdits]);

  useEffect(() => {
    contentReadyRef.current = contentReady;
  }, [contentReady]);

  // Listen to Auth State
  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (nextUser && nextUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        void signOut(firebaseAuth);
        setUser(null);
        setHistoryVersions([]);
      } else {
        setUser(nextUser);
        if (nextUser) {
          // Default to preview mode when admin logs in
          setPreviewTarget("preview");
          setEditMode(true);
        } else {
          setEditMode(false);
          setPreviewTarget("live");
          setHistoryVersions([]);
        }
      }
      setAuthLoading(false);
    });
  }, []);

  // Initialize/Reset Undo/Redo stack when database content finishes loading/resetting
  useEffect(() => {
    if (!hasUnsavedEdits && content) {
      queueMicrotask(() => {
        setHistoryStates([cloneContent(content)]);
        setHistoryIndex(0);
      });
    }
  }, [content, hasUnsavedEdits]);

  // Undo/Redo methods
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetState = cloneContent(historyStates[nextIndex]);
      setHistoryIndex(nextIndex);
      setContent(targetState);
      setHasUnsavedEdits(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("strona_aktorska_draft_backup", JSON.stringify(targetState));
        setHasBackup(true);
      }
    }
  }, [historyIndex, historyStates]);

  const redo = useCallback(() => {
    if (historyIndex < historyStates.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = cloneContent(historyStates[nextIndex]);
      setHistoryIndex(nextIndex);
      setContent(targetState);
      setHasUnsavedEdits(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("strona_aktorska_draft_backup", JSON.stringify(targetState));
        setHasBackup(true);
      }
    }
  }, [historyIndex, historyStates]);

  // Global keyboard listener for Undo/Redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    if (!editMode || !isAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === "z";
      const isY = e.key.toLowerCase() === "y";
      const hasMetaOrCtrl = e.metaKey || e.ctrlKey;

      if (hasMetaOrCtrl && isZ) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (hasMetaOrCtrl && isY) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editMode, isAdmin, redo, undo]);

  // Listen to Firestore Content based on preview target
  useEffect(() => {
    const target = isPreviewPage ? "preview" : (isAdmin ? previewTarget : "live");

    return subscribeSiteContent(
      (nextContent) => {
        if (contentReadyRef.current && hasUnsavedEditsRef.current) {
          return;
        }

        setContent(() => {
          const backup = typeof window !== "undefined" ? localStorage.getItem("strona_aktorska_draft_backup") : null;
          if (backup && target === "preview") {
            try {
              // If we have unsaved local backup and we are switching to preview target, automatically restore it
              const restored = JSON.parse(backup);
              setContentReady(true);
              return restored;
            } catch (e) {
              console.error("Failed to parse local draft backup:", e);
            }
          }
          // Cache the live content so next page load has no placeholder flash
          if (target === "live") {
            setCachedContent(nextContent);
          }
          setContentReady(true);
          return nextContent;
        });
      },
      (error) => {
        setStatusMessage(error.message);
      },
      target
    );
  }, [isAdmin, previewTarget, isPreviewPage]);

  // Synchronize Theme (Light / Dark) class on document and body
  useEffect(() => {
    if (typeof window === "undefined" || !contentReady) return;
    const isDark = content.theme === "dark";
    const root = document.documentElement;
    const body = document.body;
    if (isDark) {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }
  }, [content.theme, contentReady]);

  // Synchronize Premium Accent Colors class and custom properties on document and body
  useEffect(() => {
    if (typeof window === "undefined" || !contentReady) return;
    const hasAccents = !!content.accentColorsEnabled;
    const body = document.body;
    if (hasAccents) {
      body.classList.add("has-accents");
      const color = content.accentColor || "#c5a880";
      body.style.setProperty("--accent", color);
    } else {
      body.classList.remove("has-accents");
      body.style.removeProperty("--accent");
    }
  }, [content.accentColorsEnabled, content.accentColor, contentReady]);

  const savePreviewWithLock = useCallback(async (contentToSave: SiteContent) => {
    if (savingInProgressRef.current) {
      pendingSaveContentRef.current = contentToSave;
      return;
    }

    savingInProgressRef.current = true;
    setAutosaveStatus("saving");

    try {
      await saveSiteContent(contentToSave, "preview");
      setRemoteSaveBlocked(false);
      setAutosaveStatus("saved");
      setHasUnsavedEdits(false);
      setStatusMessage(null); // Clear errors on success
      if (typeof window !== "undefined") {
        localStorage.removeItem("strona_aktorska_draft_backup");
        setHasBackup(false);
      }
    } catch (err) {
      if (!isPermissionDenied(err)) {
        console.warn("Autosave failed:", err);
        setAutosaveStatus("error");
      } else {
        setRemoteSaveBlocked(true);
        setAutosaveStatus("idle");
      }
      setStatusMessage(friendlyErrorMessage(err, "Nie udało się automatycznie zapisać szkicu."));
    } finally {
      savingInProgressRef.current = false;
      if (pendingSaveContentRef.current) {
        const nextContent = pendingSaveContentRef.current;
        pendingSaveContentRef.current = null;
        void savePreviewWithLock(nextContent);
      }
    }
  }, []);

  // Debounced Autosave to Firestore preview target
  useEffect(() => {
    if (!hasUnsavedEdits || !editMode || !isAdmin) return;
    if (remoteSaveBlocked) {
      queueMicrotask(() => setAutosaveStatus("idle"));
      return;
    }

    queueMicrotask(() => setAutosaveStatus("saving"));
    const timer = setTimeout(async () => {
      void savePreviewWithLock(content);
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timer);
  }, [content, hasUnsavedEdits, editMode, isAdmin, remoteSaveBlocked, savePreviewWithLock]);

  useEffect(() => {
    if (!hasUnsavedEdits || !editMode || !isAdmin) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedEdits, editMode, isAdmin]);

  // Immediate Save helper
  const triggerImmediateSave = async (currentContent: SiteContent) => {
    if (!hasUnsavedEdits) return;
    if (remoteSaveBlocked) return;
    void savePreviewWithLock(currentContent);
  };

  const updateContent = (recipe: (draft: SiteContent) => void) => {
    setContent((current) => {
      const next = cloneContent(current);
      recipe(next);

      // Append state to history stack and truncate any future redo items
      setHistoryStates((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const nextStates = [...truncated, cloneContent(next)];
        setHistoryIndex(nextStates.length - 1);
        return nextStates;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("strona_aktorska_draft_backup", JSON.stringify(next));
        setHasBackup(true);
      }
      setHasUnsavedEdits(true);
      return next;
    });
  };

  const createVersionCheckpoint = async (type: ContentVersion["type"] = "manual", customLabel?: string) => {
    const timestamp = Date.now();
    const dateStr = new Intl.DateTimeFormat("pl-PL", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date(timestamp));
    
    let label = "";
    if (customLabel) {
      label = customLabel;
    } else if (type === "draft") {
      label = `Zapis szkicu (${dateStr})`;
    } else if (type === "live") {
      label = `Publikacja Live (${dateStr})`;
    } else {
      label = `Punkt kontrolny (${dateStr})`;
    }

    const newVersion: ContentVersion = {
      id: createId("ver"),
      timestamp,
      type,
      label,
      content: cloneContent(content)
    };

    try {
      await saveContentVersion(newVersion);
      const updated = await fetchContentVersions();
      setHistoryVersions(updated);
    } catch (error) {
      console.error("Failed to create version checkpoint:", error);
    }
  };

  const refreshHistoryVersions = async () => {
    if (!isAdmin) {
      setHistoryVersions([]);
      return;
    }

    const versions = await fetchContentVersions();
    setHistoryVersions(versions);
  };

  const restoreVersion = (versionId: string) => {
    const found = historyVersions.find((v) => v.id === versionId);
    if (found) {
      const restored = cloneContent(found.content);
      setContent(restored);
      setHistoryStates((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const nextStates = [...truncated, restored];
        setHistoryIndex(nextStates.length - 1);
        return nextStates;
      });
      setHasUnsavedEdits(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("strona_aktorska_draft_backup", JSON.stringify(found.content));
        setHasBackup(true);
      }
    }
  };

  const deleteVersion = async (versionId: string) => {
    try {
      await deleteContentVersion(versionId);
      const updated = await fetchContentVersions();
      setHistoryVersions(updated);
    } catch (error) {
      console.error("Failed to delete version:", error);
    }
  };

  const saveDraft = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    setRemoteSaveBlocked(false);
    try {
      while (savingInProgressRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      savingInProgressRef.current = true;

      await saveSiteContent(content, "preview");
      await createVersionCheckpoint("draft");
      if (typeof window !== "undefined") {
        localStorage.removeItem("strona_aktorska_draft_backup");
        setHasBackup(false);
      }
      setHasUnsavedEdits(false);
      setAutosaveStatus("saved");
      setRemoteSaveBlocked(false);
      setSavedAt(
        new Intl.DateTimeFormat("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).format(new Date())
      );
      setStatusMessage(null);
    } catch (error) {
      console.error("[saveDraft] Error:", error);
      if (isPermissionDenied(error)) {
        setRemoteSaveBlocked(true);
        setAutosaveStatus("idle");
      } else {
        setAutosaveStatus("error");
      }
      setStatusMessage(friendlyErrorMessage(error, "Nie udało się zapisac szkicu."));
    } finally {
      savingInProgressRef.current = false;
      setIsSaving(false);
    }
  };

  const publishLive = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    setRemoteSaveBlocked(false);
    try {
      while (savingInProgressRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      savingInProgressRef.current = true;

      // Save to both preview and live targets
      await saveSiteContent(content, "live");
      await saveSiteContent(content, "preview");
      await createVersionCheckpoint("live");
      // Update session cache immediately so next refresh shows published content
      setCachedContent(content);
      if (typeof window !== "undefined") {
        localStorage.removeItem("strona_aktorska_draft_backup");
        setHasBackup(false);
      }
      setHasUnsavedEdits(false);
      setAutosaveStatus("saved");
      setRemoteSaveBlocked(false);
      setSavedAt(
        new Intl.DateTimeFormat("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).format(new Date())
      );
      setStatusMessage(null);
    } catch (error) {
      console.error("[publishLive] Error:", error);
      if (isPermissionDenied(error)) {
        setRemoteSaveBlocked(true);
        setAutosaveStatus("idle");
      } else {
        setAutosaveStatus("error");
      }
      setStatusMessage(friendlyErrorMessage(error, "Nie udało się opublikować na żywo."));
    } finally {
      savingInProgressRef.current = false;
      setIsSaving(false);
    }
  };

  const restoreBackup = () => {
    if (typeof window !== "undefined") {
      const backup = localStorage.getItem("strona_aktorska_draft_backup");
      if (backup) {
        try {
          const parsed = JSON.parse(backup);
          setContent(parsed);
          setHistoryStates((prev) => {
            const truncated = prev.slice(0, historyIndex + 1);
            const nextStates = [...truncated, parsed];
            setHistoryIndex(nextStates.length - 1);
            return nextStates;
          });
          setHasUnsavedEdits(true);
        } catch (e) {
          console.error("Błąd przywracania autozapisu:", e);
        }
      }
    }
  };

  const clearBackup = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("strona_aktorska_draft_backup");
      setHasBackup(false);
      setHasUnsavedEdits(false);
      setAutosaveStatus("idle");
    }
  };

  const handleSetEditMode = (value: boolean) => {
    if (!value && editMode && hasUnsavedEdits) {
      void triggerImmediateSave(content);
    }
    if (!value) {
      setAutosaveStatus("idle");
    }
    setEditMode(value);
  };

  const handleSetPreviewTarget = (target: ContentTarget) => {
    if (previewTarget !== target && hasUnsavedEdits) {
      void triggerImmediateSave(content);
    }
    setPreviewTarget(target);
  };

  const logout = async () => {
    if (hasUnsavedEdits) {
      await triggerImmediateSave(content);
    }
    await signOut(firebaseAuth);
    setUser(null);
    setEditMode(false);
    setPreviewTarget("live");
    setSavedAt(null);
    setAutosaveStatus("idle");
  };

  return (
    <AdminEditContext.Provider
      value={{
        isAdmin,
        user,
        authLoading,
        editMode,
        setEditMode: handleSetEditMode,
        previewTarget,
        setPreviewTarget: handleSetPreviewTarget,
        content,
        contentReady,
        updateContent,
        isSaving,
        savedAt,
        statusMessage,
        setStatusMessage,
        saveDraft,
        publishLive,
        logout,
        hasBackup,
        restoreBackup,
        clearBackup,
        historyVersions,
        refreshHistoryVersions,
        createVersionCheckpoint,
        restoreVersion,
        deleteVersion,
        autosaveStatus,
        hasUnsavedEdits,
        remoteSaveBlocked,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < historyStates.length - 1
      }}
    >
      {children}
    </AdminEditContext.Provider>
  );
}

export function useAdminEdit() {
  const context = useContext(AdminEditContext);
  if (context === undefined) {
    throw new Error("useAdminEdit must be used within an AdminEditProvider");
  }
  return context;
}
