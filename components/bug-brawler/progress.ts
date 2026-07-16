import { useEffect, useState } from "react";
import { getCurrentUsername } from "./accounts";

export type PlayerProgress = {
  money: number;
  weaponLevel: number;
  armorLevel: number;
  levelsSurvived: number;
  tutorialCompleted: boolean;
};

const STORAGE_KEY = "bug-brawler-progress";

export const defaultProgress: PlayerProgress = {
  money: 0,
  weaponLevel: 0,
  armorLevel: 0,
  levelsSurvived: 0,
  tutorialCompleted: false,
};

const progressKey = (username = getCurrentUsername()) => username ? `${STORAGE_KEY}:${username}` : STORAGE_KEY;

export function loadProgress(username?: string | null): PlayerProgress {
  if (typeof window === "undefined") {
    return defaultProgress;
  }

  try {
    const raw = window.localStorage.getItem(progressKey(username));
    if (!raw) {
      return defaultProgress;
    }

    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      money: Math.max(0, Number(parsed.money ?? defaultProgress.money)),
      weaponLevel: Math.max(0, Number(parsed.weaponLevel ?? defaultProgress.weaponLevel)),
      armorLevel: Math.max(0, Number(parsed.armorLevel ?? defaultProgress.armorLevel)),
      levelsSurvived: Math.max(0, Math.floor(Number(parsed.levelsSurvived ?? defaultProgress.levelsSurvived))),
      tutorialCompleted: Boolean(parsed.tutorialCompleted ?? defaultProgress.tutorialCompleted),
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: PlayerProgress, username?: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(progressKey(username), JSON.stringify(progress));
}

export function usePlayerProgress() {
  const [progress, setProgressState] = useState<PlayerProgress>(defaultProgress);

  useEffect(() => {
    setProgressState(loadProgress());
  }, []);

  const setProgress = (next: PlayerProgress | ((current: PlayerProgress) => PlayerProgress)) => {
    setProgressState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      const safe = {
        money: Math.max(0, resolved.money),
        weaponLevel: Math.max(0, resolved.weaponLevel),
        armorLevel: Math.max(0, resolved.armorLevel),
        levelsSurvived: Math.max(0, Math.floor(resolved.levelsSurvived)),
        tutorialCompleted: Boolean(resolved.tutorialCompleted),
      };
      saveProgress(safe);
      return safe;
    });
  };

  const addMoney = (amount: number) => {
    setProgress((current) => ({ ...current, money: current.money + amount }));
  };

  return { progress, setProgress, addMoney };
}
