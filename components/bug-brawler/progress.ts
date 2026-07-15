import { useEffect, useState } from "react";

export type PlayerProgress = {
  money: number;
  weaponLevel: number;
  armorLevel: number;
};

const STORAGE_KEY = "bug-brawler-progress";

export const defaultProgress: PlayerProgress = {
  money: 140,
  weaponLevel: 1,
  armorLevel: 1,
};

export function loadProgress(): PlayerProgress {
  if (typeof window === "undefined") {
    return defaultProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }

    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      money: Math.max(0, Number(parsed.money ?? defaultProgress.money)),
      weaponLevel: Math.max(1, Number(parsed.weaponLevel ?? defaultProgress.weaponLevel)),
      armorLevel: Math.max(1, Number(parsed.armorLevel ?? defaultProgress.armorLevel)),
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: PlayerProgress) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
        weaponLevel: Math.max(1, resolved.weaponLevel),
        armorLevel: Math.max(1, resolved.armorLevel),
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
