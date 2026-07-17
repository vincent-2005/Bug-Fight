"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import { usePlayerProgress } from "@/components/bug-brawler/progress";

type Question = {
  prompt: string;
  options: string[];
  answer: number;
};

type AnswerOption = {
  label: string;
  correct: boolean;
};

const shuffleOptions = (question: Question): AnswerOption[] => {
  const options = question.options.map((label, index) => ({ label, correct: index === question.answer }));
  for (let index = options.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }
  return options;
};

const questions: Question[] = [
  {
    prompt: "What does CSS stand for?",
    options: ["Cascading Style Sheets", "Creative Style System", "Color Styled Syntax"],
    answer: 0,
  },
  {
    prompt: "Which game mechanic is most important in a dodge game?",
    options: ["Timing", "Reading a novel", "Sleeping"],
    answer: 0,
  },
  {
    prompt: "What is the goal of blackjack?",
    options: ["Beat the dealer", "Build a castle", "Catch a fish"],
    answer: 0,
  },
  {
    prompt: "What does a reward loop encourage?",
    options: ["Replayability", "Boredom", "Slow movement"],
    answer: 0,
  },
  {
    prompt: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Mercury"],
    answer: 0,
  },
  {
    prompt: "What is 12 × 8?",
    options: ["96", "84", "108"],
    answer: 0,
  },
  {
    prompt: "Which language runs in the browser?",
    options: ["JavaScript", "Python", "C++"],
    answer: 0,
  },
  {
    prompt: "What does HTML stand for?",
    options: ["HyperText Markup Language", "High Tech Modern Language", "Hyper Transfer Machine Language"],
    answer: 0,
  },
  {
    prompt: "Which of these is a common game loop pattern?",
    options: ["Update, render, repeat", "Eat, sleep, repeat", "Talk, walk, jump"],
    answer: 0,
  },
  {
    prompt: "What is the capital of Japan?",
    options: ["Tokyo", "Kyoto", "Osaka"],
    answer: 0,
  },
];

export default function TriviaQuizPage() {
  const { progress: playerProgress, addMoney } = usePlayerProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reward, setReward] = useState(0);
  const [status, setStatus] = useState("Start a quiz run to earn cash.");
  const [shuffledOptions, setShuffledOptions] = useState<AnswerOption[]>(() =>
    questions[0].options.map((label, index) => ({ label, correct: index === questions[0].answer }))
  );

  const startGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setReward(0);
    setShuffledOptions(shuffleOptions(questions[0]));
    setGameActive(true);
    setStatus("Pick the correct answer for each round.");
  };

  const answerQuestion = (isCorrect: boolean) => {
    if (!gameActive) return;

    const nextScore = score + (isCorrect ? 1 : 0);
    setScore(nextScore);

    if (currentIndex === questions.length - 1) {
      setGameActive(false);
      if (nextScore >= 7) {
        const payout = 30 + (nextScore - 7) * 10;
        addMoney(payout);
        setReward(payout);
        setStatus(`You scored ${nextScore}/${questions.length} and earned $${payout}.`);
      } else {
        setStatus(`You scored ${nextScore}/${questions.length}. Try another round.`);
      }
      setFinished(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setShuffledOptions(shuffleOptions(questions[nextIndex]));
    setStatus(isCorrect ? "Correct. Keep the streak going." : "Not quite. Try the next one.");
  };

  const question = questions[currentIndex];

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MINI-GAME</p>
            <h1 style={styles.title}>Trivia Quiz</h1>
            <p style={styles.subtitle}>Answer quick questions and cash in when your streak is strong.</p>
          </div>
          <Link href="/mini-games" style={styles.backLink}>← Back</Link>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}><strong>{playerProgress.money}</strong><span>Wallet</span></div>
          <div style={styles.statBox}><strong>{score}</strong><span>Score</span></div>
          <div style={styles.statBox}><strong>{gameActive ? `${currentIndex + 1}/${questions.length}` : "Ready"}</strong><span>Question</span></div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.prompt}>{question.prompt}</h2>
          <div style={styles.options}>
            {shuffledOptions.map((option) => (
              <button key={option.label} style={styles.optionButton} onClick={() => answerQuestion(option.correct)} disabled={!gameActive}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={startGame}>Start quiz</button>
          <p style={styles.status}>{status}</p>
        </div>

        {finished && (
          <div style={styles.resultOverlay} role="dialog" aria-modal="true" aria-labelledby="trivia-result-title">
            <div style={styles.resultCard}>
              <p style={styles.resultEyebrow}>QUIZ COMPLETE</p>
              <h2 id="trivia-result-title" style={styles.resultTitle}>{score >= 7 ? "Great Run!" : "Quiz Finished"}</h2>
              <p style={styles.resultText}>You got {score} out of {questions.length} questions correct.</p>
              <p style={styles.resultReward}>{reward > 0 ? `+$${reward}` : "Try again for a payout"}</p>
              <button style={styles.button} onClick={startGame}>Play again</button>
            </div>
          </div>
        )}
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
    background: "radial-gradient(circle at top, #24395e, #0a1120)",
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
    maxWidth: 620,
  },
  backLink: {
    color: "#8ee6ff",
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
  panel: {
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
  },
  prompt: {
    margin: "0 0 14px",
    color: "#fff6d3",
  },
  options: {
    display: "grid",
    gap: 10,
  },
  optionButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#f6fbff",
    textAlign: "left",
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 16,
    alignItems: "center",
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
  status: {
    margin: 0,
    color: "#c9daed",
  },
  resultOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10,
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "rgba(4, 7, 14, 0.74)",
    backdropFilter: "blur(7px)",
  },
  resultCard: {
    width: "min(390px, 100%)",
    padding: 30,
    borderRadius: 22,
    textAlign: "center",
    background: "linear-gradient(145deg, #173855, #10182b)",
    border: "1px solid rgba(94,231,255,0.55)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
  },
  resultEyebrow: { margin: 0, color: "#8ee6ff", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em" },
  resultTitle: { margin: "10px 0 8px", fontSize: "clamp(2rem, 8vw, 2.8rem)" },
  resultText: { margin: 0, color: "#c9daed" },
  resultReward: { margin: "18px 0", color: "#8fe4a7", fontSize: 24, fontWeight: 800 },
};
