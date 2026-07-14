"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./DuelGame.module.css";

const W = 1000, H = 580, WORLD = 1800;
const maps = [
  { name: "Pine Ridge", note: "Rolling hills and tall pine cover", sky: "#6aa6ce", ground: "#355838", hill: "#27472f" },
  { name: "Redrock Outpost", note: "Open desert with scattered ruins", sky: "#e5a96c", ground: "#9d5735", hill: "#70402d" },
  { name: "Midnight Dock", note: "Low light around the shipping yard", sky: "#172548", ground: "#263943", hill: "#182932" },
];
type State = { px: number; py: number; playerHp: number; ax: number; ay: number; aiHp: number; aiCooldown: number; shotCooldown: number; flash: number; status: "select" | "playing" | "won" | "lost"; map: number };
const fresh = (map = 0): State => ({ px: WORLD / 2, py: WORLD / 2, playerHp: 100, ax: WORLD / 2 + 260, ay: WORLD / 2 - 160, aiHp: 100, aiCooldown: 100, shotCooldown: 0, flash: 0, status: "select", map });
const clamp = (n: number) => Math.max(30, Math.min(WORLD - 30, n));
const angleGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

export default function DuelGame() {
  const canvas = useRef<HTMLCanvasElement>(null); const state = useRef<State>(fresh()); const keys = useRef<Record<string, boolean>>({}); const facing = useRef(-Math.PI / 2);
  const [hud, setHud] = useState({ playerHp: 100, aiHp: 100, status: "select" as State["status"], map: 0 });
  const sync = () => { const s = state.current; setHud({ playerHp: Math.ceil(s.playerHp), aiHp: Math.ceil(s.aiHp), status: s.status, map: s.map }); };
  const start = (map: number) => { state.current = fresh(map); state.current.status = "playing"; facing.current = -Math.PI / 2; sync(); };

  useEffect(() => { const down=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=true;};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};addEventListener("keydown",down);addEventListener("keyup",up);return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up);};},[]);
  useEffect(() => {
    const ctx=canvas.current?.getContext("2d");if(!ctx)return;let raf=0;
    const draw=()=>{const s=state.current,m=maps[s.map];ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);
      if(s.status==="playing"){
        const forward=(keys.current.w?1:0)-(keys.current.s?1:0), strafe=(keys.current.d?1:0)-(keys.current.a?1:0), mag=Math.hypot(forward,strafe)||1; s.px=clamp(s.px+(Math.cos(facing.current)*forward-Math.sin(facing.current)*strafe)/mag*4.2);s.py=clamp(s.py+(Math.sin(facing.current)*forward+Math.cos(facing.current)*strafe)/mag*4.2);
        const chase=Math.atan2(s.py-s.ay,s.px-s.ax), dist=Math.hypot(s.px-s.ax,s.py-s.ay); if(dist>330){s.ax=clamp(s.ax+Math.cos(chase)*1.15);s.ay=clamp(s.ay+Math.sin(chase)*1.15);}else{s.ax=clamp(s.ax+Math.cos(chase+Math.PI/2)*.75);s.ay=clamp(s.ay+Math.sin(chase+Math.PI/2)*.75);}s.shotCooldown=Math.max(0,s.shotCooldown-1);s.flash=Math.max(0,s.flash-1);if(--s.aiCooldown<=0){if(dist<900&&Math.random()<.7){s.playerHp-=9+Math.random()*7;s.flash=6;}s.aiCooldown=65+Math.random()*55;}if(s.playerHp<=0){s.playerHp=0;s.status="lost";sync();}if(s.aiHp<=0){s.aiHp=0;s.status="won";sync();}if(Math.round(s.aiCooldown)%8===0)sync();
      }
      const horizon=H*.31, sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,m.sky);sky.addColorStop(1,"#d7d9c8");ctx.fillStyle=sky;ctx.fillRect(0,0,W,horizon);ctx.fillStyle=m.ground;ctx.fillRect(0,horizon,W,H-horizon);ctx.fillStyle=m.hill;for(let i=0;i<11;i++){ctx.beginPath();ctx.moveTo(i*110-30,horizon+42);ctx.lineTo(i*110+55,horizon-35-(i%3)*18);ctx.lineTo(i*110+145,horizon+42);ctx.fill();}
      const project=(x:number,y:number)=>{const dx=x-s.px,dy=y-s.py,front=dx*Math.cos(facing.current)+dy*Math.sin(facing.current),side=-dx*Math.sin(facing.current)+dy*Math.cos(facing.current);if(front<-40)return null;const depth=Math.max(85,front+90),scale=Math.min(2.6,270/depth);return{x:W/2+side*scale,y:horizon+25000/depth,scale,front};};
      ctx.strokeStyle="#e7f2dc2d";for(let d=80;d<1300;d+=80){const y=horizon+25000/(d+90);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let gx=120;gx<WORLD;gx+=200)for(let gy=90;gy<WORLD;gy+=180){if((gx*5+gy*3+s.map*7)%9>1)continue;const q=project(gx,gy);if(!q||q.front>850)continue;ctx.save();ctx.translate(q.x,q.y);ctx.scale(q.scale,q.scale);ctx.fillStyle=s.map===1?"#70442e":s.map===2?"#294953":"#315f39";ctx.beginPath();ctx.arc(0,-12,18,0,7);ctx.fill();ctx.fillStyle="#4c3422";ctx.fillRect(-3,-11,6,15);ctx.restore();}
      const ai=project(s.ax,s.ay);if(ai){ctx.save();ctx.translate(ai.x,ai.y);ctx.scale(ai.scale,ai.scale);ctx.fillStyle="#10151caa";ctx.beginPath();ctx.ellipse(0,24,24,6,0,0,7);ctx.fill();ctx.fillStyle="#202a36";ctx.fillRect(-13,0,26,48);ctx.fillStyle="#d1b69b";ctx.beginPath();ctx.arc(0,-10,17,0,7);ctx.fill();ctx.fillStyle="#bf4c41";ctx.fillRect(-19,10,38,12);ctx.fillStyle="#1b2532";ctx.fillRect(5,7,50,7);ctx.restore();ctx.fillStyle="#121a26";ctx.fillRect(ai.x-28,ai.y-42,56,5);ctx.fillStyle="#f06c63";ctx.fillRect(ai.x-28,ai.y-42,56*s.aiHp/100,5);}
      ctx.save();ctx.translate(W/2,H*.78);ctx.fillStyle="#233c65";ctx.beginPath();ctx.ellipse(-15,18,34,45,0,0,7);ctx.fill();ctx.fillStyle="#ebc9aa";ctx.beginPath();ctx.arc(-5,-19,17,0,7);ctx.fill();ctx.fillStyle="#202c39";ctx.fillRect(-20,-35,28,7);ctx.fillStyle="#9dec73";ctx.fillRect(5,-5,78,11);ctx.restore();
      ctx.strokeStyle="#efffb3";ctx.lineWidth=2;ctx.shadowColor="#d8ff76";ctx.shadowBlur=9;ctx.beginPath();ctx.arc(W/2,H*.57,10,0,7);ctx.moveTo(W/2-19,H*.57);ctx.lineTo(W/2-5,H*.57);ctx.moveTo(W/2+5,H*.57);ctx.lineTo(W/2+19,H*.57);ctx.moveTo(W/2,H*.57-19);ctx.lineTo(W/2,H*.57-5);ctx.moveTo(W/2,H*.57+5);ctx.lineTo(W/2,H*.57+19);ctx.stroke();ctx.shadowBlur=0;if(s.flash){ctx.fillStyle="rgba(255,65,50,.25)";ctx.fillRect(0,0,W,H);}if(s.status==="won"||s.status==="lost"){ctx.fillStyle="rgba(4,8,12,.7)";ctx.fillRect(0,0,W,H);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="800 42px Arial";ctx.fillText(s.status==="won"?"VICTORY ROYALE":"ELIMINATED",W/2,H/2);}
      raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);
  },[hud.status]);
  const aim=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(document.pointerLockElement===e.currentTarget){facing.current+=e.movementX*.012;}else{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;facing.current=Math.atan2(y-H*.57,x-W/2);}};
  const shoot=(e:React.PointerEvent<HTMLCanvasElement>)=>{e.currentTarget.requestPointerLock();aim(e);const s=state.current;if(s.status!=="playing"||s.shotCooldown>0)return;s.shotCooldown=13;const angle=Math.atan2(s.ay-s.py,s.ax-s.px),dist=Math.hypot(s.ax-s.px,s.ay-s.py);if(angleGap(angle,facing.current)<.13&&dist<900){s.aiHp-=22;sync();}};
  return <main className={styles.page}><section className={styles.game}><header><div><p>LONGSHOT · THIRD-PERSON VERSUS</p><h1>1V1 AI DUEL</h1></div><Link href="/sniper-game">← Target range</Link></header>{hud.status==="select"?<div className={styles.select}><p>Choose an arena</p><div>{maps.map((map,i)=><button key={map.name} onClick={()=>start(i)}><b>{map.name}</b><span>{map.note}</span><small>DROP IN →</small></button>)}</div></div>:<><div className={styles.hud}><span><small>YOUR HEALTH</small><b>{hud.playerHp} HP</b></span><span><small>OPPONENT</small><b>{hud.aiHp} HP</b></span><span><small>ARENA</small><b>{maps[hud.map].name}</b></span></div><canvas className={styles.canvas} ref={canvas} width={W} height={H} onPointerMove={aim} onPointerDown={shoot}/>{(hud.status==="won"||hud.status==="lost")&&<button className={styles.replay} onClick={()=>start(hud.map)}>DROP AGAIN</button>}</>}<footer><span><kbd>WASD</kbd> move <kbd>MOUSE</kbd> aim + fire</span><span>Click to lock your aim. Eliminate the AI before it eliminates you.</span></footer></section></main>;
}
