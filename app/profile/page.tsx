"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerProgress } from "@/components/bug-brawler/progress";
import { getCurrentUsername } from "@/components/bug-brawler/accounts";
import { signOut } from "@/components/bug-brawler/accounts";

export default function ProfilePage() {
  const router = useRouter();
  const [username] = useState(() => getCurrentUsername());
  const { progress } = usePlayerProgress();
  const stats = [
    ["BEST SCORE", `${progress.levelsSurvived} pts`, "levels survived"],
    ["CASH", `$${progress.money}`, "available upgrades"],
    ["WEAPON", `Lv ${progress.weaponLevel}`, "weapon core"],
    ["ARMOR", `Lv ${progress.armorLevel}`, "armor shell"],
  ];

  useEffect(() => {
    if (!username) router.replace("/login");
  }, [router, username]);

  if (!username) return null;

  return <main style={styles.page}><section style={styles.card}>
    <p style={styles.eyebrow}>EXTERMINATOR ID</p>
    <div style={styles.identity}><div style={styles.avatar}>🐞</div><div><h1 style={styles.title}>Bug Brawler</h1><p style={styles.subtitle}>Hunter profile · keep pushing your best run.</p></div></div>
    <div style={styles.stats}>{stats.map(([label, value, detail]) => <div key={label} style={styles.stat}><small style={styles.label}>{label}</small><strong style={styles.value}>{value}</strong><span style={styles.detail}>{detail}</span></div>)}</div>
    <div style={styles.actions}><Link href="/play" style={styles.primary}>Continue hunting</Link><Link href="/" style={styles.secondary}>Open Bug Brawler Town</Link><button style={styles.secondary} onClick={() => { signOut(); router.push("/login"); }}>Switch Player</button></div>
  </section></main>;
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at top, #303b72, #10142b 45%, #080b19 100%)", color: "#edf4ff" },
  card: { width: "min(760px, 100%)", padding: 32, border: "1px solid rgba(147, 169, 224, .3)", borderRadius: 20, background: "rgba(13, 18, 48, .9)", boxShadow: "0 28px 90px rgba(0,0,0,.65)" },
  eyebrow: { margin: 0, color: "#91a5d2", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em" }, identity: { display: "flex", alignItems: "center", gap: 16, margin: "14px 0 28px" }, avatar: { display: "grid", placeItems: "center", width: 72, height: 72, borderRadius: 18, background: "#d8ff76", color: "#17213d", fontSize: 36 }, title: { margin: 0, fontSize: "clamp(2rem, 6vw, 3rem)", color: "#fff" }, subtitle: { margin: "5px 0 0", color: "#aebee2" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }, stat: { padding: 17, border: "1px solid rgba(130, 153, 204, .28)", borderRadius: 12, background: "#101937" }, label: { display: "block", color: "#91a5d2", fontWeight: 800, letterSpacing: ".1em" }, value: { display: "block", margin: "7px 0 3px", color: "#d8ff76", fontSize: 24 }, detail: { color: "#aebee2", fontSize: 12 },
  actions: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }, primary: { padding: "12px 16px", borderRadius: 8, background: "#d8ff76", color: "#17213d", fontWeight: 800, textDecoration: "none" }, secondary: { padding: "12px 16px", border: "1px solid #8299cc", borderRadius: 8, color: "#edf4ff", fontWeight: 800, textDecoration: "none" },
};
