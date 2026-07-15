"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

const initialTargets = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ShootingRangePage() {
  const { progress, addMoney } = usePlayerProgress();
  const [targets, setTargets] = useState<number[]>(initialTargets);
  const [score, setScore] = useState(0);
  const [cash, setCash] = useState(0);

  const hitTarget = (target: number) => {
    setTargets((current) => current.filter((value) => value !== target));
    setScore((current) => current + 1);
    setCash((current) => current + 12);
    addMoney(12);
  };

  const resetRange = () => {
    setTargets(initialTargets);
    setScore(0);
    setCash(0);
  };

  const progress = useMemo(() => Math.round((targets.length / initialTargets.length) * 100), [targets.length]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>TARGET PRACTICE</p>
            <h1 style={styles.title}>Shooting Range</h1>
            <p style={styles.subtitle}>Clear every target to stack cash and sharpen your aim.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsBar}>
          <div style={styles.statBox}><strong>{score}</strong><span>Hits</span></div>
          <div style={styles.statBox}><strong>${cash + progress.money}</strong><span>Wallet</span></div>

        <div style={styles.range}>
          {targets.length > 0 ? targets.map((target) => (
            <button key={target} style={styles.targetButton} onClick={() => hitTarget(target)}>
              🎯 {target}
            </button>
          )) : (
            <div style={styles.doneState}>All targets down. Great shooting.</div>
          )}
        </div>

        <button style={styles.resetButton} onClick={resetRange}>Reset Range</button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "radial-gradient(circle at top, #254b6e, #060b12)",
    color: "#f6fbff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(960px, 100%)",
    padding: 24,
    borderRadius: 24,
    background: "rgba(7, 16, 28, 0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#8ee6ff",
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
    color: "#8ee6ff",
    textDecoration: "none",
    fontWeight: 700,
  },
  statsBar: {
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
  range: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  targetButton: {
    padding: "18px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "linear-gradient(140deg, #26516b, #102233)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  doneState: {
    gridColumn: "1 / -1",
    padding: 20,
    borderRadius: 14,
    textAlign: "center",
    background: "rgba(95, 255, 177, 0.16)",
    color: "#93ffba",
  },
  resetButton: {
    border: "none",
    borderRadius: 999,
    padding: "12px 16px",
    background: "linear-gradient(90deg, #4fe6ff, #46d47b)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
  },
};
