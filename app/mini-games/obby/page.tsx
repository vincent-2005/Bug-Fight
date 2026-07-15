"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

type Hazard = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const checkpoints = [20, 40, 60, 80, 100];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildCourse(level: number) {
  const platformCount = Math.min(7, 4 + Math.floor((level - 1) / 2));
  const width = Math.max(12, 20 - level * 1.2);
  const yPattern = [76, 60, 76, 44, 76, 58, 76];

  const platforms: Platform[] = Array.from({ length: platformCount }, (_, index) => {
    const x = 8 + (index / Math.max(1, platformCount - 1)) * 72;
    const y = yPattern[index] - Math.min(10, Math.floor(level / 2) * 3);

    return {
      x,
      y,
      width,
      height: 8,
      label: index === 0 ? "Start" : index === platformCount - 1 ? "Finish" : `Step ${index}`,
    };
  });

  const hazards: Hazard[] = Array.from({ length: Math.max(0, level - 1) }, (_, index) => ({
    x: 20 + index * 12,
    y: 64 - index * 6,
    width: 8,
    height: 8,
  }));

  return { platforms, hazards };
}

export default function ObbyPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ARCADE ZONE</p>
            <h1 style={styles.title}>Obby removed</h1>
            <p style={styles.subtitle}>This game has been retired. Head back to the arcade hub and try the new lineup of mini-games.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "radial-gradient(circle at top, #3a3048, #060913)",
    color: "#f6fbff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(980px, 100%)",
    padding: 24,
    borderRadius: 24,
    background: "rgba(8, 16, 28, 0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#f2bdff",
    fontSize: 12,
  },
  title: {
    margin: "8px 0 6px",
    fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
  },
  subtitle: {
    margin: 0,
    color: "#9eb4c9",
    lineHeight: 1.6,
  },
  backLink: {
    color: "#f2bdff",
    textDecoration: "none",
    fontWeight: 700,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    margin: "20px 0",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    textAlign: "center",
    gap: 4,
  },
  courseArena: {
    position: "relative",
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    background: "linear-gradient(180deg, #17344f 0%, #0c1b28 100%)",
    border: "1px solid rgba(255,255,255,0.16)",
    marginBottom: 16,
  },
  skyGlow: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at top, rgba(114, 224, 255, 0.3), transparent 56%)",
    pointerEvents: "none",
  },
  void: {
    position: "absolute",
    inset: "0 0 0 0",
    background: "linear-gradient(180deg, rgba(2, 8, 14, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%)",
    clipPath: "polygon(0 100%, 0 60%, 100% 60%, 100% 100%)",
  },
  platform: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    padding: "10px 14px",
    borderRadius: 999,
    background: "linear-gradient(90deg, #7c3aed, #2dd4bf)",
    color: "#041018",
    fontWeight: 800,
    boxShadow: "0 8px 22px rgba(0, 0, 0, 0.25)",
    textAlign: "center",
    display: "grid",
    placeItems: "center",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  },
  hazard: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    borderRadius: 10,
    background: "linear-gradient(135deg, #fb7185, #be123c)",
    boxShadow: "0 8px 20px rgba(190, 18, 60, 0.3)",
  },
  flag: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    width: 20,
    height: 60,
    pointerEvents: "none",
  },
  flagPole: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 3,
    height: 60,
    background: "#f2f6ff",
    transform: "translateX(-50%)",
  },
  flagBanner: {
    position: "absolute",
    left: 6,
    top: 8,
    width: 26,
    height: 16,
    background: "linear-gradient(90deg, #ff7f50, #ffd166)",
    borderRadius: 4,
    transform: "rotate(-6deg)",
  },
  player: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fef08a, #f97316)",
    border: "3px solid #fff",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.32)",
    transition: "left 0.45s ease, top 0.45s ease, transform 0.45s ease",
  },
  playerEye: {
    position: "absolute",
    top: 8,
    left: 10,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#0f172a",
  },
  course: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  checkpoint: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    fontWeight: 700,
  },
  bar: {
    height: 12,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #ffb64d, #ff6e57)",
  },
  status: {
    color: "#ffd69f",
    marginBottom: 12,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  button: {
    border: "none",
    borderRadius: 999,
    padding: "12px 16px",
    background: "linear-gradient(90deg, #f5b1ff, #73e0ff)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
  },
  helper: {
    color: "#9eb4c9",
    fontSize: 14,
  },
  reward: {
    marginTop: 10,
    color: "#7ef0aa",
    fontWeight: 700,
  },
};
