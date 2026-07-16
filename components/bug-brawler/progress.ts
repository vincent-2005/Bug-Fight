import { useEffect, useState } from "react";
import { getCurrentUsername } from "./accounts";
import { supabase } from "@/lib/supabase";

export type PlayerProgress = {
  money: number;
  weaponLevel: number;
  armorLevel: number;
  speedLevel: number;
  shieldLevel: number;
  levelsSurvived: number;
  tutorialCompleted: boolean;
};

const STORAGE_KEY = "bug-brawler-progress";

export const defaultProgress: PlayerProgress = {
  money: 0,
  weaponLevel: 0,
  armorLevel: 0,
  speedLevel: 0,
  shieldLevel: 0,
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
      speedLevel: Math.max(0, Number(parsed.speedLevel ?? defaultProgress.speedLevel)),
      shieldLevel: Math.max(0, Number(parsed.shieldLevel ?? defaultProgress.shieldLevel)),
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
  void supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return;
    return supabase.from("profiles").update({ money: progress.money, weapon_level: progress.weaponLevel, armor_level: progress.armorLevel, levels_survived: progress.levelsSurvived, tutorial_completed: progress.tutorialCompleted }).eq("id", data.user.id);
  });
}

export function usePlayerProgress() {
  const [progress, setProgressState] = useState<PlayerProgress>(defaultProgress);

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setProgressState(loadProgress());
      const { data: remote } = await supabase.from("profiles").select("money, weapon_level, armor_level, levels_survived, tutorial_completed").eq("id", data.user.id).single();
      if (!remote) return setProgressState(loadProgress());
      const loaded = { money: remote.money, weaponLevel: remote.weapon_level, armorLevel: remote.armor_level, speedLevel: loadProgress().speedLevel, shieldLevel: loadProgress().shieldLevel, levelsSurvived: remote.levels_survived, tutorialCompleted: remote.tutorial_completed };
      saveProgress(loaded);
      setProgressState(loaded);
    });
  }, []);

  const setProgress = (next: PlayerProgress | ((current: PlayerProgress) => PlayerProgress)) => {
    setProgressState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      const safe = {
        money: Math.max(0, resolved.money),
        weaponLevel: Math.max(0, resolved.weaponLevel),
        armorLevel: Math.max(0, resolved.armorLevel),
        speedLevel: Math.max(0, resolved.speedLevel),
        shieldLevel: Math.max(0, resolved.shieldLevel),
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
