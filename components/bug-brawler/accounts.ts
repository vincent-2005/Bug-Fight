export type Account = { username: string; password: string };

const ACCOUNTS_KEY = "bug-brawler-accounts";
const SESSION_KEY = "bug-brawler-current-user";

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as Account[];
    return Array.isArray(accounts) ? accounts.filter((account) => account.username && account.password) : [];
  } catch {
    return [];
  }
}

export function getCurrentUsername() {
  if (typeof window === "undefined") return null;
  const username = window.localStorage.getItem(SESSION_KEY);
  return getAccounts().some((account) => account.username === username) ? username : null;
}

export function createAccount(username: string, password: string) {
  const cleanUsername = username.trim();
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(cleanUsername)) return "Use 3–16 letters, numbers, or underscores for your username.";
  if (password.length < 4) return "Use a password with at least 4 characters.";
  const accounts = getAccounts();
  if (accounts.some((account) => account.username.toLowerCase() === cleanUsername.toLowerCase())) return "That username is already taken.";
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, { username: cleanUsername, password }]));
  window.localStorage.setItem(SESSION_KEY, cleanUsername);
  return null;
}

export function signIn(username: string, password: string) {
  const account = getAccounts().find((entry) => entry.username.toLowerCase() === username.trim().toLowerCase() && entry.password === password);
  if (!account) return "Incorrect username or password.";
  window.localStorage.setItem(SESSION_KEY, account.username);
  return null;
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
