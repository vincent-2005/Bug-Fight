"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./SniperGame.module.css";

const W = 1000;
const H = 580;
type Target = { x: number; y: number; r: number; vx: number; points: number; active: boolean };
type Game = { targets: Target[]; score: number; shots: number; hits: number; time: number; status: "playing" | "done"; flash: number };

const fresh = (): Game => ({
  targets: Array.from({ length: 7 }, (_, i) => ({ x: 120 + i * 125, y: 230 + (i % 3) * 55, r: 18 + (i % 2) * 5, vx: i % 2 ? .7 : -.55, points: i % 2 ? 125 : 100, active: true })),
  score: 0, shots: 0, hits: 0, time: 60, status: "playing", flash: 0,
});

export default function SniperGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const aim = useRef({ x: W / 2, y: H / 2 });
  const game = useRef<Game>(fresh());
  const [hud, setHud] = useState({ score: 0, shots: 0, hits: 0, time: 60, status: "playing" as Game["status"] });
  const sync = useCallback(() => { const g = game.current; setHud({ score: g.score, shots: g.shots, hits: g.hits, time: Math.ceil(g.time), status: g.status }); }, []);
  const restart = () => { game.current = fresh(); sync(); };

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    let raf = 0, previous = performance.now();
    const draw = (now: number) => {
      const g = game.current, delta = Math.min(33, now - previous) / 1000; previous = now; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, W, H);
      if (g.status === "playing") {
        g.time -= delta; g.flash = Math.max(0, g.flash - 1);
        g.targets.forEach(target => { if (!target.active) return; target.x += target.vx; if (target.x < 65 || target.x > W - 65) target.vx *= -1; });
        if (g.time <= 0) { g.time = 0; g.status = "done"; sync(); }
        if (Math.round(g.time * 10) % 10 === 0) sync();
      }
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#68a7d4"); sky.addColorStop(.55, "#e7d8ba"); sky.addColorStop(.56, "#607a47"); sky.addColorStop(1, "#263724"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#637a5e"; for (let i = 0; i < 16; i++) { const x = i * 77 - 25; ctx.beginPath();ctx.moveTo(x, H*.55);ctx.lineTo(x+40,H*.27+(i%4)*16);ctx.lineTo(x+100,H*.55);ctx.fill(); }
      ctx.fillStyle = "#405638";ctx.fillRect(0,H*.64,W,H*.36);ctx.strokeStyle="#a59c6a55";ctx.lineWidth=2;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(W/2,H*.61);ctx.lineTo(i*140,H);ctx.stroke();}
      g.targets.forEach(target => { if (!target.active) return; ctx.save();ctx.translate(target.x,target.y);ctx.fillStyle="#172126";ctx.fillRect(-target.r*.33,0,target.r*.66,target.r*1.8);ctx.fillStyle="#c8b298";ctx.beginPath();ctx.arc(0,-target.r*.35,target.r*.47,0,Math.PI*2);ctx.fill();ctx.fillStyle="#a83531";ctx.beginPath();ctx.arc(0,-target.r*.32,target.r*.35,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f6e89b";ctx.beginPath();ctx.arc(0,-target.r*.32,target.r*.13,0,Math.PI*2);ctx.fill();ctx.restore(); });
      ctx.fillStyle="#141412";ctx.fillRect(0,0,W,25);ctx.fillRect(0,H-25,W,25);ctx.fillRect(0,0,25,H);ctx.fillRect(W-25,0,25,H);
      const x=aim.current.x,y=aim.current.y;ctx.strokeStyle="#f5f7d7";ctx.lineWidth=1;ctx.shadowColor="#fff";ctx.shadowBlur=5;ctx.beginPath();ctx.arc(x,y,45,0,Math.PI*2);ctx.moveTo(x-68,y);ctx.lineTo(x+68,y);ctx.moveTo(x,y-68);ctx.lineTo(x,y+68);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#f5f7d7";ctx.font="700 12px monospace";ctx.fillText("4x",x+54,y-50);
      if(g.flash){ctx.fillStyle="rgba(255,246,193,.42)";ctx.fillRect(0,0,W,H);} if(g.status==="done"){ctx.fillStyle="rgba(4,8,11,.7)";ctx.fillRect(0,0,W,H);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="800 42px Arial";ctx.fillText("RANGE COMPLETE",W/2,H/2-12);ctx.fillStyle="#d8ed91";ctx.font="700 17px Arial";ctx.fillText(`${g.score} points · ${g.hits}/${g.shots || 0} shots on target`,W/2,H/2+23);}
      raf=requestAnimationFrame(draw);
    };
    draw(performance.now()); return () => cancelAnimationFrame(raf);
  }, [sync]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => { const r=e.currentTarget.getBoundingClientRect(); aim.current={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}; };
  const shoot = (e: React.PointerEvent<HTMLCanvasElement>) => { point(e); const g=game.current; if(g.status!=="playing") return; g.shots++; g.flash=2; const target=g.targets.find(t=>t.active&&Math.hypot(aim.current.x-t.x,aim.current.y-(t.y-t.r*.32))<t.r*.5); if(target){target.active=false;g.hits++;g.score+=target.points; if(g.targets.every(t=>!t.active)){g.status="done";}} sync(); };
  const accuracy = hud.shots ? Math.round(hud.hits / hud.shots * 100) : 0;
  return <main className={styles.page}><section className={styles.game}><header><div><p>LONGSHOT TRAINING FACILITY</p><h1>RIDGELINE RANGE</h1></div><div><Link className={styles.duelLink} href="/sniper-game/duel">1V1 AI DUEL</Link><button onClick={restart}>↻ New round</button></div></header><div className={styles.hud}><span><small>SCORE</small><b>{hud.score.toString().padStart(4,"0")}</b></span><span><small>TIME</small><b>{hud.time}s</b></span><span><small>ACCURACY</small><b>{accuracy}%</b></span></div><canvas className={styles.canvas} ref={canvas} width={W} height={H} onPointerMove={point} onPointerDown={shoot}/><footer><span><kbd>MOUSE</kbd> aim + fire</span><span>Hit the red center for the score.</span></footer></section></main>;
}
