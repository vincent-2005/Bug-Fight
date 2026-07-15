"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

type Hazard = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const checkpoints = [20, 40, 60, 80, 100];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildCourse(level: number) {
  const platformCount = Math.min(7, 4 + Math.floor((level - 1) / 2));
  const width = Math.max(12, 20 - level * 1.2);
  const yPattern = [76, 60, 76, 44, 76, 58, 76];

  const platforms: Platform[] = Array.from({ length: platformCount }, (_, index) => {
    const x = 8 + (index / Math.max(1, platformCount - 1)) * 72;
    const y = yPattern[index] - Math.min(10, Math.floor(level / 2) * 3);

    return {
      x,
      y,
      width,
      height: 8,
      label: index === 0 ? "Start" : index === platformCount - 1 ? "Finish" : `Step ${index}`,
    };
  });

  const hazards: Hazard[] = Array.from({ length: Math.max(0, level - 1) }, (_, index) => ({
    x: 20 + index * 12,
    y: 64 - index * 6,
    width: 8,
    height: 8,
  }));

  return { platforms, hazards };
}

export default function ObbyPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState(0);
  const [wins, setWins] = useState(0);
  const [runActive, setRunActive] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 8, y: 76 });
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [message, setMessage] = useState("Start a run and use A/W/D to move.");

  const difficultyLevel = Math.max(1, playerProgress.weaponLevel + playerProgress.armorLevel - 1);
  const course = useMemo(() => buildCourse(difficultyLevel), [difficultyLevel]);
  const moveStep = 6 + Math.min(3, difficultyLevel / 2);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase() ?? "";
      const code = event.code ?? "";

      if (key === "s" || code === "KeyS") {
        event.preventDefault();
        setRunActive(true);
        setProgress(0);
        setReward(0);
        setCurrentPlatformIndex(0);
        setPlayerPosition({ x: course.platforms[0].x, y: course.platforms[0].y });
        setMessage("Run restarted. Use A to move left, W to jump, and D to move forward.");
        return;
      }

      const movementMap: Record<string, { x: number; y: number }> = {
        w: { x: 0, y: -moveStep },
        a: { x: -moveStep, y: 0 },
        d: { x: moveStep, y: 0 },
      };

      const delta = movementMap[key] ?? movementMap[code.toLowerCase().replace("key", "")];
      if (!delta || event.repeat) return;

      event.preventDefault();
      setRunActive(true);

      setPlayerPosition((current) => {
        const nextPosition = {
          x: clamp(current.x + delta.x, 4, 96),
          y: clamp(current.y + delta.y, 10, 90),
        };

        const snappedPlatform = course.platforms.findIndex((platform) => {
          const withinX = Math.abs(nextPosition.x - platform.x) <= 12;
          const withinY = Math.abs(nextPosition.y - platform.y) <= 10;
          return withinX && withinY;
        });

        const hazardHit = course.hazards.some((hazard) => {
          const withinX = nextPosition.x >= hazard.x && nextPosition.x <= hazard.x + hazard.width;
          const withinY = nextPosition.y >= hazard.y && nextPosition.y <= hazard.y + hazard.height;
          return withinX && withinY;
        });

        if (hazardHit) {
          setRunActive(false);
          setMessage("You hit a hazard and fell into the void.");
          return current;
        }

        if (snappedPlatform === -1) {
          const nextProgress = Math.round(((currentPlatformIndex + 1) / Math.max(1, course.platforms.length - 1)) * 100);
          setProgress(nextProgress);
          setCurrentPlatformIndex(Math.max(0, currentPlatformIndex));
          return nextPosition;
        }

        const nextProgress = Math.round(((snappedPlatform + 1) / Math.max(1, course.platforms.length - 1)) * 100);
        setProgress(nextProgress);
        setCurrentPlatformIndex(snappedPlatform);

        if (snappedPlatform === course.platforms.length - 1) {
          const bonus = 80 + difficultyLevel * 8 + Math.floor(Math.random() * 20);
          setReward(bonus);
          setWins((value) => value + 1);
          setMessage("Finish line reached!");
          addMoney(bonus);
          setRunActive(false);
          return { x: course.platforms[snappedPlatform].x, y: course.platforms[snappedPlatform].y };
        }

        return { x: course.platforms[snappedPlatform].x, y: course.platforms[snappedPlatform].y };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addMoney, course.hazards, course.platforms, currentPlatformIndex, difficultyLevel, moveStep]);

  const attempt = () => {
    setRunActive(true);
    setProgress(0);
    setReward(0);
    setCurrentPlatformIndex(0);
    setPlayerPosition({ x: course.platforms[0].x, y: course.platforms[0].y });
    setMessage(`Level ${difficultyLevel} run — A moves left, W jumps, D moves forward, and S restarts.`);
  };

  const status = useMemo(() => {
    if (runActive) return "A = left, W = jump, D = forward, S = restart";
    if (progress >= 100) return "Perfect run";
    if (progress >= 70) return "Cleared";
    if (progress >= 40) return "Almost there";
    return message;
  }, [message, progress, runActive]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>OBBY RUN</p>
            <h1 style={styles.title}>Obstacle Course</h1>
            <p style={styles.subtitle}>Climb higher as your gear level rises. Narrower platforms and extra hazards make harder runs tougher.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{progress}%</strong><span>Progress</span></div>
          <div style={styles.statBox}><strong>${playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{wins}</strong><span>Wins</span></div>
        </div>

        <div style={styles.courseArena}>
          <div style={styles.skyGlow} />
          <div style={styles.void} />
          {course.platforms.map((platform, index) => (
            <div
              key={`${platform.x}-${platform.y}`}
              style={{
                ...styles.platform,
                left: `${platform.x}%`,
                top: `${platform.y}%`,
                width: `${platform.width}%`,
                height: `${platform.height}%`,
                opacity: index <= currentPlatformIndex ? 1 : 0.62,
              }}
            >
              {platform.label}
            </div>
          ))}
          {course.hazards.map((hazard, index) => (
            <div key={`hazard-${index}`} style={{ ...styles.hazard, left: `${hazard.x}%`, top: `${hazard.y}%`, width: `${hazard.width}%`, height: `${hazard.height}%` }} />
          ))}
          {course.platforms.map((platform, index) => (
            <div key={`flag-${index}`} style={{ ...styles.flag, left: `calc(${platform.x}% + 4%)`, top: `calc(${platform.y}% - 12%)` }}>
              <div style={styles.flagPole} />
              <div style={styles.flagBanner} />
            </div>
          ))}
          <div
            style={{
              ...styles.player,
              left: `${playerPosition.x}%`,
              top: `${playerPosition.y}%`,
              transform: runActive ? "translate(-50%, -50%) scale(1.05)" : "translate(-50%, -50%)",
            }}
          >
            <span style={styles.playerEye} />
          </div>
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
        <div style={styles.actions}>
          <button style={styles.button} onClick={attempt}>Start Obby</button>
          <span style={styles.helper}>A moves left, W jumps, D moves forward, and S restarts. Higher gear levels shrink the platforms and add more hazards.</span>
        </div>
        {reward > 0 ? <p style={styles.reward}>Reward earned: ${reward}</p> : null}
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
    width: "min(980px, 100%)",
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
  courseArena: {
    position: "relative",
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    background: "linear-gradient(180deg, #17344f 0%, #0c1b28 100%)",
    border: "1px solid rgba(255,255,255,0.16)",
    marginBottom: 16,
  },
  skyGlow: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at top, rgba(114, 224, 255, 0.3), transparent 56%)",
    pointerEvents: "none",
  },
  void: {
    position: "absolute",
    inset: "0 0 0 0",
    background: "linear-gradient(180deg, rgba(2, 8, 14, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%)",
    clipPath: "polygon(0 100%, 0 60%, 100% 60%, 100% 100%)",
  },
  platform: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    padding: "10px 14px",
    borderRadius: 999,
    background: "linear-gradient(90deg, #7c3aed, #2dd4bf)",
    color: "#041018",
    fontWeight: 800,
    boxShadow: "0 8px 22px rgba(0, 0, 0, 0.25)",
    textAlign: "center",
    display: "grid",
    placeItems: "center",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  },
  hazard: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    borderRadius: 10,
    background: "linear-gradient(135deg, #fb7185, #be123c)",
    boxShadow: "0 8px 20px rgba(190, 18, 60, 0.3)",
  },
  flag: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    width: 20,
    height: 60,
    pointerEvents: "none",
  },
  flagPole: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 3,
    height: 60,
    background: "#f2f6ff",
    transform: "translateX(-50%)",
  },
  flagBanner: {
    position: "absolute",
    left: 6,
    top: 8,
    width: 26,
    height: 16,
    background: "linear-gradient(90deg, #ff7f50, #ffd166)",
    borderRadius: 4,
    transform: "rotate(-6deg)",
  },
  player: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fef08a, #f97316)",
    border: "3px solid #fff",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.32)",
    transition: "left 0.45s ease, top 0.45s ease, transform 0.45s ease",
  },
  playerEye: {
    position: "absolute",
    top: 8,
    left: 10,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#0f172a",
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
  helper: {
    color: "#9eb4c9",
    fontSize: 14,
  },
  reward: {
    marginTop: 10,
    color: "#7ef0aa",
    fontWeight: 700,
  },
};
