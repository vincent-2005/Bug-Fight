"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { loadProgress, usePlayerProgress } from "./progress";
import { getCurrentUsername, signOut } from "./accounts";

export default function HomeHub() {
  const router = useRouter();
  const [username] = useState(() => getCurrentUsername());
  const { progress, setProgress } = usePlayerProgress();
  const { money, weaponLevel, armorLevel, speedLevel, shieldLevel } = progress;
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialFinished, setTutorialFinished] = useState(() =>
    typeof window !== "undefined" && loadProgress().tutorialCompleted
  );
  const tutorial = [
    { title: "Welcome to Bug Brawler Town", text: "This is your home base. Your cash, upgrades, best survival score, and arcade games all connect here." },
    { title: "Bug Brawler controls", text: "Choose Launch Bug Brawler to enter the hunt. Move with WASD or arrow keys, aim with the mouse, attack with click or Space, turn with Q/E, and press F for a quick 180° turn." },
    { title: "Survive each wave", text: "Keep enemies away from your health bar. Walk over crates for supplies, med kits, shields, and boosts; use equipped toolbar items with keys 1–6. Clear a wave to reach the shop." },
    { title: "Track your best survival run", text: "Your personal profile records your highest number of completed levels survived. Cash does not affect this score." },
    { title: "Spend cash on upgrades", text: "Use the Upgrade Shop here to raise Weapon Core and Armor Shell levels. Stronger gear helps you hold out longer in Bug Brawler." },
    { title: "Earn cash in mini-games", text: "Open the arcade for extra challenges, including the shooting range and obby. Complete games to earn cash, then return here to buy upgrades." },
    { title: "Use your personal profile", text: "Your Profile shows your best score, cash, weapon level, and armor level. It is linked from the top-right corner inside Bug Brawler." },
  ];

  useEffect(() => {
    if (!username) router.replace("/login");
  }, [router, username]);

  const openTutorial = () => {
    if (tutorialFinished) return;
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const finishTutorial = () => {
    setProgress((current) => ({ ...current, tutorialCompleted: true }));
    setTutorialFinished(true);
    setShowTutorial(false);
  };

  const switchAccount = () => {
    signOut();
    router.push("/login");
  };

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
  const upgradeSpeed = () => { const cost = 50 + speedLevel * 25; if (money >= cost) setProgress((current) => ({ ...current, money: current.money - cost, speedLevel: current.speedLevel + 1 })); };
  const upgradeShield = () => { const cost = 65 + shieldLevel * 30; if (money >= cost) setProgress((current) => ({ ...current, money: current.money - cost, shieldLevel: current.shieldLevel + 1 })); };

  if (!username) return null;

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>ARCADE HUB</p>
          <h1 style={styles.title}>Bug Brawler Town{username ? ` · ${username}` : ""}</h1>
          <p style={styles.subtitle}>
            Upgrade your gear, track your best survival run, and grind mini-games for cash to make your bug hunt stronger.
          </p>
          <div style={styles.buttonRow}>
            <Link href="/play" style={styles.primaryButton}>Launch Bug Brawler</Link>
            <Link href="/mini-games" style={styles.secondaryButton}>Open arcade</Link>
            <Link href="/profile" style={styles.secondaryButton}>Personal Page</Link>
            {!tutorialFinished && <button style={styles.secondaryButton} onClick={openTutorial}>Watch Tutorial</button>}
            <button style={styles.secondaryButton} onClick={switchAccount}>Switch Player</button>
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
          <div style={styles.upgradeCard}><div><h3 style={styles.cardTitle}>Turbo Boots · Lv {speedLevel}</h3><p style={styles.cardText}>Move faster through every bug-filled map.</p></div><button style={styles.buyButton} onClick={upgradeSpeed}>Upgrade · ${50 + speedLevel * 25}</button></div>
          <div style={styles.upgradeCard}><div><h3 style={styles.cardTitle}>Shield Generator · Lv {shieldLevel}</h3><p style={styles.cardText}>Start each hunt with extra barrier protection.</p></div><button style={styles.buyButton} onClick={upgradeShield}>Upgrade · ${65 + shieldLevel * 30}</button></div>
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
      {showTutorial && <div className="modal"><div className="end" style={styles.tutorial}>
        <p className="eyebrow">BUG BRAWLER GUIDE · {tutorialStep + 1}/{tutorial.length}</p>
        <h2>{tutorial[tutorialStep].title}</h2>
        <p>{tutorial[tutorialStep].text}</p>
        <button className="continue" onClick={() => tutorialStep === tutorial.length - 1 ? finishTutorial() : setTutorialStep((step) => step + 1)}>
          {tutorialStep === tutorial.length - 1 ? "CLOSE TUTORIAL" : "NEXT →"}
        </button>
      </div></div>}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
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
  tutorial: {
    maxWidth: 560,
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
};
