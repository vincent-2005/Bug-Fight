"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Position = {
  x: number;
  y: number;
};

type MazeLayout = {
  grid: string[];
  start: Position;
  goal: Position;
};

const mazeLayouts: MazeLayout[] = [
  {
    grid: ["########", "#......#", "#.##..##", "#....#.#", "#.#....#", "#......#", "########"],
    start: { x: 1, y: 1 },
    goal: { x: 6, y: 5 },
  },
  {
    grid: ["########", "#..#...#", "#..#.#.#", "#..#...#", "#..###.#", "#......#", "########"],
    start: { x: 1, y: 1 },
    goal: { x: 6, y: 5 },
  },
  {
    grid: ["############", "#..........#", "##########.#", "#..........#", "#.##########", "#..........#", "##########.#", "#..........#", "#.##########", "#..........#", "############"],
    start: { x: 1, y: 1 },
    goal: { x: 10, y: 9 },
  },
  {
    grid: ["##############", "#............#", "#.############", "#............#", "############.#", "#............#", "#.############", "#............#", "############.#", "#............#", "#.############", "#............#", "##############"],
    start: { x: 1, y: 1 },
    goal: { x: 12, y: 11 },
  },
  {
    grid: ["##############", "#............#", "############.#", "#............#", "#.############", "#............#", "############.#", "#............#", "#.############", "#............#", "############.#", "#............#", "##############"],
    start: { x: 1, y: 1 },
    goal: { x: 12, y: 11 },
  },
  {
    grid: ["################", "#..............#", "#.##############", "#..............#", "##############.#", "#..............#", "#.##############", "#..............#", "##############.#", "#..............#", "#.##############", "#..............#", "##############.#", "#..............#", "################"],
    start: { x: 1, y: 1 },
    goal: { x: 14, y: 13 },
  },
];

export default function MazeRunPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [mazeIndex, setMazeIndex] = useState(0);
  const maze = mazeLayouts[mazeIndex % mazeLayouts.length];
  const [playerPosition, setPlayerPosition] = useState<Position>(maze.start);
  const [gameActive, setGameActive] = useState(false);
  const [status, setStatus] = useState("Start the run and reach the green exit.");
  const reward = 28 + Math.min(mazeIndex, 6) * 6;

  useEffect(() => {
    setPlayerPosition(maze.start);
  }, [maze.start]);

  const startGame = () => {
    setPlayerPosition(maze.start);
    setGameActive(true);
    setStatus("Use the arrow keys to navigate the maze.");
  };

  useEffect(() => {
    if (!gameActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      let nextPosition: Position | null = null;

      if (key === "arrowup" || key === "w") nextPosition = { x: playerPosition.x, y: playerPosition.y - 1 };
      if (key === "arrowdown" || key === "s") nextPosition = { x: playerPosition.x, y: playerPosition.y + 1 };
      if (key === "arrowleft" || key === "a") nextPosition = { x: playerPosition.x - 1, y: playerPosition.y };
      if (key === "arrowright" || key === "d") nextPosition = { x: playerPosition.x + 1, y: playerPosition.y };

      if (!nextPosition) return;

      const targetChar = maze.grid[nextPosition.y]?.[nextPosition.x];
      if (targetChar === "#") return;

      setPlayerPosition((current) => {
        const next = nextPosition!;
        if (next.x === maze.goal.x && next.y === maze.goal.y) {
          setGameActive(false);
          addMoney(reward);
          setMazeIndex((currentIndex) => currentIndex + 1);
          setStatus(`You reached the exit and earned $${reward}. The maze changed!`);
          return current;
        }

        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addMoney, gameActive, maze.goal, maze.grid, playerPosition, reward]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Maze Run</h1>
            <p style={styles.subtitle}>Find the exit without touching the walls.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{gameActive ? "Live" : "Ready"}</strong><span>Status</span></div>
          <div style={styles.statBox}><strong>{mazeIndex + 1}</strong><span>Layout</span></div>
        </div>

        <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${maze.grid[0].length}, 1fr)` }}>
          {maze.grid.map((row, rowIndex) =>
            row.split("").map((cell, cellIndex) => {
              const isPlayer = playerPosition.x === cellIndex && playerPosition.y === rowIndex;
              const isGoal = maze.goal.x === cellIndex && maze.goal.y === rowIndex;
              return (
                <div key={`${rowIndex}-${cellIndex}`} style={{ ...styles.tile, ...(cell === "#" ? styles.wallTile : styles.pathTile), ...(isPlayer ? styles.playerTile : {}), ...(isGoal ? styles.goalTile : {}) }}>
                  {isPlayer ? "P" : isGoal ? "E" : ""}
                </div>
              );
            }),
          )}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start run</button>
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
    background: "radial-gradient(circle at top, #2e3a4d, #090d16)",
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
  grid: {
    display: "grid",
    gap: 3,
    width: "min(100%, 520px)",
    margin: "0 auto",
  },
  tile: {
    aspectRatio: "1",
    borderRadius: 6,
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
  },
  wallTile: {
    background: "#1f2937",
  },
  pathTile: {
    background: "#e2e8f0",
    color: "#07111b",
  },
  playerTile: {
    background: "#f59e0b",
    color: "#07111b",
  },
  goalTile: {
    background: "#22c55e",
    color: "#07111b",
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
