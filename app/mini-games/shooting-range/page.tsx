"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Target = {
  id: number;
  x: number;
  y: number;
  alive: boolean;
};

const initialTargets = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  x: 12 + (index % 4) * 20,
  y: 16 + Math.floor(index / 4) * 24,
  alive: true,
}));

export default function ShootingRangePage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [targets, setTargets] = useState<Target[]>(initialTargets);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [sessionCash, setSessionCash] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [flash, setFlash] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTargets((current) =>
        current.map((target) => {
          if (!target.alive) return target;
          const driftX = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8);
          const driftY = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8);
          return {
            ...target,
            x: Math.max(8, Math.min(92, target.x + driftX)),
            y: Math.max(8, Math.min(92, target.y + driftY)),
          };
        })
      );
    }, 900);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 120);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (flash <= 0) return;
    const timer = window.setTimeout(() => setFlash((current) => current - 1), 120);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const hitTarget = (id: number) => {
    if (cooldown > 0) return;
    setTargets((current) => current.map((target) => (target.id === id ? { ...target, alive: false } : target)));
    setHits((current) => { const next = current + 1; if (next >= initialTargets.length) setFinished(true); return next; });
    setSessionCash((current) => current + 12);
    setCooldown(4);
    setFlash(3);
    addMoney(12);
  };

  const shootMiss = () => {
    if (cooldown > 0) return;
    setMisses((current) => current + 1);
    setCooldown(3);
    setFlash(1);
  };

  const resetRange = () => {
    setTargets(initialTargets.map((target) => ({ ...target })));
    setHits(0);
    setMisses(0);
    setSessionCash(0);
    setFinished(false);
  };

  const completion = useMemo(() => {
    const remaining = targets.filter((target) => target.alive).length;
    return Math.round((remaining / initialTargets.length) * 100);
  }, [targets]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>TARGET PRACTICE</p>
            <h1 style={styles.title}>Shooting Range</h1>
            <p style={styles.subtitle}>Take aim, hit the moving silhouettes, and turn every shot into cash.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsBar}>
          <div style={styles.statBox}><strong>{hits}</strong><span>Hits</span></div>
          <div style={styles.statBox}><strong>{misses}</strong><span>Misses</span></div>
          <div style={styles.statBox}><strong>${playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{completion}%</strong><span>Completion</span></div>
        </div>

        <div style={styles.rangeFrame} onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-target]")) return;
          shootMiss();
        }}>
          <div style={{ ...styles.crosshair, opacity: cooldown > 0 ? 0.35 : 1 }}>+</div>
          <div style={{ ...styles.rangeBackdrop, boxShadow: flash > 0 ? "inset 0 0 40px rgba(255, 255, 255, 0.25)" : "inset 0 0 40px rgba(0, 0, 0, 0.35)" }} />
          {targets.map((target) => (
            target.alive ? (
              <button
                key={target.id}
                data-target
                style={{
                  ...styles.target,
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  hitTarget(target.id);
                }}
              >
                <span style={styles.targetRing} />
                <span style={styles.targetCenter} />
              </button>
            ) : null
          ))}
        </div>

        <div style={styles.footerBar}>
          <p style={styles.footerText}>Session cash earned: ${sessionCash} · Reload: {cooldown}s</p>
          <button style={styles.resetButton} onClick={resetRange}>Reset Range</button>
        </div>
        {finished && <div style={styles.resultOverlay} role="dialog" aria-modal="true"><div style={styles.resultCard}><p style={styles.resultEyebrow}>RANGE COMPLETE</p><h2 style={styles.resultTitle}>All Targets Down!</h2><p style={styles.resultText}>You earned ${sessionCash} this session.</p><div style={styles.resultActions}><button style={styles.resetButton} onClick={resetRange}>Play again</button><Link href="/mini-games" style={styles.arcadeButton}>Return to arcade</Link></div></div></div>}
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
    background: "radial-gradient(circle at top, #254b6e, #060b12)",
    color: "#f6fbff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(1080px, 100%)",
    padding: 24,
    borderRadius: 24,
    background: "rgba(7, 16, 28, 0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
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
  },
  backLink: {
    color: "#8ee6ff",
    textDecoration: "none",
    fontWeight: 700,
  },
  statsBar: {
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
  rangeFrame: {
    position: "relative",
    height: 420,
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "crosshair",
    background: "linear-gradient(180deg, #0f2740, #06111e)",
    boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.35)",
  },
  rangeBackdrop: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 40%), linear-gradient(180deg, #3d5f7d 0%, #122336 100%)",
  },
  crosshair: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontSize: 54,
    color: "rgba(255,255,255,0.45)",
    pointerEvents: "none",
    zIndex: 2,
  },
  target: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    width: 74,
    height: 74,
    border: "none",
    borderRadius: "50%",
    background: "transparent",
    padding: 0,
    cursor: "crosshair",
    zIndex: 3,
  },
  targetRing: {
    position: "absolute",
    inset: 0,
    border: "6px solid #f6f7ff",
    borderRadius: "50%",
    boxShadow: "0 0 20px rgba(255,255,255,0.35)",
    background: "radial-gradient(circle, rgba(255,255,255,0.2), rgba(255,0,0,0.2))",
  },
  targetCenter: {
    position: "absolute",
    inset: "24px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ff725c, #ffdf6b)",
    boxShadow: "0 0 18px rgba(255,255,255,0.24)",
  },
  footerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    flexWrap: "wrap",
  },
  footerText: {
    margin: 0,
    color: "#9db5ca",
  },
  resetButton: {
    border: "none",
    borderRadius: 999,
    padding: "12px 16px",
    background: "linear-gradient(90deg, #4fe6ff, #46d47b)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
  },
  resultOverlay: { position: "fixed", inset: 0, zIndex: 10, display: "grid", placeItems: "center", padding: 24, background: "rgba(4, 7, 14, 0.74)", backdropFilter: "blur(7px)" },
  resultCard: { width: "min(390px, 100%)", padding: 30, borderRadius: 22, textAlign: "center", background: "linear-gradient(145deg, #173855, #10182b)", border: "1px solid rgba(94,231,255,0.55)", boxShadow: "0 28px 80px rgba(0,0,0,0.55)" },
  resultEyebrow: { margin: 0, color: "#8ee6ff", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em" },
  resultTitle: { margin: "10px 0 8px", fontSize: "clamp(2rem, 8vw, 2.8rem)" },
  resultText: { margin: "0 0 18px", color: "#c9daed" },
  resultActions: { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  arcadeButton: { border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "12px 16px", color: "#f6fbff", textDecoration: "none", fontWeight: 700 },
};
