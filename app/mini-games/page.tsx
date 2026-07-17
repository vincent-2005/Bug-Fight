import Link from "next/link";

const games = [
  {
    href: "/mini-games/shooting-range",
    title: "Shooting Range",
    text: "Hit moving targets and stack cash with rapid-fire precision.",
  },
  {
    href: "/mini-games/blackjack",
    title: "Blackjack",
    text: "Beat the dealer with a strong hand and a lucky draw.",
  },
  {
    href: "/mini-games/trivia-quiz",
    title: "Trivia Quiz",
    text: "Answer quick questions and cash in for a solid streak.",
  },
  {
    href: "/mini-games/maze-run",
    title: "Maze Run",
    text: "Guide the character through the maze and reach the exit.",
  },
  {
    href: "/mini-games/coin-collector",
    title: "Coin Collector",
    text: "Race around the arena and scoop glowing coins before the round ends.",
  },
  {
    href: "/mini-games/color-match",
    title: "Color Match",
    text: "Find the matching tiles as fast as you can before time runs out.",
  },
  {
    href: "/mini-games/dodge-dash",
    title: "Dodge Dash",
    text: "Survive the falling blocks and stay alive for the full timer.",
  },
];

export default function MiniGamesPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>ARCADE ZONE</p>
        <h1 style={styles.title}>Choose a mini-game</h1>
        <p style={styles.subtitle}>Pick a challenge to earn cash for upgrades.</p>
        <div style={styles.grid}>
          {games.map((game) => (
            <Link key={game.title} href={game.href} style={styles.tile}>
              <h2 style={styles.tileTitle}>{game.title}</h2>
              <p style={styles.tileText}>{game.text}</p>
            </Link>
          ))}
        </div>
        <Link href="/" style={styles.backLink}>← Back to hub</Link>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "radial-gradient(circle at top, #20395a, #080f18)",
    color: "#f6fbff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(980px, 100%)",
    padding: 28,
    borderRadius: 24,
    background: "rgba(8, 16, 28, 0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
  },
  eyebrow: {
    margin: 0,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#8ee6ff",
    fontSize: 12,
  },
  title: {
    margin: "8px 0 8px",
    fontSize: "clamp(2rem, 3vw, 2.6rem)",
  },
  subtitle: {
    margin: "0 0 20px",
    color: "#9eb4c9",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  tile: {
    display: "block",
    padding: 20,
    borderRadius: 16,
    background: "linear-gradient(140deg, #1e3b57, #0d1d2d)",
    border: "1px solid rgba(255,255,255,0.14)",
    textDecoration: "none",
    color: "inherit",
  },
  tileTitle: {
    margin: "0 0 8px",
    color: "#fff6d3",
  },
  tileText: {
    margin: 0,
    color: "#b4cadf",
    lineHeight: 1.5,
  },
  backLink: {
    display: "inline-block",
    marginTop: 18,
    color: "#8ee6ff",
    textDecoration: "none",
    fontWeight: 700,
  },
};
