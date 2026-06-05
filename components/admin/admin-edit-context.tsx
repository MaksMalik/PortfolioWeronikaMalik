"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
import { siteContent } from "@/lib/site-content";
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
  createVersionCheckpoint: (type?: ContentVersion["type"], customLabel?: string) => Promise<void>;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => Promise<void>;
  autosaveStatus: "idle" | "saving" | "saved" | "error";
  hasUnsavedEdits: boolean;
};

const AdminEditContext = createContext<AdminEditContextType | undefined>(undefined);

export function AdminEditProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<ContentTarget>("live");
  
  // Local active content (might be loaded from preview or live, depending on target)
  const [content, setContent] = useState<SiteContent>(() => cloneContent(siteContent));
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<ContentVersion[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const pathname = usePathname();
  const isPreviewPage = pathname === "/preview";

  // Check for local storage backup on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const backup = localStorage.getItem("strona_aktorska_draft_backup");
      if (backup) {
        setHasBackup(true);
      }
    }
  }, []);

  // Fetch Firestore history versions on admin login
  useEffect(() => {
    if (isAdmin) {
      fetchContentVersions().then((versions) => {
        setHistoryVersions(versions);
      });
    } else {
      setHistoryVersions([]);
    }
  }, [isAdmin]);

  // Listen to Auth State
  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (nextUser && nextUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        void signOut(firebaseAuth);
        setUser(null);
      } else {
        setUser(nextUser);
        if (nextUser) {
          // Default to preview mode when admin logs in
          setPreviewTarget("preview");
          setEditMode(true);
        } else {
          setEditMode(false);
          setPreviewTarget("live");
        }
      }
      setAuthLoading(false);
    });
  }, []);

  // Listen to Firestore Content based on preview target
  useEffect(() => {
    const target = isPreviewPage ? "preview" : (isAdmin ? previewTarget : "live");

    return subscribeSiteContent(
      (nextContent) => {
        setContent((current) => {
          const backup = typeof window !== "undefined" ? localStorage.getItem("strona_aktorska_draft_backup") : null;
          if (backup && target === "preview") {
            try {
              // If we have unsaved local backup and we are switching to preview target, automatically restore it
              return JSON.parse(backup);
            } catch (e) {
              console.error("Failed to parse local draft backup:", e);
            }
          }
          return nextContent;
        });
      },
      (error) => {
        setStatusMessage(error.message);
      },
      target
    );
  }, [isAdmin, previewTarget, isPreviewPage]);

  // Debounced Autosave to Firestore preview target
  useEffect(() => {
    if (!hasUnsavedEdits || !editMode || !isAdmin) return;

    setAutosaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        await saveSiteContent(content, "preview");
        setAutosaveStatus("saved");
        setHasUnsavedEdits(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("strona_aktorska_draft_backup");
          setHasBackup(false);
        }
      } catch (err) {
        console.error("Autosave failed:", err);
        setAutosaveStatus("error");
      }
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timer);
  }, [content, hasUnsavedEdits, editMode, isAdmin]);

  // Immediate Save helper
  const triggerImmediateSave = async (currentContent: SiteContent) => {
    if (!hasUnsavedEdits) return;
    setAutosaveStatus("saving");
    try {
      await saveSiteContent(currentContent, "preview");
      setAutosaveStatus("saved");
      setHasUnsavedEdits(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("strona_aktorska_draft_backup");
        setHasBackup(false);
      }
    } catch (err) {
      console.error("Immediate save failed:", err);
      setAutosaveStatus("error");
    }
  };

  const updateContent = (recipe: (draft: SiteContent) => void) => {
    setContent((current) => {
      const next = cloneContent(current);
      recipe(next);
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

  const restoreVersion = (versionId: string) => {
    const found = historyVersions.find((v) => v.id === versionId);
    if (found) {
      setContent(cloneContent(found.content));
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
    try {
      await saveSiteContent(content, "preview");
      await createVersionCheckpoint("draft");
      if (typeof window !== "undefined") {
        localStorage.removeItem("strona_aktorska_draft_backup");
        setHasBackup(false);
      }
      setHasUnsavedEdits(false);
      setAutosaveStatus("saved");
      setSavedAt(
        new Intl.DateTimeFormat("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).format(new Date())
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się zapisać szkicu.");
    } finally {
      setIsSaving(false);
    }
  };

  const publishLive = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      // Save to both preview and live targets
      await saveSiteContent(content, "live");
      await saveSiteContent(content, "preview");
      await createVersionCheckpoint("live");
      if (typeof window !== "undefined") {
        localStorage.removeItem("strona_aktorska_draft_backup");
        setHasBackup(false);
      }
      setHasUnsavedEdits(false);
      setAutosaveStatus("saved");
      setSavedAt(
        new Intl.DateTimeFormat("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).format(new Date())
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się opublikować na żywo.");
    } finally {
      setIsSaving(false);
    }
  };

  const restoreBackup = () => {
    if (typeof window !== "undefined") {
      const backup = localStorage.getItem("strona_aktorska_draft_backup");
      if (backup) {
        try {
          setContent(JSON.parse(backup));
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
        createVersionCheckpoint,
        restoreVersion,
        deleteVersion,
        autosaveStatus,
        hasUnsavedEdits
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
