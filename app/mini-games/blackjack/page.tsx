"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Card = {
  suit: string;
  value: string;
  score: number;
  label: string;
};

type Outcome = "ready" | "playing" | "finished";

const suits = ["♠", "♥", "♦", "♣"];
const values = [
  { value: "A", score: 11 },
  { value: "2", score: 2 },
  { value: "3", score: 3 },
  { value: "4", score: 4 },
  { value: "5", score: 5 },
  { value: "6", score: 6 },
  { value: "7", score: 7 },
  { value: "8", score: 8 },
  { value: "9", score: 9 },
  { value: "10", score: 10 },
  { value: "J", score: 10 },
  { value: "Q", score: 10 },
  { value: "K", score: 10 },
];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const entry of values) {
      deck.push({ suit, value: entry.value, score: entry.score, label: `${entry.value}${suit}` });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getHandScore(hand: Card[]) {
  let total = hand.reduce((sum, card) => sum + card.score, 0);
  let aces = hand.filter((card) => card.value === "A").length;
  while (aces > 0 && total > 21) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export default function BlackjackPage() {
  const { progress: playerProgress, setProgress, addMoney } = usePlayerProgress();
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [bet, setBet] = useState(10);
  const [roundBet, setRoundBet] = useState(10);
  const [status, setStatus] = useState("The dealer waits for your first hand.");
  const [phase, setPhase] = useState<Outcome>("ready");

  const startRound = () => {
    const safeBet = Math.max(1, Math.min(playerProgress.money, Math.floor(bet || 0)));
    if (safeBet > playerProgress.money) {
      setStatus("You do not have enough money for that bet.");
      return;
    }

    setProgress((current) => ({ ...current, money: current.money - safeBet }));
    setRoundBet(safeBet);

    const freshDeck = createDeck();
    const player = [freshDeck.shift()!, freshDeck.shift()!];
    const dealer = [freshDeck.shift()!, freshDeck.shift()!];
    setDeck(freshDeck);
    setPlayerHand(player);
    setDealerHand(dealer);
    setPhase("playing");
    setStatus("Hit or stand? Try to beat the dealer without busting.");
  };

  const finishRound = (playerFinal: Card[], dealerFinal: Card[]) => {
    const playerScore = getHandScore(playerFinal);
    const dealerScore = getHandScore(dealerFinal);

    let outcome = "lose";
    if (playerScore > 21) {
      outcome = "lose";
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      outcome = "win";
    } else if (playerScore === dealerScore) {
      outcome = "push";
    }

    if (outcome === "win") {
      addMoney(roundBet * 2);
      setStatus(`You win! The dealer paid out $${roundBet * 2}.`);
    } else if (outcome === "push") {
      addMoney(roundBet);
      setStatus("Push. The hand is a tie and your stake is returned.");
    } else {
      setStatus("Bust. The dealer takes the hand.");
    }

    setDealerHand(dealerFinal);
    setPhase("finished");
  };

  const hit = () => {
    if (phase !== "playing" || deck.length === 0) return;

    const nextCard = deck[0];
    const nextDeck = deck.slice(1);
    const nextHand = [...playerHand, nextCard];
    setDeck(nextDeck);
    setPlayerHand(nextHand);

    if (getHandScore(nextHand) > 21) {
      finishRound(nextHand, dealerHand);
      return;
    }

    setStatus("You drew a card. Choose again or stand.");
  };

  const stand = () => {
    if (phase !== "playing") return;

    let dealerCards = [...dealerHand];
    const remainingDeck = [...deck];

    while (getHandScore(dealerCards) < 17) {
      const nextCard = remainingDeck.shift();
      if (!nextCard) break;
      dealerCards = [...dealerCards, nextCard];
    }

    setDeck(remainingDeck);
    finishRound(playerHand, dealerCards);
  };

  const playerScore = getHandScore(playerHand);
  const dealerScore = getHandScore(dealerHand);
  const visibleDealerScore = getHandScore(dealerHand.slice(0, 1));

  return (
    <main style={styles.page}>
      <div style={styles.card} className="casino-table">
        <div className="casino-lights" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Blackjack</h1>
            <p style={styles.subtitle}>Choose your stake, beat the dealer, and take the pot.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{phase === "playing" ? playerScore : "—"}</strong><span>Your hand</span></div>
          <div style={styles.statBox}><strong>{phase === "playing" ? visibleDealerScore : phase === "finished" ? dealerScore : "—"}</strong><span>Dealer</span></div>
        </div>

        <div style={styles.bettingRow}>
          <label style={styles.betLabel}>
            Bet
            <input
              type="number"
              min="1"
              max={playerProgress.money}
              value={bet}
              onChange={(event) => setBet(Number(event.target.value) || 1)}
              style={styles.betInput}
            />
          </label>
          <button style={styles.button} onClick={startRound}>Deal hand</button>
        </div>

        <div style={styles.table}>
          <div style={styles.handBlock}>
            <h2 style={styles.handTitle}>Player</h2>
            <div style={styles.handRow}>
              {playerHand.length === 0 ? <span style={styles.placeholder}>No cards yet</span> : playerHand.map((card, index) => <div key={`${card.label}-${index}`} style={styles.cardChip} className="casino-card">{card.label}</div>)}
            </div>
          </div>

          <div style={styles.handBlock}>
            <h2 style={styles.handTitle}>Dealer</h2>
            <div style={styles.handRow}>
              {dealerHand.length === 0 ? <span style={styles.placeholder}>No cards yet</span> : dealerHand.map((card, index) => (
                phase === "playing" && index === 1
                  ? <div key={`${card.label}-${index}`} style={styles.cardBack} className="casino-card casino-card-back" aria-label="Dealer card face down">?</div>
                  : <div key={`${card.label}-${index}`} style={styles.cardChip} className="casino-card">{card.label}</div>
              ))}
            </div>
          </div>
        </div>

        <p style={styles.status}>{status}</p>

        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={hit} disabled={phase !== "playing"}>Hit</button>
          <button style={styles.secondaryButton} onClick={stand} disabled={phase !== "playing"}>Stand</button>
        </div>
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
    background: "radial-gradient(circle at top, #194c31, #07140c)",
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
    color: "#88f1b4",
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
    color: "#88f1b4",
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
  bettingRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  betLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#dce8f3",
    fontWeight: 600,
  },
  betInput: {
    width: 110,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#f6fbff",
  },
  table: {
    display: "grid",
    gap: 12,
  },
  handBlock: {
    padding: 16,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
  },
  handTitle: {
    margin: "0 0 10px",
    color: "#fff6d3",
  },
  handRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  placeholder: {
    color: "#8fa9b9",
  },
  cardChip: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #5ee7ff, #60a5fa)",
    color: "#07111b",
    fontWeight: 700,
  },
  cardBack: {
    display: "grid",
    placeItems: "center",
    minWidth: 44,
    padding: "8px 10px",
    borderRadius: 10,
    background: "repeating-linear-gradient(45deg, #17345f 0 5px, #24548e 5px 10px)",
    border: "2px solid #8edbff",
    color: "#dff7ff",
    fontWeight: 800,
  },
  status: {
    margin: "16px 0",
    color: "#dce8f3",
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
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
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 999,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.08)",
    color: "#f6fbff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
