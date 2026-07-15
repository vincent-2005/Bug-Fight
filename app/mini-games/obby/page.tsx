"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

const checkpoints = [20, 40, 60, 80, 100];

export default function ObbyPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState(0);
  const [wins, setWins] = useState(0);

  const attempt = () => {
    const nextProgress = Math.floor(Math.random() * 100);
    setProgress(nextProgress);
    if (nextProgress >= 70) {
      const bonus = 50 + Math.floor(Math.random() * 20);
      setReward(bonus);
      setWins((value) => value + 1);
      addMoney(bonus);
    } else {
      setReward(10);
      addMoney(10);
    }
  };

  const status = useMemo(() => {
    if (progress >= 90) return "Perfect run";
    if (progress >= 70) return "Cleared";
    if (progress >= 40) return "Almost there";
    return "Needs more practice";
  }, [progress]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>OBBY RUN</p>
            <h1 style={styles.title}>Obstacle Course</h1>
            <p style={styles.subtitle}>Complete the course to earn cash for your upgrades.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{progress}%</strong><span>Progress</span></div>
          <div style={styles.statBox}><strong>${playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{wins}</strong><span>Wins</span></div>
        </div>

        <div style={styles.course}>
          {checkpoints.map((checkpoint) => (
            <div key={checkpoint} style={{ ...styles.checkpoint, opacity: progress >= checkpoint ? 1 : 0.4 }}>
              {checkpoint}%
            </div>
          ))}
        </div>

        <div style={styles.bar}>
          <div style={{ ...styles.fill, width: `${progress}%` }} />
        </div>

        <p style={styles.status}>{status}</p>
        <button style={styles.button} onClick={attempt}>Attempt Obby</button>
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
    width: "min(960px, 100%)",
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
  button: {
    border: "none",
    borderRadius: 999,
    padding: "12px 16px",
    background: "linear-gradient(90deg, #f5b1ff, #73e0ff)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
  },
};
