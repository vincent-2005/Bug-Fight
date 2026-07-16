"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, signIn } from "@/components/bug-brawler/accounts";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = mode === "signup" ? createAccount(username, password) : signIn(username, password);
    if (result) return setError(result);
    router.push("/");
  };
  return <main style={styles.page}><form style={styles.card} onSubmit={submit}>
    <p style={styles.eyebrow}>BUG BRAWLER ACCOUNT</p><h1 style={styles.title}>{mode === "signup" ? "Create your hunter" : "Welcome back"}</h1>
    <p style={styles.copy}>Use your own username for the leaderboard and save your progress.</p>
    <label style={styles.label}>Username<input style={styles.input} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
    <label style={styles.label}>Password<input style={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} required /></label>
    {error && <p style={styles.error}>{error}</p>}<button style={styles.button}>{mode === "signup" ? "Create account" : "Sign in"}</button>
    <button type="button" style={styles.switch} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}</button>
  </form></main>;
}

const styles = { page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at top, #303b72, #10142b 45%, #080b19 100%)", color: "#edf4ff", fontFamily: "Arial, sans-serif" }, card: { width: "min(440px, 100%)", display: "grid", gap: 14, padding: 30, border: "1px solid rgba(147,169,224,.3)", borderRadius: 20, background: "#0d1230", boxShadow: "0 28px 90px #000a" }, eyebrow: { margin: 0, color: "#8de1ff", fontSize: 11, fontWeight: 800, letterSpacing: ".18em" }, title: { margin: 0, fontSize: 30 }, copy: { margin: 0, color: "#aebee2", lineHeight: 1.5 }, label: { display: "grid", gap: 6, color: "#c7d6e8", fontSize: 13, fontWeight: 700 }, input: { padding: 12, border: "1px solid #6078aa", borderRadius: 8, background: "#101937", color: "#fff", fontSize: 16 }, button: { marginTop: 6, padding: 12, border: 0, borderRadius: 8, background: "#d8ff76", color: "#17213d", cursor: "pointer", fontWeight: 800 }, switch: { padding: 4, border: 0, background: "transparent", color: "#8de1ff", cursor: "pointer", fontWeight: 700 }, error: { margin: 0, color: "#ff9e9e", fontSize: 13 } } as const;
