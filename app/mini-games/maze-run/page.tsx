"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

function nextChaserStep(grid: string[], from: Position, target: Position): Position {
  const startKey = `${from.x},${from.y}`;
  const targetKey = `${target.x},${target.y}`;
  const queue = [from];
  const previous = new Map<string, Position | null>([[startKey, null]]);
  const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (`${current.x},${current.y}` === targetKey) break;
    directions.forEach((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (grid[next.y]?.[next.x] !== "#" && !previous.has(key)) { previous.set(key, current); queue.push(next); }
    });
  }
  if (!previous.has(targetKey)) return from;
  let step = target;
  let parent = previous.get(`${step.x},${step.y}`);
  while (parent && `${parent.x},${parent.y}` !== startKey) { step = parent; parent = previous.get(`${step.x},${step.y}`); }
  return step;
}

const rawMazeLayouts: MazeLayout[] = [
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
    grid: ["############", "#..........#", "#..######..#", "#..#....#..#", "#..#....#..#", "#..#....#..#", "#..######..#", "#..........#", "#..........#", "#..........#", "############"],
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
  {
    grid: ["##################", "#................#", "################.#", "#................#", "#.################", "#................#", "################.#", "#................#", "#.################", "#................#", "################.#", "#................#", "##################"],
    start: { x: 1, y: 1 },
    goal: { x: 16, y: 11 },
  },
  {
    grid: ["####################", "#..................#", "#.##################", "#..................#", "##################.#", "#..................#", "#.##################", "#..................#", "##################.#", "#..................#", "#.##################", "#..................#", "##################.#", "#..................#", "####################"],
    start: { x: 1, y: 1 },
    goal: { x: 18, y: 13 },
  },
  {
    grid: ["####################", "#..................#", "##################.#", "#..................#", "#.##################", "#..................#", "##################.#", "#..................#", "#.##################", "#..................#", "##################.#", "#..................#", "#.##################", "#..................#", "####################"],
    start: { x: 1, y: 1 },
    goal: { x: 18, y: 13 },
  },
  {
    grid: ["######################", "#....................#", "#.####################", "#....................#", "####################.#", "#....................#", "#.####################", "#....................#", "####################.#", "#....................#", "#.####################", "#....................#", "####################.#", "#....................#", "#.####################", "#....................#", "######################"],
    start: { x: 1, y: 1 },
    goal: { x: 20, y: 15 },
  },
  {
    grid: ["########################", "#......................#", "######################.#", "#......................#", "#.######################", "#......................#", "######################.#", "#......................#", "#.######################", "#......................#", "######################.#", "#......................#", "#.######################", "#......................#", "######################.#", "#......................#", "########################"],
    start: { x: 1, y: 1 },
    goal: { x: 22, y: 15 },
  },
  {
    grid: ["########################", "#......................#", "#.######################", "#......................#", "######################.#", "#......................#", "#.######################", "#......................#", "######################.#", "#......................#", "#.######################", "#......................#", "######################.#", "#......................#", "#.######################", "#......................#", "########################"],
    start: { x: 1, y: 1 },
    goal: { x: 22, y: 15 },
  },
  {
    grid: ["##########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "##########################"],
    start: { x: 1, y: 1 },
    goal: { x: 24, y: 17 },
  },
  {
    grid: ["##########################", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "#.########################", "#........................#", "########################.#", "#........................#", "##########################"],
    start: { x: 1, y: 1 },
    goal: { x: 24, y: 17 },
  },
  {
    grid: ["############################", "#..........................#", "##########################.#", "#..........................#", "#.##########################", "#..........................#", "##########################.#", "#..........................#", "#.##########################", "#..........................#", "##########################.#", "#..........................#", "#.##########################", "#..........................#", "##########################.#", "#..........................#", "#.##########################", "#..........................#", "##########################.#", "#..........................#", "############################"],
    start: { x: 1, y: 1 },
    goal: { x: 26, y: 19 },
  },
];

function createEasyMaze(width: number, height: number, variant: number) {
  const grid = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => x === 0 || y === 0 || x === width - 1 || y === height - 1 ? "#" : "."));
  const centerX = Math.floor(width / 2), centerY = Math.floor(height / 2);
  for (let y = centerY - 1; y <= centerY + 1; y++) for (let x = centerX - 1; x <= centerX + 1; x++) grid[y][x] = "#";
  if (variant % 2 === 0) grid[centerY][centerX - 1] = ".";
  else grid[centerY - 1][centerX] = ".";
  return grid.map((row) => row.join(""));
}

const mazeLayouts: MazeLayout[] = rawMazeLayouts.map((layout, index) => ({
  ...layout,
  grid: createEasyMaze(layout.grid[0].length, layout.grid.length, index),
}));
const mapThemes = ["#38bdf8", "#a78bfa", "#fb7185", "#facc15", "#34d399", "#f97316"];

