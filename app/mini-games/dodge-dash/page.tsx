"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Block = {
  id: number;
  x: number;
  y: number;
};

const PLAYFIELD_WIDTH = 360;
const PLAYFIELD_HEIGHT = 320;
const PLAYER_WIDTH = 36;
const BLOCK_SIZE = 28;
type Difficulty = "easy" | "medium" | "hard";
const levels: Record<Difficulty, { label: string; time: number; speed: number; spawnChance: number; reward: number }> = {
  easy: { label: "Easy", time: 12, speed: 8, spawnChance: .18, reward: 35 },
  medium: { label: "Medium", time: 15, speed: 11, spawnChance: .28, reward: 50 },
  hard: { label: "Hard", time: 18, speed: 15, spawnChance: .38, reward: 75 },
};

export default function DodgeDashPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [playerX, setPlayerX] = useState(162);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [timeLeft, setTimeLeft] = useState(levels.easy.time);
  const [gameActive, setGameActive] = useState(false);
  const [status, setStatus] = useState("Start the run and survive the falling danger.");
  const playerXRef = useRef(playerX);
  const level = levels[difficulty];

  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);

  const startGame = () => {
    setPlayerX(162);
    setBlocks([]);
    setTimeLeft(level.time);
    setGameActive(true);
    setStatus("Move left and right to dodge the blocks.");
  };

  useEffect(() => {
    if (!gameActive) return;

    const keyHandler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        setPlayerX((current) => Math.max(12, current - 24));
      }
      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        setPlayerX((current) => Math.min(PLAYFIELD_WIDTH - PLAYER_WIDTH - 12, current + 24));
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setGameActive(false);
          setStatus(`You survived ${level.label} and earned $${level.reward}.`);
          addMoney(level.reward);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [addMoney, gameActive, level.label, level.reward]);

  useEffect(() => {
    if (!gameActive) return;

    const gameLoop = window.setInterval(() => {
      setBlocks((currentBlocks) => {
        const nextBlocks = currentBlocks.map((block) => ({ ...block, y: block.y + level.speed }));
        if (Math.random() < level.spawnChance) {
          nextBlocks.push({ id: Date.now() + Math.random(), x: 24 + Math.floor(Math.random() * (PLAYFIELD_WIDTH - 48)), y: -24 });
        }

        const playerCenterX = playerXRef.current + PLAYER_WIDTH / 2;
        const hit = nextBlocks.some((block) => {
          const blockCenterX = block.x + BLOCK_SIZE / 2;
          const blockBottom = block.y + BLOCK_SIZE;
          return blockBottom >= PLAYFIELD_HEIGHT - 44 && Math.abs(blockCenterX - playerCenterX) < 26;
        });

        if (hit) {
          window.clearInterval(gameLoop);
          setGameActive(false);
          setStatus("A block clipped you. Try again.");
          return [];
        }

        return nextBlocks.filter((block) => block.y < PLAYFIELD_HEIGHT);
      });
    }, 90);

    return () => window.clearInterval(gameLoop);
  }, [gameActive, level]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Dodge Dash</h1>
            <p style={styles.subtitle}>Avoid the falling blocks for 15 seconds and prove you can stay calm under pressure.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{timeLeft}s</strong><span>Time</span></div>
          <div style={styles.statBox}><strong>${playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{gameActive ? "Live" : "Ready"}</strong><span>Status</span></div>
        </div>

        <div style={styles.levelRow} aria-label="Choose difficulty">
          {(Object.keys(levels) as Difficulty[]).map((option) => (
            <button key={option} style={{ ...styles.levelButton, ...(difficulty === option ? styles.levelButtonActive : {}) }} onClick={() => !gameActive && setDifficulty(option)} disabled={gameActive}>
              {levels[option].label}
            </button>
          ))}
          <span style={styles.levelHint}>{level.time}s · ${level.reward} reward</span>
        </div>

        <div style={styles.playfield}>
          <div style={{ ...styles.player, left: playerX }} />
          {blocks.map((block) => (
            <div key={block.id} style={{ ...styles.block, left: block.x, top: block.y }} />
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start run</button>
          <p style={styles.statusText}>{status}</p>
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
    background: "radial-gradient(circle at top, #2d1b4e, #060913)",
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
  playfield: {
    position: "relative",
    width: PLAYFIELD_WIDTH,
    maxWidth: "100%",
    height: 320,
    margin: "0 auto",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "linear-gradient(180deg, #133959 0%, #09131d 100%)",
    overflow: "hidden",
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
  player: {
    position: "absolute",
    bottom: 26,
    width: 36,
    height: 26,
    borderRadius: 8,
    background: "linear-gradient(135deg, #fef3c7, #f59e0b)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.28)",
  },
  block: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "linear-gradient(135deg, #fb7185, #be123c)",
    boxShadow: "0 8px 20px rgba(190, 18, 60, 0.3)",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 16,
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
};
