"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface AccessibilitySettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}

interface PreferencesContextValue {
  settings: AccessibilitySettings;
  updateSettings: (patch: Partial<AccessibilitySettings>) => void;
  playCue: (kind: "click" | "clue" | "success") => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  soundEnabled: false,
  reducedMotion: false,
  highContrast: false,
  largeText: false,
};

const STORAGE_KEY = "onyargi_avcisi_a11y_v1";

const PreferencesContext = createContext<PreferencesContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  playCue: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
        setSettings({
          ...DEFAULT_SETTINGS,
          reducedMotion: prefersReduced,
          ...parsed,
        });
      } else if (prefersReduced) {
        setSettings((prev) => ({ ...prev, reducedMotion: true }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
    root.dataset.highContrast = settings.highContrast ? "true" : "false";
    root.dataset.largeText = settings.largeText ? "true" : "false";
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const playCue = useCallback(
    (kind: "click" | "clue" | "success") => {
      if (!settings.soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const freq = kind === "success" ? 660 : kind === "clue" ? 520 : 420;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        // ignore audio errors
      }
    },
    [settings.soundEnabled],
  );

  return (
    <PreferencesContext.Provider value={{ settings, updateSettings, playCue }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
