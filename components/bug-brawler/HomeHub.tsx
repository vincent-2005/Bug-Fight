"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePlayerProgress } from "./progress";

type LeaderboardEntry = {
  name: string;
  score: number;
  rank: number;
};

const baseLeaderboard: LeaderboardEntry[] = [
  { name: "Astra", score: 1840, rank: 1 },
  { name: "Kade", score: 1625, rank: 2 },
  { name: "Mina", score: 1480, rank: 3 },
];

export default function HomeHub() {
  const [money, setMoney] = useState(140);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [armorLevel, setArmorLevel] = useState(1);
  const leaderboard = useMemo(() => {
    const playerScore = 1200 + weaponLevel * 180 + armorLevel * 140;
    return [...baseLeaderboard, { name: "You", score: playerScore, rank: 4 }]
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [armorLevel, weaponLevel]);

  const upgradeWeapon = () => {
    const cost = 60 + weaponLevel * 25;
    if (money < cost) return;
    setProgress((current) => ({ ...current, money: current.money - cost, weaponLevel: current.weaponLevel + 1 }));
  };

  const upgradeArmor = () => {
    const cost = 70 + armorLevel * 30;
    if (money < cost) return;
    setProgress((current) => ({ ...current, money: current.money - cost, armorLevel: current.armorLevel + 1 }));
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>ARCADE HUB</p>
          <h1 style={styles.title}>Bug Brawler Town</h1>
          <p style={styles.subtitle}>
            Climb the leaderboard, upgrade your gear, and grind mini-games for cash to make your bug hunt stronger.
          </p>
          <div style={styles.buttonRow}>
            <Link href="/play" style={styles.primaryButton}>Launch Bug Brawler</Link>
            <Link href="/mini-games" style={styles.secondaryButton}>Open arcade</Link>
          </div>
        </div>
        <div style={styles.moneyCard}>
          <div style={styles.statBadge}>Cash</div>
          <div style={styles.moneyValue}>${money}</div>
          <div style={styles.statRow}>
            <span>Weapon Lv {weaponLevel}</span>
            <span>Armor Lv {armorLevel}</span>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Leaderboard</h2>
            <span style={styles.tag}>Top hunters</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {leaderboard.map((entry) => (
              <div key={entry.name} style={styles.leaderRow}>
                <div>
                  <strong>{entry.rank}. {entry.name}</strong>
                </div>
                <div style={{ color: "#9ef4ff" }}>{entry.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Upgrade Shop</h2>
            <span style={styles.tag}>Spend cash</span>
          </div>
          <div style={styles.upgradeCard}>
            <div>
              <h3 style={styles.cardTitle}>Weapon Core</h3>
              <p style={styles.cardText}>Boost your damage and fire rate.</p>
            </div>
            <button style={styles.buyButton} onClick={upgradeWeapon}>
              Upgrade · ${60 + weaponLevel * 25}
            </button>
          </div>
          <div style={styles.upgradeCard}>
            <div>
              <h3 style={styles.cardTitle}>Armor Shell</h3>
              <p style={styles.cardText}>Increase your survivability on the field.</p>
            </div>
            <button style={styles.buyButton} onClick={upgradeArmor}>
              Upgrade · ${70 + armorLevel * 30}
            </button>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Arcade Portal</h2>
            <span style={styles.tag}>Pick a game</span>
          </div>
          <p style={styles.cardText}>Step into a dedicated room for the shooting range or the obby challenge.</p>
          <div style={styles.buttonRow}>
            <Link href="/mini-games/shooting-range" style={styles.primaryButton}>Open shooting range</Link>
            <Link href="/mini-games/obby" style={styles.secondaryButton}>Open obby</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "radial-gradient(circle at top, #1f3554 0%, #09111d 70%)",
    color: "#f7fbff",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    background: "rgba(7, 16, 28, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.26)",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  eyebrow: {
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    fontSize: 12,
    color: "#8de1ff",
    margin: "0 0 8px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 2.8rem)",
    color: "#fff8db",
  },
  subtitle: {
    maxWidth: 650,
    lineHeight: 1.6,
    color: "#c7d6e8",
    margin: "8px 0 18px",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: 999,
    padding: "12px 16px",
    background: "linear-gradient(90deg, #4be5ff, #43d17f)",
    color: "#07111b",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 999,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.06)",
    color: "#f7fbff",
    fontWeight: 700,
    cursor: "pointer",
  },
  moneyCard: {
    minWidth: 260,
    padding: 20,
    borderRadius: 20,
    background: "linear-gradient(140deg, #18304a, #0e1e2e)",
    border: "1px solid rgba(125, 239, 255, 0.22)",
  },
  statBadge: {
    color: "#7fe6ff",
    fontSize: 12,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
  },
  moneyValue: {
    fontSize: "2.2rem",
    fontWeight: 800,
    margin: "8px 0 12px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    color: "#ccdced",
    fontSize: 14,
    flexWrap: "wrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  panel: {
    padding: 20,
    borderRadius: 20,
    background: "rgba(8, 16, 28, 0.92)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
  },
  tag: {
    fontSize: 12,
    color: "#7fe6ff",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
  },
  leaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.05)",
    padding: "10px 12px",
    borderRadius: 12,
  },
  upgradeCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    marginBottom: 10,
    alignItems: "center",
  },
  cardTitle: {
    margin: "0 0 6px",
    fontSize: 16,
  },
  cardText: {
    margin: 0,
    color: "#9db5ca",
    lineHeight: 1.5,
  },
  buyButton: {
    border: "none",
    borderRadius: 999,
    padding: "10px 12px",
    background: "#2d5dff",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  targetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 10,
  },
  targetButton: {
    padding: "14px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "linear-gradient(140deg, #244b6f, #0d2338)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  emptyState: {
    padding: 16,
    borderRadius: 12,
    background: "rgba(85, 255, 170, 0.16)",
    color: "#96ffbe",
    textAlign: "center",
  },
  obbyBar: {
    height: 10,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    overflow: "hidden",
    margin: "12px 0",
  },
  obbyFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ffcc4d, #ff6b57)",
    transition: "width 0.2s ease",
  },
};
