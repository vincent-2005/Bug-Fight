"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

const TOTAL_BUBBLES = 16;

export default function BubbleBurstPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [bubbles, setBubbles] = useState<number[]>(Array.from({ length: TOTAL_BUBBLES }, (_, index) => index));
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [gameActive, setGameActive] = useState(false);
  const [status, setStatus] = useState("Pop the bubbles before the timer expires.");

  const startGame = () => {
    setBubbles(Array.from({ length: TOTAL_BUBBLES }, (_, index) => index));
    setHits(0);
    setTimeLeft(12);
    setGameActive(true);
    setStatus("Burst as many bubbles as you can.");
  };

  useEffect(() => {
    if (!gameActive) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setGameActive(false);
          const reward = hits >= 8 ? 30 : 0;
          if (reward > 0) addMoney(reward);
          setStatus(reward > 0 ? `You popped ${hits} bubbles and earned $30.` : `You popped ${hits} bubbles. Try again.`);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [addMoney, gameActive, hits]);

  const popBubble = (index: number) => {
    if (!gameActive) return;
    setBubbles((current) => current.filter((bubble) => bubble !== index));
    const nextHits = hits + 1;
    setHits(nextHits);
    if (nextHits >= TOTAL_BUBBLES) {
      setGameActive(false);
      addMoney(35);
      setStatus("You burst every bubble and earned $35.");
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Bubble Burst</h1>
            <p style={styles.subtitle}>Tap the floating bubbles before they vanish.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{hits}</strong><span>Hits</span></div>
          <div style={styles.statBox}><strong>{timeLeft}s</strong><span>Timer</span></div>
        </div>

        <div style={styles.board}>
          {bubbles.map((bubble) => (
            <button key={bubble} style={styles.bubble} onClick={() => popBubble(bubble)}>
              {bubble + 1}
            </button>
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start round</button>
          <p style={styles.status}>{status}</p>
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
    background: "radial-gradient(circle at top, #3b3060, #080d16)",
    color: "#f6fbff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(900px, 100%)",
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
    maxWidth: 620,
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
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
  },
  bubble: {
    aspectRatio: "1",
    borderRadius: "50%",
    border: "none",
    background: "radial-gradient(circle, #ffe7b3 0%, #f59e0b 100%)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(245, 158, 11, 0.25)",
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 16,
  },
  button: {
    border: "none",
    borderRadius: 999,
    padding: "12px 16px",
    background: "linear-gradient(90deg, #5ee7ff, #22c55e)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
  },
  status: {
    margin: 0,
    color: "#c9daed",
  },
};
