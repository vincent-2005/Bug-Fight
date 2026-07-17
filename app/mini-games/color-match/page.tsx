"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

const palette = ["#ef476f", "#f78c6b", "#ffd166", "#a7c957", "#48cae4", "#5e60ce", "#b565d9", "#e76f9a"];

function shade(hex: string, amount: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function createBoard(target: string) {
  const targetIndex = Math.floor(Math.random() * 16);
  return Array.from({ length: 16 }, (_, index) => {
    if (index === targetIndex) return target;
    const amount = [-34, -22, -13, 12, 21, 32][Math.floor(Math.random() * 6)];
    return shade(target, amount);
  });
}

export default function ColorMatchPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [targetColor, setTargetColor] = useState(palette[0]);
  const [board, setBoard] = useState<string[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [gameActive, setGameActive] = useState(false);
  const [status, setStatus] = useState("Start the timer and smash the matching tiles.");

  const startGame = () => {
    const nextTarget = palette[Math.floor(Math.random() * palette.length)];
    setTargetColor(nextTarget);
    setBoard(createBoard(nextTarget));
    setHits(0);
    setMisses(0);
    setTimeLeft(12);
    setGameActive(true);
    setStatus("Find the one exact shade. The other tiles are close, but not a match.");
  };

  useEffect(() => {
    if (!gameActive) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setGameActive(false);
          const reward = 18 + hits * 4;
          setStatus(`Time is up! You scored ${hits} hits. Reward: $${reward}.`);
          addMoney(reward);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [addMoney, gameActive, hits]);

  const handleTileClick = (index: number) => {
    if (!gameActive) return;

    if (board[index] === targetColor) {
      const nextHits = hits + 1;
      setHits(nextHits);
      if (nextHits >= 10) {
        const reward = 25 + nextHits * 3;
        setGameActive(false);
        setStatus(`Perfect run! You earned $${reward}.`);
        addMoney(reward);
        return;
      }
      const nextTarget = palette[(palette.indexOf(targetColor) + nextHits) % palette.length];
      setTargetColor(nextTarget);
      setBoard(createBoard(nextTarget));
      setStatus("Nice hit! Another color is up.");
    } else {
      setMisses((current) => current + 1);
      setStatus("That was the wrong tile.");
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Color Match</h1>
            <p style={styles.subtitle}>Find the one exact shade among near-identical tiles before time runs out.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{hits}</strong><span>Hits</span></div>
          <div style={styles.statBox}><strong>{misses}</strong><span>Misses</span></div>
          <div style={styles.statBox}><strong>{timeLeft}s</strong><span>Time</span></div>
        </div>

        <div style={styles.targetCard}>
          <span style={styles.targetLabel}>Target color</span>
          <div style={{ ...styles.targetSwatch, backgroundColor: targetColor }} />
        </div>

        <div style={styles.board}>
          {board.map((color, index) => (
            <button key={`${color}-${index}`} style={{ ...styles.tile, backgroundColor: color }} onClick={() => handleTileClick(index)} />
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start round</button>
          <p style={styles.statusText}>{status}</p>
        </div>
        <p style={styles.wallet}>Wallet: ${playerProgress.money}</p>
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
    background: "radial-gradient(circle at top, #31223f, #080b13)",
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
  targetCard: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  targetLabel: {
    color: "#cfdce8",
  },
  targetSwatch: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid #fff",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 16,
  },
  tile: {
    border: "none",
    aspectRatio: "1 / 1",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)",
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
  statusText: {
    color: "#c9daed",
    margin: 0,
  },
  wallet: {
    marginTop: 10,
    color: "#8fe4a7",
    fontWeight: 700,
  },
};
