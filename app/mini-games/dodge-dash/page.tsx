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
  const [result, setResult] = useState<"survived" | "hit" | null>(null);
  const [lastReward, setLastReward] = useState(0);
  const [status, setStatus] = useState("Start the run and survive the falling danger.");
  const playerXRef = useRef(playerX);
  const deadlineRef = useRef(0);
  const endedRef = useRef(false);
  const levelRef = useRef(levels.easy);
  const addMoneyRef = useRef(addMoney);
  const level = levels[difficulty];

  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { addMoneyRef.current = addMoney; }, [addMoney]);

  const startGame = () => {
    const nextLevel = levelRef.current;
    setPlayerX(162);
    setBlocks([]);
    setTimeLeft(nextLevel.time);
    deadlineRef.current = Date.now() + nextLevel.time * 1000;
    endedRef.current = false;
    setGameActive(true);
    setResult(null);
    setLastReward(0);
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
      if (endedRef.current) return;
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        const completedLevel = levelRef.current;
        endedRef.current = true;
        setGameActive(false);
        setStatus(`You survived ${completedLevel.label} and earned $${completedLevel.reward}.`);
        addMoneyRef.current(completedLevel.reward);
        setLastReward(completedLevel.reward);
        setResult("survived");
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [gameActive]);

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
          endedRef.current = true;
          setGameActive(false);
          setStatus("A block clipped you. Try again.");
          setLastReward(0);
          setResult("hit");
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
            <button key={option} style={{ ...styles.levelButton, ...(difficulty === option ? styles.levelButtonActive : {}) }} onClick={() => { levelRef.current = levels[option]; setDifficulty(option); startGame(); }} disabled={gameActive}>
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

        {result && (
          <div style={styles.resultOverlay} role="dialog" aria-modal="true" aria-labelledby="dodge-result-title">
            <div style={styles.resultCard}>
              <p style={styles.resultEyebrow}>DODGE DASH COMPLETE</p>
              <h2 id="dodge-result-title" style={styles.resultTitle}>{result === "survived" ? "Run Complete!" : "Run Ended"}</h2>
              <p style={styles.resultText}>{result === "survived" ? "You survived the block storm." : "A falling block caught you."}</p>
              <p style={styles.resultReward}>+${lastReward}</p>
              <div style={styles.resultActions}>
                <button style={styles.button} onClick={startGame}>Play again</button>
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
    background: "linear-gradient(145deg, #2d1b4e, #11172d)",
    border: "1px solid rgba(245,177,255,0.55)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
  },
  resultEyebrow: { margin: 0, color: "#f2bdff", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em" },
  resultTitle: { margin: "10px 0 8px", fontSize: "clamp(2rem, 8vw, 2.8rem)" },
  resultText: { margin: 0, color: "#c9daed" },
  resultReward: { margin: "18px 0", color: "#8fe4a7", fontSize: 28, fontWeight: 800 },
  resultActions: { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  arcadeButton: { border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "12px 16px", color: "#f6fbff", textDecoration: "none", fontWeight: 700 },
};
