"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Coin = {
  id: number;
  x: number;
  y: number;
};

type PlayerPosition = {
  x: number;
  y: number;
};

const PLAYFIELD_WIDTH = 360;
const PLAYFIELD_HEIGHT = 320;
const PLAYER_SIZE = 24;
const COIN_SIZE = 18;
const MOVE_AMOUNT = 18;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeCoin(existingCoins: Coin[] = [], playerPosition: PlayerPosition) {
  let candidate: Coin;
  do {
    candidate = {
      id: Date.now() + Math.random(),
      x: 28 + Math.floor(Math.random() * (PLAYFIELD_WIDTH - 56)),
      y: 28 + Math.floor(Math.random() * (PLAYFIELD_HEIGHT - 56)),
    };
  } while (
    existingCoins.some((coin) => Math.abs(coin.x - candidate.x) < 36 && Math.abs(coin.y - candidate.y) < 36) ||
    Math.abs(candidate.x - playerPosition.x) < 30 && Math.abs(candidate.y - playerPosition.y) < 30
  );

  return candidate;
}

export default function CoinCollectorPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [player, setPlayer] = useState<PlayerPosition>({ x: 168, y: 148 });
  const [coins, setCoins] = useState<Coin[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [status, setStatus] = useState("Start the round to collect 8 coins.");

  const startGame = () => {
    const startPosition = { x: 168, y: 148 };
    setPlayer(startPosition);
    setCoins(Array.from({ length: 8 }, () => makeCoin([], startPosition)));
    setScore(0);
    setGameActive(true);
    setStatus("Collect 8 coins without leaving the arena.");
  };

  useEffect(() => {
    if (!gameActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const movementKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (movementKeys.includes(key)) {
        event.preventDefault();
      }

      setPlayer((current) => {
        const next = {
          x: clamp(current.x + (key === "arrowright" || key === "d" ? MOVE_AMOUNT : key === "arrowleft" || key === "a" ? -MOVE_AMOUNT : 0), 20, PLAYFIELD_WIDTH - PLAYER_SIZE - 20),
          y: clamp(current.y + (key === "arrowdown" || key === "s" ? MOVE_AMOUNT : key === "arrowup" || key === "w" ? -MOVE_AMOUNT : 0), 20, PLAYFIELD_HEIGHT - PLAYER_SIZE - 20),
        };

        setCoins((currentCoins) => {
          const hit = currentCoins.find((coin) => Math.abs(next.x + PLAYER_SIZE / 2 - coin.x - COIN_SIZE / 2) < 20 && Math.abs(next.y + PLAYER_SIZE / 2 - coin.y - COIN_SIZE / 2) < 20);
          if (!hit) return currentCoins;

          const remaining = currentCoins.filter((coin) => coin.id !== hit.id);
          const nextScore = score + 1;
          setScore(nextScore);

          if (nextScore >= 8) {
            setGameActive(false);
            setStatus("You cleared the coin run and earned cash.");
            addMoney(35);
            return [];
          }

          return [...remaining, makeCoin(remaining, next)];
        });

        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addMoney, gameActive, score]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Coin Collector</h1>
            <p style={styles.subtitle}>Race around the arena, grab glowing coins, and collect enough to cash out.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{score}/8</strong><span>Coins</span></div>
          <div style={styles.statBox}><strong>${playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{gameActive ? "Live" : "Ready"}</strong><span>Status</span></div>
        </div>

        <div style={styles.playfield}>
          <div style={{ ...styles.player, left: player.x, top: player.y }} />
          {coins.map((coin) => (
            <div key={coin.id} style={{ ...styles.coin, left: coin.x, top: coin.y }} />
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start round</button>
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
    background: "radial-gradient(circle at top, #1d3c52, #071018)",
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
    maxWidth: 620,
  },
  backLink: {
    color: "#8ee6ff",
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
    width: "100%",
    height: 320,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "linear-gradient(180deg, #12334b 0%, #09131d 100%)",
    overflow: "hidden",
  },
  player: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fde68a, #f59e0b)",
    border: "3px solid #fff",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.28)",
    transition: "left 0.12s ease, top 0.12s ease",
  },
  coin: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "radial-gradient(circle, #fff8b5 0%, #facc15 55%, #c2410c 100%)",
    boxShadow: "0 0 16px rgba(250, 204, 21, 0.6)",
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
    background: "linear-gradient(90deg, #5ee7ff, #22c55e)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
  },
  statusText: {
    color: "#c9daed",
    margin: 0,
  },
};
