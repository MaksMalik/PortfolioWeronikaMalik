"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAdminEdit } from "./admin-edit-context";
import { Eye, EyeOff, Save, Rocket, LogOut, Loader2, History, Trash2, Clock, Undo, Redo, Moon, Sun, Sparkles } from "lucide-react";
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
    user,
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
    undo,
    redo,
    canUndo,
    canRedo,
    statusMessage,
    content,
    updateContent
  } = useAdminEdit();

  const [showHistory, setShowHistory] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="no-scrollbar fixed bottom-2 left-2 right-2 z-[70] flex min-h-10 max-w-none flex-nowrap items-center justify-start gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-ink/94 px-2 py-1.5 text-white shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 select-none sm:bottom-4 sm:left-4 sm:right-4 sm:min-h-11 sm:gap-1.5 sm:rounded-full sm:px-3 lg:justify-center">
      {/* Left section: status logo (hidden text on mobile/tablet to save space, keeping color status dot) */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex h-2.5 w-2.5 rounded-full shrink-0 transition-all duration-300 shadow-[0_0_8px_currentColor]",
            (autosaveStatus === "saving" || (autosaveStatus === "idle" && hasUnsavedEdits)) && "bg-amber-400 text-amber-400/60 animate-pulse",
            autosaveStatus === "saved" && "bg-emerald-400 text-emerald-400/60",
            autosaveStatus === "error" && "bg-red-400 text-red-400/60 shadow-[0_0_10px_rgba(248,113,113,0.8)] animate-bounce"
          )}
          title={
            autosaveStatus === "saving" ? "Zapisywanie zmian..." :
            autosaveStatus === "saved" ? "Wszystkie zmiany zapisane w chmurze" :
            autosaveStatus === "error" ? `Błąd zapisu: ${statusMessage || "Nieznany błąd"}` :
            hasUnsavedEdits ? "Masz niezapisane zmiany" : "Zmiany zapisane"
          }
        />
        <span
          className={cn(
            "hidden md:inline-block text-[0.58rem] font-semibold transition-colors duration-300 uppercase tracking-wider",
            autosaveStatus === "saving" && "text-amber-400 animate-pulse",
            autosaveStatus === "saved" && "text-emerald-400",
            autosaveStatus === "error" && "text-red-400 font-bold",
            autosaveStatus === "idle" && hasUnsavedEdits && "text-amber-400/80",
            autosaveStatus === "idle" && !hasUnsavedEdits && "text-white/40"
          )}
        >
          {autosaveStatus === "saving" && "Zapisywanie..."}
          {autosaveStatus === "saved" && "Zapisano"}
          {autosaveStatus === "error" && "Błąd!"}
          {autosaveStatus === "idle" && hasUnsavedEdits && "Niezapisane"}
          {autosaveStatus === "idle" && !hasUnsavedEdits && "Zapisano"}
        </span>
      </div>

      {/* Middle section: Backup recovery / Toggles */}
      <div className="flex items-center gap-2">
        {/* Autosave recovery notification */}
        {hasBackup && (
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[0.62rem] font-bold text-amber-400 shrink-0">
            <Clock className="h-3 w-3 sm:hidden text-amber-400" />
            <span className="hidden md:inline">Kopia robocza</span>
            <span className="md:hidden">Kopia</span>
            <button
              type="button"
              onClick={restoreBackup}
              className="underline hover:text-white cursor-pointer ml-1 font-extrabold uppercase text-[0.58rem]"
            >
              Przywróć
            </button>
            <button
              type="button"
              onClick={clearBackup}
              className="underline hover:text-white cursor-pointer ml-1 text-white/50 text-[0.58rem]"
            >
              Odrzuć
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
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 sm:px-4 text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 shrink-0",
            editMode
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
              : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
          )}
          title={editMode ? "Wyłącz edycję" : "Włącz edycję"}
        >
          {editMode ? <Eye className="h-3.5 w-3.5 shrink-0" /> : <EyeOff className="h-3.5 w-3.5 shrink-0" />}
          <span className="hidden lg:inline">{editMode ? "Edycja: Wł" : "Edycja: Wył"}</span>
        </button>

        {/* Undo/Redo Buttons */}
        {editMode && (
          <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5 ml-0.5 shrink-0">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Cofnij ostatnią zmianę (Ctrl+Z)"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Ponów cofniętą zmianę (Ctrl+Y)"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Preview Target selector - only when edit mode is OFF */}
        {!editMode && (
          <div className="hidden md:flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 shrink-0">
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
      <div className="flex items-center gap-1.5 sm:gap-2 relative">
        {editMode && (
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 sm:px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/80 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 shrink-0"
            title="Zapisz jako szkic roboczy"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">Szkic</span>
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
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-4 text-xs font-bold uppercase tracking-[0.12em] transition-all shrink-0",
            showHistory
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          )}
          title="Historia wersji"
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Wersje</span>
        </button>

        <button
          type="button"
          onClick={publishLive}
          disabled={isSaving || previewTarget === "live"}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-2.5 sm:px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-all hover:bg-porcelain shrink-0",
            (isSaving || previewTarget === "live") && "opacity-40 cursor-not-allowed"
          )}
          title={previewTarget === "live" ? "Przełącz na widok Szkic, aby opublikować zmiany" : "Opublikuj na żywo dla wszystkich użytkowników"}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Rocket className="h-3.5 w-3.5" />
          )}
          <span className="hidden lg:inline">Publikuj</span>
        </button>

        <button
          type="button"
          onClick={() => {
            updateContent((draft) => {
              draft.accentColorsEnabled = !draft.accentColorsEnabled;
            });
          }}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-4 text-xs font-bold uppercase tracking-[0.12em] transition-all shrink-0",
            content.accentColorsEnabled
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          )}
          title="Przełącz kolor akcentu (dla wszystkich)"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">{content.accentColorsEnabled ? "Kolor: Wł." : "Kolor: Wył."}</span>
        </button>

        {content.accentColorsEnabled && (
          <div className="flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-2.5 h-9 shrink-0">
            <input
              type="color"
              value={content.accentColor || "#c5a880"}
              onChange={(e) => {
                updateContent((draft) => {
                  draft.accentColor = e.target.value;
                });
              }}
              className="w-5 h-5 rounded-full border-0 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full"
              title="Wybierz kolor akcentu"
            />
            <span className="text-[10px] font-mono text-white/60 select-none">
              {(content.accentColor || "#c5a880").toUpperCase()}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            updateContent((draft) => {
              draft.theme = draft.theme === "dark" ? "light" : "dark";
            });
          }}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-4 text-xs font-bold uppercase tracking-[0.12em] transition-all shrink-0",
            content.theme === "dark"
              ? "border-purple-500 bg-purple-500/10 text-purple-400"
              : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          )}
          title="Przełącz motyw globalny (dla wszystkich)"
        >
          {content.theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span className="hidden lg:inline">{content.theme === "dark" ? "Ciemny" : "Jasny"}</span>
        </button>
        
        

        <button
          type="button"
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
          title={`Wyloguj się (${user?.email || ""})`}
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* History Dropdown Panel — portalled to body to escape backdrop-blur containing block */}
        {typeof document !== "undefined" && showHistory && createPortal(
          <div
            className="fixed bottom-16 right-4 z-[90] max-h-[min(24rem,calc(100svh-6rem))] w-72 overflow-y-auto rounded-xl border border-white/10 bg-ink p-3 text-white shadow-xl sm:bottom-20"
            data-lenis-prevent
          >
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
          </div>,
          document.body
        )}
      </div>
      
      
    </div>
  );
}