export default function MazeRunPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [mazeIndex, setMazeIndex] = useState(0);
  const maze = mazeLayouts[mazeIndex % mazeLayouts.length];
  const mapTheme = mapThemes[mazeIndex % mapThemes.length];
  const [playerPosition, setPlayerPosition] = useState<Position>(maze.start);
  const [copPosition, setCopPosition] = useState<Position>(maze.goal);
  const [gameActive, setGameActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [caught, setCaught] = useState(false);
  const [status, setStatus] = useState("Start the run and reach the green exit.");
  const playerMoveCount = useRef(0);
  const reward = 28 + Math.min(mazeIndex, mazeLayouts.length - 1) * 6;

  const startGame = () => {
    setPlayerPosition(maze.start);
    setCopPosition(maze.goal);
    setGameActive(true);
    setFinished(false);
    setCaught(false);
    playerMoveCount.current = 0;
    setStatus("Reach the exit before the cop catches you. The cop moves every second turn.");
  };
  const nextLevel = () => {
    const nextIndex = (mazeIndex + 1) % mazeLayouts.length;
    setMazeIndex(nextIndex);
    setPlayerPosition(mazeLayouts[nextIndex].start);
    setCopPosition(mazeLayouts[nextIndex].goal);
    setFinished(false);
    setCaught(false);
    playerMoveCount.current = 0;
    setGameActive(true);
    setStatus(`Maze ${nextIndex + 1} of ${mazeLayouts.length}: escape the cop.`);
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

      const next = nextPosition;
      setPlayerPosition(next);
      if (next.x === maze.goal.x && next.y === maze.goal.y) {
        setGameActive(false);
        addMoney(reward);
        setStatus(`You reached the exit and earned $${reward}.`);
        setFinished(true);
        return;
      }
      playerMoveCount.current += 1;
      const nextCop = playerMoveCount.current % 2 === 0 ? nextChaserStep(maze.grid, copPosition, next) : copPosition;
      if (playerMoveCount.current % 2 === 0) setCopPosition(nextCop);
      if (nextCop.x === next.x && nextCop.y === next.y && playerMoveCount.current % 2 === 0) {
        setGameActive(false);
        setCaught(true);
        setStatus("The cop caught you. Try again.");
        setFinished(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addMoney, copPosition, gameActive, maze.goal, maze.grid, playerPosition, reward]);

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
          <div style={styles.statBox}><strong>{mazeIndex + 1} / {mazeLayouts.length}</strong><span>Map</span></div>
        </div>

        <div style={{ ...styles.mapBanner, borderColor: mapTheme }}>
          <span>MAP {mazeIndex + 1} / {mazeLayouts.length}</span>
          <b style={{ color: mapTheme }}>COP PURSUIT</b>
        </div>
        <div key={mazeIndex} style={{ ...styles.grid, gridTemplateColumns: `repeat(${maze.grid[0].length}, 1fr)`, borderColor: mapTheme }}>
          {maze.grid.map((row, rowIndex) =>
            row.split("").map((cell, cellIndex) => {
              const isPlayer = playerPosition.x === cellIndex && playerPosition.y === rowIndex;
              const isCop = copPosition.x === cellIndex && copPosition.y === rowIndex;
              const isGoal = maze.goal.x === cellIndex && maze.goal.y === rowIndex;
              return (
                <div key={`${rowIndex}-${cellIndex}`} style={{ ...styles.tile, ...(cell === "#" ? styles.wallTile : styles.pathTile), ...(isGoal ? styles.goalTile : {}), ...(isCop ? styles.copTile : {}), ...(isPlayer ? styles.playerTile : {}) }}>
                  {isPlayer ? "P" : isCop ? "🚓" : isGoal ? "E" : ""}
                </div>
              );
            }),
          )}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start run</button>
          <p style={styles.status}>{status}</p>
        </div>
        {finished && <div style={styles.resultOverlay} role="dialog" aria-modal="true"><div style={styles.resultCard}><p style={styles.resultEyebrow}>{caught ? "RUN ENDED" : "MAZE COMPLETE"}</p><h2 style={styles.resultTitle}>{caught ? "Caught!" : "Exit Reached!"}</h2><p style={styles.resultText}>{caught ? "The cop caught up to you." : `You earned $${reward}.`}</p><div style={styles.resultActions}><button style={styles.button} onClick={startGame}>Play again</button>{!caught && <button style={styles.nextButton} onClick={nextLevel}>Next level</button>}<Link href="/mini-games" style={styles.arcadeButton}>Return to arcade</Link></div></div></div>}
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
    padding: 5,
    border: "2px solid",
    borderRadius: 12,
    background: "#0b1220",
  },
  mapBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    width: "min(100%, 520px)",
    margin: "0 auto 10px",
    padding: "9px 12px",
    borderLeft: "4px solid",
    borderRadius: 8,
    background: "rgba(255,255,255,0.05)",
    color: "#c9daed",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
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
  copTile: {
    background: "#2563eb",
    color: "#fff",
    fontSize: "clamp(9px, 2vw, 16px)",
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
  resultOverlay: { position: "fixed", inset: 0, zIndex: 10, display: "grid", placeItems: "center", padding: 24, background: "rgba(4, 7, 14, 0.74)", backdropFilter: "blur(7px)" },
  resultCard: { width: "min(390px, 100%)", padding: 30, borderRadius: 22, textAlign: "center", background: "linear-gradient(145deg, #2e3a4d, #10182b)", border: "1px solid rgba(94,231,255,0.55)", boxShadow: "0 28px 80px rgba(0,0,0,0.55)" },
  resultEyebrow: { margin: 0, color: "#8ee6ff", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em" },
  resultTitle: { margin: "10px 0 8px", fontSize: "clamp(2rem, 8vw, 2.8rem)" },
  resultText: { margin: "0 0 18px", color: "#c9daed" },
  resultActions: { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  nextButton: { border: "1px solid rgba(94,231,255,0.55)", borderRadius: 999, padding: "12px 16px", background: "rgba(94,231,255,0.12)", color: "#e2fbff", fontWeight: 700, cursor: "pointer" },
  arcadeButton: { border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "12px 16px", color: "#f6fbff", textDecoration: "none", fontWeight: 700 },
};
