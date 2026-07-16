import { supabase } from "@/lib/supabase";

export type Account = { username: string };

const SESSION_KEY = "bug-brawler-current-user";

export function getAccounts(): Account[] {
  return [];
}

export function getCurrentUsername() {
  if (typeof window === "undefined") return null;
  const username = window.localStorage.getItem(SESSION_KEY);
  return username;
}

export async function createAccount(username: string, email: string, password: string) {
  const cleanUsername = username.trim();
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(cleanUsername)) return "Use 3–16 letters, numbers, or underscores for your username.";
  if (password.length < 6) return "Use a password with at least 6 characters.";
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: cleanUsername } } });
  if (error) return error.message;
  if (!data.user) return "Unable to create your account. Please try again.";
  if (!data.session) return "Check your email to confirm your account, then sign in.";
  window.localStorage.setItem(SESSION_KEY, cleanUsername);
  return null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) return error?.message ?? "Incorrect email or password.";
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
  window.localStorage.setItem(SESSION_KEY, profile?.username ?? data.user.user_metadata.username ?? email.trim());
  return null;
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  void supabase.auth.signOut();
}
