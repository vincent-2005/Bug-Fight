"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

const palette = ["#ef476f", "#f78c6b", "#ffd166", "#a7c957", "#48cae4", "#5e60ce", "#b565d9", "#e76f9a"];
type Difficulty = "easy" | "medium" | "hard";
const levels: Record<Difficulty, { label: string; tiles: number; matches: number; time: number; goal: number; shades: number[] }> = {
  easy: { label: "Easy", tiles: 9, matches: 3, time: 20, goal: 6, shades: [-68, -48, -30, 29, 47, 66] },
  medium: { label: "Medium", tiles: 16, matches: 1, time: 14, goal: 10, shades: [-33, -22, -13, 12, 21, 32] },
  hard: { label: "Hard", tiles: 16, matches: 1, time: 11, goal: 12, shades: [-18, -11, -6, 6, 11, 18] },
};
const difficultyOrder: Difficulty[] = ["easy", "medium", "hard"];

function shade(hex: string, amount: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function createBoard(target: string, level: (typeof levels)[Difficulty]) {
  const targetIndexes = new Set<number>();
  while (targetIndexes.size < level.matches) targetIndexes.add(Math.floor(Math.random() * level.tiles));
  return Array.from({ length: level.tiles }, (_, index) => {
    if (targetIndexes.has(index)) return target;
    const amount = level.shades[Math.floor(Math.random() * level.shades.length)];
    return shade(target, amount);
  });
}

export default function ColorMatchPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [targetColor, setTargetColor] = useState(palette[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<string[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levels.easy.time);
  const [gameActive, setGameActive] = useState(false);
  const [result, setResult] = useState<"time" | "perfect" | null>(null);
  const [lastReward, setLastReward] = useState(0);
  const [status, setStatus] = useState("Start the timer and smash the matching tiles.");
  const level = levels[difficulty];
  const difficultyRef = useRef<Difficulty>("easy");
  const levelRef = useRef(levels.easy);

  useEffect(() => { difficultyRef.current = difficulty; levelRef.current = level; }, [difficulty, level]);

  const startGame = () => {
    const nextDifficulty = difficultyRef.current;
    const nextLevel = levelRef.current;
    const nextTarget = palette[(palette.indexOf(targetColor) + 1) % palette.length];
    setDifficulty(nextDifficulty);
    setTargetColor(nextTarget);
    setBoard(createBoard(nextTarget, nextLevel));
    setHits(0);
    setMisses(0);
    setTimeLeft(nextLevel.time);
    setGameActive(true);
    setResult(null);
    setLastReward(0);
    setStatus(`Find ${nextLevel.matches === 1 ? "the one exact match" : "either exact match"} before time runs out.`);
  };
  const launchLevel = (nextDifficulty: Difficulty) => {
    difficultyRef.current = nextDifficulty;
    levelRef.current = levels[nextDifficulty];
    startGame();
  };
  const nextDifficulty = difficultyOrder[Math.min(difficultyOrder.indexOf(difficulty) + 1, difficultyOrder.length - 1)];
  const previousDifficulty = difficultyOrder[Math.max(difficultyOrder.indexOf(difficulty) - 1, 0)];

  useEffect(() => {
    if (!gameActive) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setGameActive(false);
          const reward = 35 + hits * 8;
          setStatus(`Time is up! You scored ${hits} hits. Reward: $${reward}.`);
          addMoney(reward);
          setLastReward(reward);
          setResult("time");
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
      if (nextHits >= level.goal) {
        const reward = 60 + nextHits * 10 + (difficulty === "hard" ? 50 : difficulty === "medium" ? 25 : 0);
        setGameActive(false);
        setStatus(`Perfect run! You earned $${reward}.`);
        addMoney(reward);
        setLastReward(reward);
        setResult("perfect");
        return;
      }
      const nextTarget = palette[(palette.indexOf(targetColor) + nextHits) % palette.length];
      setTargetColor(nextTarget);
      setBoard(createBoard(nextTarget, level));
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
            <p style={styles.subtitle}>Find either exact shade before time runs out.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{hits}</strong><span>Hits</span></div>
          <div style={styles.statBox}><strong>{misses}</strong><span>Misses</span></div>
          <div style={styles.statBox}><strong>{timeLeft}s</strong><span>Time</span></div>
        </div>

        <div style={styles.levelRow} aria-label="Choose difficulty">
          {(Object.keys(levels) as Difficulty[]).map((option) => (
            <button key={option} style={{ ...styles.levelButton, ...(difficulty === option ? styles.levelButtonActive : {}) }} onClick={() => launchLevel(option)} disabled={gameActive}>
              {levels[option].label}
            </button>
          ))}
          <span style={styles.levelHint}>{level.tiles === 9 ? `3 × 3 · ${level.matches} matches` : `4 × 4 · ${level.matches} match`}</span>
        </div>

        <div style={styles.progressRow}>
          <span>Round progress</span>
          <strong>{Math.min(hits, level.goal)} / {level.goal}</strong>
          <div style={styles.progressTrack}><i style={{ ...styles.progressFill, width: `${Math.min(100, hits / level.goal * 100)}%` }} /></div>
        </div>

        <div style={styles.targetCard}>
          <span style={styles.targetLabel}>Target color</span>
          <div style={{ ...styles.targetSwatch, backgroundColor: targetColor }} />
        </div>

        <div style={{ ...styles.board, gridTemplateColumns: `repeat(${level.tiles === 9 ? 3 : 4}, minmax(0, 1fr))` }}>
          {board.map((color, index) => (
            <button key={`${color}-${index}`} style={{ ...styles.tile, backgroundColor: color }} onClick={() => handleTileClick(index)} />
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start round</button>
          <p style={styles.statusText}>{status}</p>
        </div>
        <p style={styles.wallet}>Wallet: ${playerProgress.money}</p>

        {result && (
          <div style={styles.resultOverlay} role="dialog" aria-modal="true" aria-labelledby="result-title">
            <div style={styles.resultCard}>
              <p style={styles.resultEyebrow}>{result === "perfect" ? "COLOR MATCH COMPLETE" : "ROUND COMPLETE"}</p>
              <h2 id="result-title" style={styles.resultTitle}>{result === "perfect" ? "Perfect Run!" : "Time’s Up"}</h2>
              <p style={styles.resultText}>{result === "perfect" ? "You found every exact match." : `You found ${hits} exact matches.`}</p>
              <p style={styles.resultReward}>+${lastReward}</p>
              <div style={styles.resultActions}>
                <button style={styles.button} onClick={() => launchLevel(difficulty)}>Play again</button>
                <button style={styles.secondaryResultButton} onClick={() => launchLevel(nextDifficulty)}>Proceed to next level</button>
                <button style={styles.secondaryResultButton} onClick={() => launchLevel(previousDifficulty)}>Go down one level</button>
                <Link href="/mini-games" style={styles.arcadeButton}>Return to arcade</Link>
              </div>
            </div>
          </div>
        )}
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
  levelRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  levelButton: {
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.05)",
    color: "#dce8f3",
    fontWeight: 700,
    cursor: "pointer",
  },
  levelButtonActive: {
    borderColor: "#f2bdff",
    background: "rgba(242,189,255,0.18)",
    color: "#fff6ff",
  },
  levelHint: {
    color: "#9eb4c9",
    fontSize: 12,
  },
  progressRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "6px 12px",
    marginBottom: 16,
    color: "#cfdce8",
    fontSize: 12,
  },
  progressTrack: {
    gridColumn: "1 / -1",
    height: 7,
    overflow: "hidden",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
  },
  progressFill: {
    display: "block",
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #f5b1ff, #73e0ff)",
    transition: "width 180ms ease",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
  resultOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10,
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "rgba(4, 7, 14, 0.74)",
    backdropFilter: "blur(7px)",
  },
  resultCard: {
    width: "min(390px, 100%)",
    padding: 30,
    borderRadius: 22,
    textAlign: "center",
    background: "linear-gradient(145deg, #202446, #11172d)",
    border: "1px solid rgba(245,177,255,0.55)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
  },
  resultEyebrow: {
    margin: 0,
    color: "#f2bdff",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.18em",
  },
  resultTitle: {
    margin: "10px 0 8px",
    fontSize: "clamp(2rem, 8vw, 2.8rem)",
  },
  resultText: {
    margin: 0,
    color: "#c9daed",
  },
  resultReward: {
    margin: "18px 0",
    color: "#8fe4a7",
    fontSize: 28,
    fontWeight: 800,
  },
  resultActions: { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  secondaryResultButton: { border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "12px 16px", background: "rgba(255,255,255,0.08)", color: "#f6fbff", fontWeight: 700, cursor: "pointer" },
  arcadeButton: { border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "12px 16px", color: "#f6fbff", textDecoration: "none", fontWeight: 700 },
};
