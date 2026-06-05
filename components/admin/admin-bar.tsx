"use client";

import { useState } from "react";
import { useAdminEdit } from "./admin-edit-context";
import { Eye, EyeOff, Save, Rocket, LogOut, Loader2, History, Trash2, Clock, Undo, Redo, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminBar() {
  const {
    isAdmin,
    editMode,
    setEditMode,
    previewTarget,
    setPreviewTarget,
    isSaving,
    saveDraft,
    publishLive,
    logout,
    hasBackup,
    restoreBackup,
    clearBackup,
    historyVersions,
    refreshHistoryVersions,
    restoreVersion,
    deleteVersion,
    createVersionCheckpoint,
    autosaveStatus,
    hasUnsavedEdits,
    remoteSaveBlocked,
    undo,
    redo,
    canUndo,
    canRedo,
    statusMessage
  } = useAdminEdit();

  const [showHistory, setShowHistory] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="no-scrollbar fixed bottom-2 left-2 right-2 z-[70] flex min-h-10 max-w-none flex-nowrap items-center justify-start gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-ink/94 px-2 py-1.5 text-white shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 select-none sm:bottom-4 sm:left-4 sm:right-4 sm:min-h-11 sm:gap-1.5 sm:rounded-full sm:px-3 lg:justify-center">
      {/* Left section: compact save status */}
      <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
        <span
          className={cn(
            "inline-flex h-2 w-2 shrink-0 rounded-full",
            autosaveStatus === "saving" && "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]",
            autosaveStatus === "saved" && "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]",
            autosaveStatus === "error" && "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.55)]",
            autosaveStatus === "idle" && hasUnsavedEdits && "bg-amber-400",
            autosaveStatus === "idle" && !hasUnsavedEdits && "bg-white/35",
            remoteSaveBlocked && "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.55)]"
          )}
        />
        <span
          className={cn(
            "hidden text-[0.58rem] font-semibold uppercase tracking-wider transition-colors duration-300 xl:inline",
            autosaveStatus === "saving" && "text-amber-200 animate-pulse",
            autosaveStatus === "saved" && "text-emerald-400",
            autosaveStatus === "error" && "text-red-400 font-bold",
            autosaveStatus === "idle" && hasUnsavedEdits && "text-amber-200",
            autosaveStatus === "idle" && !hasUnsavedEdits && "text-white/40",
            remoteSaveBlocked && "text-amber-200"
          )}
          title={(autosaveStatus === "error" || remoteSaveBlocked) && statusMessage ? statusMessage : undefined}
        >
          {remoteSaveBlocked && "Lokalnie"}
          {!remoteSaveBlocked && autosaveStatus === "saving" && "Zapisywanie..."}
          {!remoteSaveBlocked && autosaveStatus === "saved" && "Zapisano"}
          {!remoteSaveBlocked && autosaveStatus === "error" && "Błąd zapisu!"}
          {!remoteSaveBlocked && autosaveStatus === "idle" && hasUnsavedEdits && "Niezapisane"}
          {!remoteSaveBlocked && autosaveStatus === "idle" && !hasUnsavedEdits && "Zapisano"}
        </span>
      </div>

      {/* Middle section: Backup recovery / Toggles */}
      <div className="flex items-center gap-1.5">
        {/* Autosave recovery notification */}
        {hasBackup && (
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5 text-[0.62rem] font-bold text-white/70">
            <Clock className="ml-1 h-3 w-3 text-white/45" />
            <button
              type="button"
              onClick={restoreBackup}
              className="inline-flex h-7 items-center justify-center gap-1 rounded-full px-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:px-2"
              title="Przywróć kopię roboczą"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden lg:inline">Przywróć</span>
            </button>
            <button
              type="button"
              onClick={clearBackup}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white"
              title="Odrzuć kopię roboczą"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Toggle Edit Mode */}
        <button
          type="button"
          onClick={() => {
            if (!editMode) {
              setPreviewTarget("preview");
            }
            setEditMode(!editMode);
          }}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 sm:px-3",
            editMode
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
              : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
          )}
          title={editMode ? "Wyłącz edycję" : "Włącz edycję"}
        >
          {editMode ? <Eye className="h-3.5 w-3.5 shrink-0" /> : <EyeOff className="h-3.5 w-3.5 shrink-0" />}
          <span className="hidden sm:inline">{editMode ? "Edycja: Wł" : "Edycja: Wył"}</span>
        </button>

        {/* Undo/Redo Buttons */}
        {editMode && (
          <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5 ml-0.5 shrink-0">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Cofnij ostatnią zmianę (Ctrl+Z)"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Ponów cofniętą zmianę (Ctrl+Y)"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Preview Target selector - only when edit mode is OFF */}
        {!editMode && (
          <div className="hidden sm:flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewTarget("live")}
              className={cn(
                "rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] transition-all duration-300",
                previewTarget === "live"
                  ? "bg-white text-ink shadow-sm"
                  : "text-white/60 hover:text-white"
              )}
            >
              Live
            </button>
            <button
              type="button"
              onClick={() => setPreviewTarget("preview")}
              className={cn(
                "rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] transition-all duration-300",
                previewTarget === "preview"
                  ? "bg-white text-ink shadow-sm"
                  : "text-white/60 hover:text-white"
              )}
            >
              Szkic
            </button>
          </div>
        )}
      </div>

      {/* Right section: Save / Publish / Versions / Logout */}
      <div className="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
        {editMode && (
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSaving}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white/80 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 sm:px-3"
            title="Zapisz jako szkic roboczy"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Szkic</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setShowHistory((prev) => {
              const next = !prev;
              if (next) {
                void refreshHistoryVersions();
              }
              return next;
            });
          }}
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-all sm:px-3",
            showHistory
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          )}
          title="Historia wersji"
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Wersje</span>
        </button>

        <button
          type="button"
          onClick={publishLive}
          disabled={isSaving}
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-all hover:bg-porcelain sm:px-3",
            isSaving && "opacity-40 cursor-not-allowed"
          )}
          title="Opublikuj na żywo dla wszystkich użytkowników"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Rocket className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Publikuj</span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-all hover:border-white/30 hover:bg-red-500/10 hover:text-red-400 shrink-0"
          title="Wyloguj się"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* History Dropdown Panel */}
        {showHistory && (
          <div className="absolute right-0 bottom-12 z-50 max-h-96 w-72 overflow-y-auto rounded-xl border border-white/10 bg-ink p-3 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Wersje (Max 10)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Czy na pewno chcesz utworzyć ręczny punkt kontrolny?")) {
                    createVersionCheckpoint("manual");
                  }
                }}
                className="text-[0.58rem] font-extrabold uppercase text-emerald-400 hover:text-emerald-300"
              >
                Utwórz punkt
              </button>
            </div>
            {historyVersions.length === 0 ? (
              <p className="text-[0.68rem] text-white/40 text-center py-4">Brak zapisanych wersji.</p>
            ) : (
              <div className="grid gap-1">
                {historyVersions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/5 text-[0.68rem]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Czy przywrócić wersję: ${ver.label}? Obecne niezapisane zmiany zostaną nadpisane.`)) {
                          restoreVersion(ver.id);
                          setShowHistory(false);
                        }
                      }}
                      className="flex-1 text-left font-medium text-white hover:text-emerald-300 truncate"
                      title="Przywróć tę wersję"
                    >
                      {ver.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVersion(ver.id)}
                      className="text-red-400 hover:text-red-300 px-1"
                      title="Usuń"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
