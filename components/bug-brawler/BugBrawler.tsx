"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadProgress, saveProgress } from "./progress";
import { getCurrentUsername } from "./accounts";

const W = 960, H = 560, WORLD_W = 2400, WORLD_H = 1600;
type EnemyKind = "Grubbin" | "Zippa" | "Silk" | "Formica" | "Lumen" | "Chomp" | "Roly" | "Skitters" | "Rex" | "Cicada" | "Queen";
type Enemy = { kind: EnemyKind; x: number; y: number; hp: number; max: number; speed: number; size: number; cash: number; hit: number; cooldown: number; snared?: number; revived?: boolean };
type Bullet = { x: number; y: number; dx: number; dy: number; life: number; damage: number; flame?: boolean; weapon: string };
type Effect = { x: number; y: number; life: number; max: number; weapon: string };
type PickupKind = "supply" | "medic" | "shield" | "overdrive" | "burst" | "dash";
type Pickup = { x: number; y: number; claimed: boolean; kind: PickupKind; pulse: number };
type ToolbarSlot = { kind: "shield" | "medkit" | "overdrive" | "burst" | "dash"; count: number } | null;
type Game = { player: { x: number; y: number; hp: number; cash: number; weapon: string; ammo: number; cooldown: number; hurt: number; shield: number; boost: number; speedBurst: number; rapidFire: number; webbed: number }; enemies: Enemy[]; bullets: Bullet[]; effects: Effect[]; pickups: Pickup[]; wave: number; map: number; clock: number; spawn: number; spawned: number; status: "playing" | "shop" | "won" | "lost"; notice: string; toolbar: ToolbarSlot[]; activeSlot: number; };

const maps = [
  { name: "OVERGROWN GARDEN", desc: "Tall grass slows every step", a: "#234d37", b: "#112b2a" },
  { name: "ANTHILL TUNNELS", desc: "Hold the chokepoint", a: "#713f2c", b: "#2e1924" },
  { name: "HIVE CLIFFS", desc: "Watch the wind and the wings", a: "#315377", b: "#172445" },
  { name: "COMPOST SWAMP", desc: "Mud and poison test your nerve", a: "#3a5034", b: "#1e2b24" },
  { name: "FIREFLY GROTTO", desc: "End the Queen's infestation", a: "#26345b", b: "#160f35" },
  { name: "CINDER MOSS", desc: "Smoldering spores sting the air", a: "#4a2d22", b: "#1a1310" },
  { name: "RUSTED CANOPY", desc: "Metal branches crackle underfoot", a: "#4a4d2f", b: "#261f1a" },
  { name: "MOONLIT REEF", desc: "Bioluminescent trails lure you deeper", a: "#23405b", b: "#102235" },
  { name: "SILK SWALE", desc: "Sticky threads choke the ground", a: "#4b3155", b: "#24162f" },
  { name: "DUSTBLADE DUNES", desc: "The horizon is full of razor grass", a: "#5a4f30", b: "#2d2413" },
];
const roster: Record<EnemyKind, { label: string; hp: number; speed: number; size: number; cash: number; color: string }> = {
  Grubbin: { label: "Grubbin the Tank", hp: 32, speed: .26, size: 20, cash: 18, color: "#ac6f3b" },
  Zippa: { label: "Zippa Waspwing", hp: 10, speed: .76, size: 12, cash: 7, color: "#ffc846" },
  Silk: { label: "Silk Weaver", hp: 18, speed: .43, size: 16, cash: 11, color: "#bc85d9" },
  Formica: { label: "Formica Raider", hp: 29, speed: .31, size: 19, cash: 17, color: "#ee7464" },
  Lumen: { label: "Lumen the Firefly", hp: 15, speed: .54, size: 14, cash: 10, color: "#e8f484" },
  Chomp: { label: "Chomp the Mantis", hp: 17, speed: .66, size: 15, cash: 14, color: "#8bc76c" },
  Roly: { label: "Roly the Pillbug", hp: 38, speed: .21, size: 21, cash: 20, color: "#7e88ad" },
  Skitters: { label: "Skitters", hp: 22, speed: .48, size: 16, cash: 12, color: "#b17242" },
  Rex: { label: "Dungbeetle Rex", hp: 28, speed: .34, size: 18, cash: 16, color: "#435f91" },
  Cicada: { label: "Cicada Screech", hp: 14, speed: .51, size: 14, cash: 8, color: "#61c9c7" },
  Queen: { label: "QUEEN FORMICA, ASCENDED", hp: 280, speed: .36, size: 38, cash: 200, color: "#ff596f" },
};
const shop = [
  { id: "newspaper", name: "Rolled Newspaper +3", cost: 0, stat: "3 DMG · fast melee", desc: "Starter issue. Surprisingly crisp." },
  { id: "zapper", name: "Bug Zapper Lance", cost: 300, stat: "7 DMG · chain shock", desc: "Electric arcs bite nearby pests." },
  { id: "sprayer", name: "Pesticide Sprayer", cost: 325, stat: "5 DMG · poison cone", desc: "A wide, merciless mist." },
  { id: "flame", name: "Anti-Roach Flamethrower", cost: 500, stat: "10 DMG · no revives", desc: "Burns through second chances." },
  { id: "net", name: "Net Cannon", cost: 200, stat: "2 DMG · snare", desc: "Roots targets for a clean follow-up." },
  { id: "grenade", name: "Repellent Grenade", cost: 250, stat: "14 DMG · blast", desc: "A heavy round with a toxic impact." },
  { id: "twinblades", name: "Flyswatter Twinblades", cost: 350, stat: "5 DMG · melee", desc: "Fast, close-range double strikes." },
  { id: "shotgun", name: "Chitin Shotgun", cost: 425, stat: "4×5 DMG · spread", desc: "A close-range answer to a packed swarm." },
  { id: "horn", name: "Sonic Repeller Horn", cost: 400, stat: "3 DMG · long range", desc: "A focused sound pulse that stuns the advance." },
  { id: "needle", name: "Chitin Needle Rifle", cost: 450, stat: "4 DMG · extreme range", desc: "Fast precision shots for priority targets." },
  { id: "cryo", name: "Cryo Repellent", cost: 475, stat: "6 DMG · freeze", desc: "Freezes a bug in place for a follow-up attack." },
  { id: "acid", name: "Acid Glob Launcher", cost: 525, stat: "9 DMG · corrosive", desc: "Heavy globs melt through tough carapace." },
  { id: "pulse", name: "Pulse Arc Rifle", cost: 575, stat: "6 DMG · bouncing bolts", desc: "Sharp arcs ricochet across the swarm." },
  { id: "whip", name: "Tangle Whip", cost: 550, stat: "8 DMG · whip lash", desc: "A brutal close-range line clearer." },
  { id: "launcher", name: "Mire Launcher", cost: 600, stat: "11 DMG · heavy impact", desc: "This one makes the ground tremble." },
  { id: "laser", name: "Solar Lancer", cost: 625, stat: "7 DMG · piercing beam", desc: "Cuts through armor like a blade." },
];
const pickupsFor = (map: number): Pickup[] => Array.from({ length: 6 }, (_, i) => { const kinds: PickupKind[] = ["supply", "medic", "shield", "overdrive", "burst", "dash"]; const kind = kinds[i % kinds.length]; const x = 260 + ((i * 347 + map * 131) % 1700); const y = 220 + ((i * 521 + map * 239) % 1120); return { x, y, claimed: false, kind, pulse: Math.random() * Math.PI * 2 }; });
const cameraFor = (x: number, y: number) => ({ x: Math.max(0, Math.min(WORLD_W - W, x - W / 2)), y: Math.max(0, Math.min(WORLD_H - H, y - H / 2)) });
const terrainSlow = (x: number, y: number, map: number) => ((Math.floor(x / 170) * 13 + Math.floor(y / 150) * 7 + map * 11) % 9 === 0 ? .62 : 1);
const ammoFor = (weapon: string) => weapon === "zapper" ? 45 : weapon === "sprayer" ? 70 : weapon === "flame" ? 85 : weapon === "net" ? 20 : weapon === "grenade" ? 16 : weapon === "shotgun" ? 30 : weapon === "horn" ? 12 : weapon === "needle" ? 50 : weapon === "cryo" ? 24 : weapon === "acid" ? 22 : weapon === "pulse" ? 40 : weapon === "whip" ? -1 : weapon === "launcher" ? 18 : weapon === "laser" ? 36 : weapon === "twinblades" ? -1 : -1;
const initial = (): Game => ({ player: { x: WORLD_W / 2, y: WORLD_H / 2, hp: 100, cash: 80, weapon: "newspaper", ammo: -1, cooldown: 0, hurt: 0, shield: 0, boost: 0, speedBurst: 0, rapidFire: 0, webbed: 0 }, enemies: [], bullets: [], effects: [], pickups: pickupsFor(0), wave: 1, map: 0, clock: 0, spawn: 20, spawned: 0, status: "playing", notice: "WAVE 1 · CLEAR THE GARDEN", toolbar: [null, null, null, null, null, null], activeSlot: 0 });

const toolbarIcons: Record<string, { icon: string; label: string; color: string }> = {
  shield: { icon: "🛡", label: "Shield", color: "#78d4ff" },
  medkit: { icon: "✚", label: "Med Kit", color: "#ff8f7b" },
  overdrive: { icon: "⚡", label: "Overdrive", color: "#ffc860" },
  burst: { icon: "🔥", label: "Burst", color: "#ffe594" },
  dash: { icon: "💨", label: "Dash", color: "#b58eff" },
};

export default function Home() {
  const router = useRouter();
  const [username] = useState(() => getCurrentUsername());
  const canvas = useRef<HTMLCanvasElement>(null); const keys = useRef<Record<string, boolean>>({}); const lookAngle = useRef(-Math.PI / 2); const aim = useRef({ x: WORLD_W / 2, y: WORLD_H / 2, fire: false }); const aimDot = useRef({ x: W / 2, y: H * .6 }); const game = useRef<Game>(initial());
  const [screen, setScreen] = useState({ cash: 80, hp: 100, ammo: -1, wave: 1, map: 0, status: "playing" as Game["status"], weapon: "newspaper", notice: "WAVE 1 · CLEAR THE GARDEN", shield: 0, toolbar: [null, null, null, null, null, null] as ToolbarSlot[], activeSlot: 0 });
  const [tutorialState, setTutorialState] = useState<"open" | "complete">(() =>
    loadProgress().tutorialCompleted ? "complete" : "open"
  );
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (!username) router.replace("/login");
  }, [router, username]);

  const finishTutorial = () => {
    const progress = loadProgress();
    saveProgress({ ...progress, tutorialCompleted: true });
    setTutorialState("complete");
    router.push("/");
  };
  const useToolbarItem = useCallback((slot: number) => {
    const g = game.current;
    if (g.status !== "playing") return;
    if (slot === 0) {
      g.activeSlot = 0;
      g.notice = `${shop.find(x => x.id === g.player.weapon)?.name ?? "Weapon"} selected`;
      sync();
      return;
    }
    const item = g.toolbar[slot];
    if (!item || item.count <= 0) return;
    g.activeSlot = slot;
    if (item.kind === "shield") {
      const gained = Math.min(30, 99 - g.player.shield);
      g.player.shield += gained;
      g.notice = `SHIELD ACTIVATED · +${gained} BARRIER`;
    } else if (item.kind === "medkit") {
      const healed = Math.min(35, 100 - g.player.hp);
      g.player.hp += healed;
      g.notice = `MED KIT USED · +${Math.ceil(healed)} HP`;
    } else if (item.kind === "overdrive") {
      g.player.boost = 240;
      g.notice = "OVERDRIVE ACTIVATED · DAMAGE BOOST";
    } else if (item.kind === "burst") {
      if (g.player.ammo >= 0) g.player.ammo += 18;
      g.player.rapidFire = 220;
      g.notice = "BURST ACTIVATED · RAPID FIRE + AMMO";
    } else if (item.kind === "dash") {
      g.player.speedBurst = 220;
      g.notice = "DASH ACTIVATED · SPEED BOOST";
    }
    item.count--;
    if (item.count <= 0) g.toolbar[slot] = null;
    sync();
  }, []);
  const sync = useCallback(() => { const g = game.current; setScreen({ cash: g.player.cash, hp: Math.ceil(g.player.hp), ammo: g.player.ammo, wave: g.wave, map: g.map, status: g.status, weapon: g.player.weapon, notice: g.notice, shield: Math.ceil(g.player.shield), toolbar: [...g.toolbar], activeSlot: g.activeSlot }); }, []);
  const restart = useCallback(() => { game.current = initial(); lookAngle.current = -Math.PI / 2; sync(); }, [sync]);
  const nextWave = useCallback(() => { const g = game.current; const previousMap = g.map; g.status = "playing"; g.wave++; g.map = (g.wave - 1) % maps.length; g.spawn = 20; g.spawned = 0; g.pickups = pickupsFor(g.map); if (g.map !== previousMap) { g.player.x = WORLD_W / 2; g.player.y = WORLD_H / 2; } g.notice = g.wave % 10 === 0 ? "THE QUEEN IS COMING" : `WAVE ${g.wave} · ${maps[g.map].name}`; sync(); }, [sync]);
  const buy = (id: string, cost: number) => { const g = game.current; if (g.player.cash < cost) return; if (g.player.weapon === id && cost > 0) { g.player.cash -= cost; g.player.ammo += Math.ceil(ammoFor(id) * .5); g.notice = `${shop.find(x => x.id === id)?.name.toUpperCase()} AMMO REFILLED`; } else { g.player.cash -= cost; g.player.weapon = id; g.player.ammo = ammoFor(id); g.notice = `${shop.find(x => x.id === id)?.name.toUpperCase()} EQUIPPED`; } sync(); };

  useEffect(() => { const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault(); }; const up = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false; addEventListener("keydown", down); addEventListener("keyup", up); return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); }; }, []);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return; let raf = 0;
    const spawn = (kind?: EnemyKind) => { const g = game.current; const available: EnemyKind[] = ["Grubbin", "Zippa", "Silk", "Formica", "Lumen", "Chomp", "Roly", "Skitters", "Rex", "Cicada"]; const k = kind ?? available[Math.floor(Math.random() * Math.min(available.length, 4 + Math.floor(g.wave / 3)))]; const r = roster[k]; const angle = Math.random() * Math.PI * 2, distance = 500 + Math.random() * 180; const p = { x: Math.max(25, Math.min(WORLD_W - 25, g.player.x + Math.cos(angle) * distance)), y: Math.max(25, Math.min(WORLD_H - 25, g.player.y + Math.sin(angle) * distance)) }; const scale = 1 + Math.floor((g.wave - 1) / 3) * .12; g.enemies.push({ kind: k, ...p, hp: r.hp * scale, max: r.hp * scale, speed: r.speed + Math.min(0.25, g.wave * 0.008), size: r.size + Math.min(4, Math.floor(g.wave / 8)), cash: r.cash + Math.floor(g.wave / 3), hit: 0, cooldown: 50 }); };
    const frame = () => { const g = game.current, p = g.player, m = maps[g.map]; g.clock++;
      if (g.status === "playing") {
        const quickTurn = (keys.current.e ? 1 : 0) - (keys.current.q ? 1 : 0); if (keys.current.f) { lookAngle.current += Math.PI; keys.current.f = false; } lookAngle.current += quickTurn * .1; const facing = lookAngle.current; aim.current.x = p.x + Math.cos(facing) * 600; aim.current.y = p.y + Math.sin(facing) * 600;
        const forward = (keys.current.w || keys.current.arrowup ? 1 : 0) - (keys.current.s || keys.current.arrowdown ? 1 : 0), strafe = (keys.current.d || keys.current.arrowright ? 1 : 0) - (keys.current.a || keys.current.arrowleft ? 1 : 0), mag = Math.hypot(forward, strafe) || 1, speed = 3.3 * terrainSlow(p.x, p.y, g.map) * (p.speedBurst > 0 ? 1.5 : 1); p.x = Math.max(25, Math.min(WORLD_W - 25, p.x + (Math.cos(facing) * forward - Math.sin(facing) * strafe) / mag * speed)); p.y = Math.max(25, Math.min(WORLD_H - 25, p.y + (Math.sin(facing) * forward + Math.cos(facing) * strafe) / mag * speed)); aim.current.x = p.x + Math.cos(facing) * 600; aim.current.y = p.y + Math.sin(facing) * 600;
        p.cooldown--; p.hurt = Math.max(0, p.hurt - 1); p.boost = Math.max(0, p.boost - 1); p.speedBurst = Math.max(0, p.speedBurst - 1); p.rapidFire = Math.max(0, p.rapidFire - 1); p.webbed = Math.max(0, p.webbed - 1); const weapon = p.weapon === "flame" ? { rate: 4, damage: 10, flame: true, speed: 5.5, life: 15 } : p.weapon === "zapper" ? { rate: 12, damage: 7, flame: false, speed: 9, life: 48 } : p.weapon === "sprayer" ? { rate: 8, damage: 5, flame: false, speed: 9, life: 18 } : p.weapon === "net" ? { rate: 20, damage: 2, flame: false, speed: 7, life: 38 } : p.weapon === "grenade" ? { rate: 26, damage: 14, flame: false, speed: 5, life: 36 } : p.weapon === "shotgun" ? { rate: 22, damage: 4, flame: false, speed: 10, life: 22 } : p.weapon === "horn" ? { rate: 30, damage: 3, flame: false, speed: 12, life: 60 } : p.weapon === "needle" ? { rate: 6, damage: 4, flame: false, speed: 13, life: 72 } : p.weapon === "cryo" ? { rate: 16, damage: 6, flame: false, speed: 10, life: 44 } : p.weapon === "acid" ? { rate: 16, damage: 9, flame: false, speed: 6, life: 35 } : p.weapon === "pulse" ? { rate: 18, damage: 6, flame: false, speed: 11, life: 50 } : p.weapon === "whip" ? { rate: 10, damage: 8, flame: false, speed: 13, life: 12 } : p.weapon === "launcher" ? { rate: 24, damage: 11, flame: false, speed: 6, life: 44 } : p.weapon === "laser" ? { rate: 14, damage: 7, flame: false, speed: 18, life: 40 } : p.weapon === "twinblades" ? { rate: 5, damage: 5, flame: false, speed: 11, life: 7 } : { rate: 9, damage: 4, flame: false, speed: 9, life: 48 };
        const fireRate = p.rapidFire > 0 ? Math.max(2, Math.floor(weapon.rate * .7)) : weapon.rate; const powerMod = p.boost > 0 ? 1.35 : 1; if ((aim.current.fire || keys.current[" "]) && p.cooldown <= 0 && p.ammo !== 0) { const a = Math.atan2(aim.current.y - p.y, aim.current.x - p.x), spread = p.weapon === "sprayer" ? .12 : p.weapon === "twinblades" ? .09 : p.weapon === "shotgun" ? .22 : p.weapon === "laser" ? .03 : 0, offsets = p.weapon === "shotgun" ? [-spread*2,-spread,0,spread,spread*2] : p.weapon === "pulse" ? [-0.08,0,0.08] : spread ? [-spread,spread] : [0]; for (const offset of offsets) { const damage = (offsets.length > 1 ? weapon.damage * .8 : weapon.damage) * powerMod; g.bullets.push({ x: p.x + Math.cos(a) * 23, y: p.y + Math.sin(a) * 23, dx: Math.cos(a + offset) * weapon.speed, dy: Math.sin(a + offset) * weapon.speed, life: weapon.life, damage, flame: weapon.flame, weapon: p.weapon }); } if (p.ammo > 0) p.ammo--; p.cooldown = fireRate; } else if ((aim.current.fire || keys.current[" "]) && p.ammo === 0) { g.notice = "OUT OF AMMO · FIND A SUPPLY CRATE OR REFILL AT THE SHOP"; }
        const target = g.wave % 10 === 0 ? 1 : 8 + g.wave * 3; if (g.spawned < target && --g.spawn <= 0) { spawn(g.wave % 10 === 0 ? "Queen" : undefined); g.spawned++; g.spawn = g.wave % 10 === 0 ? 9999 : 24 + Math.random() * 35; }
        g.bullets = g.bullets.filter(b => { b.x += b.dx; b.y += b.dy; return --b.life > 0 && b.x > -20 && b.x < WORLD_W + 20 && b.y > -20 && b.y < WORLD_H + 20; }); g.effects = g.effects.filter(effect => --effect.life > 0);
        g.pickups.forEach(pickup => { if (!pickup.claimed && Math.hypot(p.x - pickup.x, p.y - pickup.y) < 32) { pickup.claimed = true; switch (pickup.kind) { case "supply": p.cash += 20; if (p.ammo >= 0) p.ammo += Math.ceil(ammoFor(p.weapon) * .35); g.notice = `SUPPLY BOX OPENED · +$20${p.ammo >= 0 ? " · AMMO RESTORED" : ""}`; break; case "medic": { // Store in toolbar slot 3 (index 2)
            const slot = g.toolbar[2];
            if (slot && slot.kind === "medkit") { slot.count = Math.min(slot.count + 1, 5); }
            else if (!g.toolbar[2]) { g.toolbar[2] = { kind: "medkit", count: 1 }; }
            else { p.hp = Math.min(100, p.hp + 20); g.notice = "MED KIT STORED · +20 HP DIRECT"; }
            if (!g.notice.startsWith("MED KIT")) g.notice = "MED KIT STORED (PRESS 3)";
          } break; case "shield": { // Store in toolbar slot 2 (index 1)
            const slot = g.toolbar[1];
            if (slot && slot.kind === "shield") { slot.count = Math.min(slot.count + 1, 3); }
            else if (!g.toolbar[1]) { g.toolbar[1] = { kind: "shield", count: 1 }; }
            else { p.shield = Math.min(99, p.shield + 20); g.notice = "SHIELD STORED · +20 BARRIER DIRECT"; }
            if (!g.notice.startsWith("SHIELD")) g.notice = "SHIELD STORED (PRESS 2)";
          } break; case "overdrive": case "burst": case "dash": { // Store in slots 4-6 (indices 3-5)
            const slotIdx = g.toolbar.findIndex((s, i) => i >= 3 && i <= 5 && (s?.kind === pickup.kind || !s));
            if (slotIdx >= 3 && slotIdx <= 5) {
              const slot = g.toolbar[slotIdx];
              if (slot && slot.kind === pickup.kind) { slot.count = Math.min(slot.count + 1, 3); }
              else { g.toolbar[slotIdx] = { kind: pickup.kind as "overdrive" | "burst" | "dash", count: 1 }; }
              g.notice = `${pickup.kind.toUpperCase()} STORED (PRESS ${slotIdx + 1})`;
            } else {
              // All slots full, activate directly
              if (pickup.kind === "overdrive") { p.boost = 240; g.notice = "OVERDRIVE ACTIVATED"; }
              else if (pickup.kind === "burst") { if (p.ammo >= 0) p.ammo += 16; p.rapidFire = 220; g.notice = "BURST ACTIVATED"; }
              else if (pickup.kind === "dash") { p.speedBurst = 220; g.notice = "DASH ACTIVATED"; }
            }
          } break; } } });
        g.enemies = g.enemies.filter(e => { const a = Math.atan2(p.y - e.y, p.x - e.x); const lunge = e.kind === "Zippa" && e.cooldown-- < 0 ? 2.1 : 1, snare = e.snared ? .18 : 1; if (e.kind === "Zippa" && e.cooldown < -20) e.cooldown = 55; if (e.kind === "Lumen" && g.clock % 60 === 0) { const d = Math.atan2(p.y - e.y, p.x - e.x); g.bullets.push({ x: e.x, y: e.y, dx: Math.cos(d) * 7.5, dy: Math.sin(d) * 7.5, life: 35, damage: 5, flame: false, weapon: "pulse" }); } if (e.kind === "Silk" && g.clock % 80 === 0) { p.webbed = 45; } if (e.kind === "Formica" && g.clock % 90 === 0) { e.x += Math.cos(a) * 35; e.y += Math.sin(a) * 35; } e.x += Math.cos(a) * e.speed * lunge * snare; e.y += Math.sin(a) * e.speed * lunge * snare; e.hit = Math.max(0, e.hit - 1); e.snared = Math.max(0, (e.snared ?? 0) - 1); let alive = true; g.bullets = g.bullets.filter(b => { if (Math.hypot(b.x-e.x, b.y-e.y) < e.size + 6) { const damage = b.damage * (e.kind === "Roly" && e.hit === 0 ? .6 : 1); e.hp -= damage; if (b.weapon === "net") e.snared = 120; if (b.weapon === "horn") e.snared = 70; if (b.weapon === "cryo") e.snared = 150; e.hit = 4; g.effects.push({ x: e.x, y: e.y, life: b.weapon === "grenade" ? 18 : 12, max: b.weapon === "grenade" ? 18 : 12, weapon: b.weapon }); if (b.weapon === "grenade") { g.enemies.forEach(other => { const distance = Math.hypot(other.x - e.x, other.y - e.y); if (other !== e && distance < 145) { const splash = Math.ceil(12 * (1 - distance / 170)); other.hp -= splash; other.hit = 8; } }); } e.x -= Math.cos(a) * 11; e.y -= Math.sin(a) * 11; if (e.hp <= 0) { if (e.kind === "Skitters" && !e.revived && !b.flame) { e.revived = true; e.hp = e.max * .25; } else { p.cash += e.cash; alive = false; } } return b.weapon === "grenade" ? false : !b.flame; } return true; }); if (Math.hypot(p.x-e.x, p.y-e.y) < e.size + 16 && p.hurt === 0) { const hit = e.kind === "Queen" ? 12 : 6; if (p.shield > 0) { p.shield = Math.max(0, p.shield - hit); } else { p.hp -= hit; } p.hurt = 34; e.x -= Math.cos(a) * 24; e.y -= Math.sin(a) * 24; } return alive; });
        g.enemies = g.enemies.filter(e => { if (e.hp > 0) return true; p.cash += e.cash; return false; });
        if (p.hp <= 0) { const progress = loadProgress(); p.hp = 0; saveProgress({ ...progress, levelsSurvived: Math.max(progress.levelsSurvived, g.wave - 1) }); g.status = "lost"; g.notice = "THE SWARM OVERRAN THE BLOCK"; sync(); } else if (g.enemies.length === 0 && g.spawned === target) { p.cash += 35 + g.wave * 8; g.status = "shop"; g.notice = `WAVE ${g.wave} CLEAR · +$${35 + g.wave * 8} BONUS`; sync(); }
        if (g.clock % 10 === 0) sync();
      }
      const thirdPerson = true;
      if (thirdPerson) {
        const facing = Math.atan2(aim.current.y - p.y, aim.current.x - p.x), horizon = H * .31;
        const project = (x: number, y: number) => { const dx=x-p.x, dy=y-p.y, front=dx*Math.cos(facing)+dy*Math.sin(facing), side=-dx*Math.sin(facing)+dy*Math.cos(facing); if(front < -35) return null; const depth=Math.max(85,front+90), scale=Math.min(2.5,265/depth); return { x:W/2+side*scale, y:horizon+25000/depth, scale, front }; };
        const sky=ctx.createLinearGradient(0,0,0,horizon); sky.addColorStop(0,"#31547c");sky.addColorStop(.62,"#95b9cf");sky.addColorStop(1,m.a);ctx.fillStyle=sky;ctx.fillRect(0,0,W,horizon);
        const mountains = (base: number, peak: number, color: string, shift: number) => { ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,base);for(let x=-120;x<=W+150;x+=105){const h=peak+((x+shift)%210+210)%210*.14;ctx.lineTo(x+53,base-h);ctx.lineTo(x+105,base);}ctx.lineTo(W,base);ctx.closePath();ctx.fill(); }; mountains(horizon+28,72,"#526e7f",19);mountains(horizon+44,49,"#385968",83);mountains(horizon+57,30,"#274554",147);
        ctx.fillStyle=m.b;ctx.fillRect(0,horizon,W,H-horizon);
        ctx.strokeStyle="#b8e9d422";ctx.lineWidth=1;for(let d=90;d<1400;d+=85){const y=horizon+25000/(d+90);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let side=-1100;side<=1100;side+=120){const a=project(p.x+Math.cos(facing)*1200-Math.sin(facing)*side,p.y+Math.sin(facing)*1200+Math.cos(facing)*side),b=project(p.x-Math.sin(facing)*side,p.y+Math.cos(facing)*side);if(a&&b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
        for(let gx=120;gx<WORLD_W;gx+=180) for(let gy=90;gy<WORLD_H;gy+=170){if((gx*7+gy*3+g.map*17)%11>2)continue;const q=project(gx,gy);if(!q||q.front>900)continue;ctx.save();ctx.translate(q.x,q.y);ctx.scale(q.scale,q.scale);if(g.map===0){ctx.fillStyle="#4f341e";ctx.fillRect(-4,-18,8,22);ctx.fillStyle="#285333";ctx.beginPath();ctx.arc(0,-27,18,0,7);ctx.arc(-10,-17,12,0,7);ctx.arc(11,-16,12,0,7);ctx.fill();}else if(g.map===1){ctx.fillStyle="#5d3529";ctx.beginPath();ctx.arc(0,-6,18,0,7);ctx.fill();ctx.strokeStyle="#aa6742";ctx.beginPath();ctx.moveTo(-13,-10);ctx.lineTo(14,-2);ctx.lineTo(-9,8);ctx.stroke();}else if(g.map===2){ctx.fillStyle="#664c38";ctx.fillRect(-4,-28,8,30);ctx.fillStyle="#2d5c49";ctx.beginPath();ctx.moveTo(0,-58);ctx.lineTo(-20,-18);ctx.lineTo(20,-18);ctx.closePath();ctx.fill();}else if(g.map===3){ctx.fillStyle="#4c6638";ctx.beginPath();ctx.ellipse(0,0,24,10,0,0,7);ctx.fill();ctx.fillStyle="#7f9d48";ctx.beginPath();ctx.arc(-10,-8,11,0,7);ctx.arc(10,-8,11,0,7);ctx.fill();}else{ctx.fillStyle="#3bd7d066";ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(-12,0);ctx.lineTo(0,8);ctx.lineTo(12,0);ctx.closePath();ctx.fill();ctx.strokeStyle="#82fff2";ctx.stroke();}ctx.restore();}
        g.pickups.forEach(pickup=>{const q=project(pickup.x,pickup.y);if(q&&!pickup.claimed){const pulse=0.85+Math.sin(g.clock*.12+pickup.pulse)*.15;const palette=pickup.kind==="supply"?{face:"#4b7a2b",top:"#8fd94f",side:"#2b4519",accent:"#fef6a9"}:pickup.kind==="medic"?{face:"#8d3d31",top:"#ff8f7b",side:"#5c241f",accent:"#fff1e9"}:pickup.kind==="shield"?{face:"#2b4d7c",top:"#78d4ff",side:"#16324f",accent:"#e5faff"}:pickup.kind==="overdrive"?{face:"#7f4b14",top:"#ffc860",side:"#50310d",accent:"#fff8de"}:pickup.kind==="burst"?{face:"#6d5620",top:"#ffe594",side:"#403311",accent:"#fff7d5"}:{face:"#4a2e73",top:"#b58eff",side:"#2e1854",accent:"#f6ecff"};ctx.save();ctx.translate(q.x,q.y);ctx.scale(q.scale,q.scale);ctx.globalAlpha=1;ctx.fillStyle="#0f1119";ctx.beginPath();ctx.ellipse(0,24,18,8,0,0,Math.PI*2);ctx.fill();ctx.translate(0,-8*pulse);ctx.beginPath();ctx.moveTo(-16,-10);ctx.lineTo(16,-10);ctx.lineTo(20,-2);ctx.lineTo(-12,-2);ctx.closePath();ctx.fillStyle=palette.top;ctx.fill();ctx.beginPath();ctx.moveTo(-16,-10);ctx.lineTo(-16,18);ctx.lineTo(16,18);ctx.lineTo(16,-10);ctx.closePath();ctx.fillStyle=palette.face;ctx.fill();ctx.beginPath();ctx.moveTo(16,-10);ctx.lineTo(20,-2);ctx.lineTo(20,26);ctx.lineTo(16,18);ctx.closePath();ctx.fillStyle=palette.side;ctx.fill();ctx.strokeStyle="#f6f7ff";ctx.lineWidth=1.2;ctx.strokeRect(-16,-10,32,28);ctx.stroke();ctx.fillStyle=palette.accent;ctx.beginPath();ctx.arc(0,3,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#18202d";ctx.font="bold 8px Arial";ctx.textAlign="center";ctx.fillText(pickup.kind.toUpperCase().slice(0,3),0,-14);ctx.restore();}});
        g.effects.forEach(effect=>{const q=project(effect.x,effect.y);if(!q)return;const t=1-effect.life/effect.max, color=effect.weapon==="zapper"?"#8cf7ff":effect.weapon==="sprayer"?"#9dff68":effect.weapon==="net"?"#7de6ff":effect.weapon==="grenade"?"#c7ff77":effect.weapon==="flame"?"#ff8a42":"#fff0a2";ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=10;if(effect.weapon==="zapper"){ctx.beginPath();ctx.moveTo(q.x-15,q.y+8);ctx.lineTo(q.x-5,q.y-10);ctx.lineTo(q.x+3,q.y+5);ctx.lineTo(q.x+15,q.y-9);ctx.stroke();}else{ctx.beginPath();ctx.arc(q.x,q.y,8+t*(effect.weapon==="grenade"?42:24),0,Math.PI*2);ctx.stroke();}ctx.restore();});
        g.bullets.forEach(b=>{const q=project(b.x,b.y);if(!q)return;const color=b.weapon==="zapper"?"#8cf7ff":b.weapon==="sprayer"?"#9dff68":b.weapon==="net"?"#7de6ff":b.weapon==="grenade"?"#c7ff77":b.weapon==="pulse"?"#8b9dff":b.weapon==="whip"?"#ffb2c5":b.weapon==="launcher"?"#ff8c42":b.weapon==="laser"?"#ffe27a":b.flame?"#ff8651":"#f4ff8a";ctx.save();ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;if(b.weapon==="zapper"){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x-15*q.scale,q.y+4);ctx.lineTo(q.x-5*q.scale,q.y-5);ctx.lineTo(q.x+4*q.scale,q.y+4);ctx.lineTo(q.x+13*q.scale,q.y-3);ctx.stroke();}else if(b.weapon==="net"){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,Math.max(5,10*q.scale),0,Math.PI*2);ctx.moveTo(q.x-8,q.y-8);ctx.lineTo(q.x+8,q.y+8);ctx.moveTo(q.x+8,q.y-8);ctx.lineTo(q.x-8,q.y+8);ctx.stroke();}else if(b.weapon==="grenade"){ctx.beginPath();ctx.arc(q.x,q.y,Math.max(4,8*q.scale),0,Math.PI*2);ctx.fill();ctx.fillStyle="#506b35";ctx.beginPath();ctx.arc(q.x-2,q.y-2,Math.max(2,3*q.scale),0,Math.PI*2);ctx.fill();}else if(b.weapon==="sprayer"){ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(q.x,q.y,Math.max(3,7*q.scale),0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(q.x+5,q.y-3,Math.max(2,3*q.scale),0,Math.PI*2);ctx.fill();}else if(b.weapon==="pulse"){ctx.strokeStyle=color;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(q.x-10*q.scale,q.y);ctx.lineTo(q.x-4*q.scale,q.y-4*q.scale);ctx.lineTo(q.x+4*q.scale,q.y+4*q.scale);ctx.lineTo(q.x+10*q.scale,q.y);ctx.stroke();}else if(b.weapon==="whip"){ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(q.x-10*q.scale,q.y-6*q.scale);ctx.quadraticCurveTo(q.x,q.y, q.x+10*q.scale,q.y+6*q.scale);ctx.stroke();}else if(b.weapon==="launcher"){ctx.beginPath();ctx.arc(q.x,q.y,Math.max(5,8*q.scale),0,Math.PI*2);ctx.fill();ctx.fillStyle="#30130b";ctx.beginPath();ctx.arc(q.x-2,q.y-2,Math.max(2,3*q.scale),0,Math.PI*2);ctx.fill();}else if(b.weapon==="laser"){ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(q.x-12*q.scale,q.y);ctx.lineTo(q.x+12*q.scale,q.y);ctx.stroke();}else if(b.flame){ctx.beginPath();ctx.arc(q.x,q.y,Math.max(4,9*q.scale),0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffe38a";ctx.beginPath();ctx.arc(q.x-2,q.y+2,Math.max(2,4*q.scale),0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.arc(q.x,q.y,Math.max(2,4*q.scale),0,Math.PI*2);ctx.fill();}ctx.restore();});ctx.shadowBlur=0;
        g.enemies.slice().sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y)).forEach(e=>{const q=project(e.x,e.y);if(!q)return;const r=roster[e.kind], wing=["Zippa","Lumen","Cicada"].includes(e.kind), shell=["Grubbin","Roly","Rex"].includes(e.kind), bob=wing?Math.sin(g.clock*.34+e.x)*3:Math.sin(g.clock*.11+e.y)*.9;ctx.fillStyle="#0c1415a0";ctx.beginPath();ctx.ellipse(q.x,q.y+e.size*q.scale*.72,e.size*q.scale*.9,e.size*q.scale*.24,0,0,7);ctx.fill();ctx.save();ctx.translate(q.x,q.y+bob*q.scale);ctx.scale(q.scale,q.scale);ctx.strokeStyle="#241d21";ctx.lineWidth=2;
          for(const n of[-1,1])for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-e.size*.2,n*4);ctx.lineTo(-e.size*.48+i*e.size*.22,n*(e.size*.8));ctx.lineTo(e.size*.02+i*e.size*.12,n*(e.size*.96));ctx.stroke();}
          if(wing){ctx.fillStyle="#d8efff88";ctx.beginPath();ctx.ellipse(-e.size*.32,-e.size*.7,e.size*.82,e.size*.22,-.3,0,7);ctx.ellipse(-e.size*.32,e.size*.7,e.size*.82,e.size*.22,.3,0,7);ctx.fill();ctx.strokeStyle="#8aaeba";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-e.size*.8,-e.size*.7);ctx.lineTo(e.size*.1,-e.size*.58);ctx.moveTo(-e.size*.8,e.size*.7);ctx.lineTo(e.size*.1,e.size*.58);ctx.stroke();}
          ctx.fillStyle=e.hit?"#fff":r.color;ctx.beginPath();ctx.ellipse(-e.size*.1,0,e.size*.82,e.size*.61,0,0,7);ctx.fill();if(shell){ctx.strokeStyle="#302a35";ctx.lineWidth=1.5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(-e.size*.16,0,e.size*(.35+i*.08),-1.05,1.05);ctx.stroke();}}if(e.kind==="Silk"){ctx.fillStyle="#4c3158";ctx.beginPath();ctx.arc(-e.size*.5,0,e.size*.28,0,7);ctx.fill();}if(e.kind==="Chomp"){ctx.strokeStyle="#d4f29d";ctx.lineWidth=3;for(const n of[-1,1]){ctx.beginPath();ctx.moveTo(e.size*.35,n*5);ctx.lineTo(e.size*.92,n*e.size*.58);ctx.stroke();}}
          ctx.fillStyle="#201a24";ctx.beginPath();ctx.ellipse(e.size*.52,0,e.size*.38,e.size*.4,0,0,7);ctx.fill();ctx.strokeStyle="#251d23";ctx.lineWidth=1.5;for(const n of[-1,1]){ctx.beginPath();ctx.moveTo(e.size*.7,n*4);ctx.quadraticCurveTo(e.size*1.05,n*e.size*.38,e.size*1.18,n*e.size*.72);ctx.stroke();}ctx.fillStyle="#f4eed0";ctx.beginPath();ctx.arc(e.size*.57,-4,2,0,7);ctx.arc(e.size*.57,4,2,0,7);ctx.fill();ctx.restore();if(e.kind==="Queen"||e.hp<e.max){ctx.fillStyle="#10172a";ctx.fillRect(q.x-e.size*q.scale,q.y-e.size*q.scale-10,e.size*q.scale*2,4);ctx.fillStyle="#ff6f73";ctx.fillRect(q.x-e.size*q.scale,q.y-e.size*q.scale-10,e.size*q.scale*2*(e.hp/e.max),4);}});
        const target = project(p.x + Math.cos(facing) * 720, p.y + Math.sin(facing) * 720) ?? { x: W / 2, y: horizon + 24, scale: 1, front: 720 };
        ctx.save();ctx.strokeStyle="#edff9fbb";ctx.lineWidth=1.5;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(W/2+62,H*.775);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#edff9f";ctx.shadowColor="#d8ff76";ctx.shadowBlur=11;ctx.beginPath();ctx.arc(target.x,target.y,4,0,Math.PI*2);ctx.fill();ctx.restore();ctx.shadowBlur=0;
        ctx.save();ctx.translate(W/2,H*.78);ctx.globalAlpha=p.hurt>0&&g.clock%6<3?.45:1;ctx.fillStyle="#294e99";ctx.beginPath();ctx.ellipse(-18,12,32,42,0,0,7);ctx.fill();ctx.fillStyle="#fbf7de";ctx.beginPath();ctx.arc(-5,-19,17,0,7);ctx.fill();ctx.fillStyle="#17213d";ctx.fillRect(-19,-35,28,7);ctx.fillStyle="#b9ff78";ctx.rotate((aim.current.x-p.x)/1200);ctx.fillRect(7,-6,72,12);ctx.fillStyle="#deff7c";ctx.fillRect(70,-3,13,6);ctx.restore();
        ctx.fillStyle="#ffffff3b";ctx.fillRect(0,horizon-1,W,2);ctx.fillStyle="#d8ff76";ctx.font="800 10px Arial";ctx.textAlign="center";ctx.fillText("THIRD-PERSON EXPEDITION VIEW",W/2,horizon-13);
        ctx.save();ctx.translate(target.x,target.y);ctx.strokeStyle="#efffb3";ctx.lineWidth=2;ctx.shadowColor="#d8ff76";ctx.shadowBlur=8;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(-5,0);ctx.moveTo(5,0);ctx.lineTo(15,0);ctx.moveTo(0,-15);ctx.lineTo(0,-5);ctx.moveTo(0,5);ctx.lineTo(0,15);ctx.stroke();ctx.restore();ctx.shadowBlur=0;
      } else {
      const cam = cameraFor(p.x, p.y), bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, m.a); bg.addColorStop(1, m.b); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let tx = Math.floor(cam.x / 120) * 120; tx < cam.x + W + 120; tx += 120) for (let ty = Math.floor(cam.y / 120) * 120; ty < cam.y + H + 120; ty += 120) { const slow = terrainSlow(tx + 50, ty + 50, g.map) < 1, seed = (tx / 120 * 17 + ty / 120 * 31 + g.map * 19) % 7, x = tx - cam.x, y = ty - cam.y; ctx.fillStyle = slow ? (g.map === 3 ? "#465330" : "#315842") : "#ffffff08"; ctx.fillRect(x + 2, y + 2, 116, 116); if (seed === 0 || seed === 3) { ctx.fillStyle = g.map === 1 ? "#3c1f1a" : "#183426"; ctx.beginPath();ctx.arc(x + 28 + (seed * 11), y + 36 + (seed * 7), 13 + seed, 0, Math.PI * 2);ctx.fill();ctx.fillStyle = g.map === 2 ? "#9fc5d055" : "#74b75b75";ctx.beginPath();ctx.arc(x + 28 + (seed * 11), y + 29 + (seed * 7), 16 + seed, 0, Math.PI * 2);ctx.fill(); } }
      ctx.strokeStyle = "#ffffff13";ctx.lineWidth=2;ctx.strokeRect(-cam.x + 8, -cam.y + 8, WORLD_W - 16, WORLD_H - 16);
      ctx.save();ctx.translate(-cam.x, -cam.y);
      g.pickups.forEach(pickup => { if (!pickup.claimed) { const palette=pickup.kind==="supply"?{face:"#4b7a2b",top:"#8fd94f",side:"#2b4519",accent:"#fef6a9"}:pickup.kind==="medic"?{face:"#8d3d31",top:"#ff8f7b",side:"#5c241f",accent:"#fff1e9"}:pickup.kind==="shield"?{face:"#2b4d7c",top:"#78d4ff",side:"#16324f",accent:"#e5faff"}:pickup.kind==="overdrive"?{face:"#7f4b14",top:"#ffc860",side:"#50310d",accent:"#fff8de"}:pickup.kind==="burst"?{face:"#6d5620",top:"#ffe594",side:"#403311",accent:"#fff7d5"}:{face:"#4a2e73",top:"#b58eff",side:"#2e1854",accent:"#f6ecff"}; ctx.save(); ctx.translate(pickup.x,pickup.y); const bob=Math.sin(g.clock*.12+pickup.pulse)*2; ctx.translate(0,bob); ctx.fillStyle="#10141f"; ctx.beginPath(); ctx.ellipse(0,18,18,7,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=palette.side; ctx.beginPath(); ctx.moveTo(-12,-8); ctx.lineTo(12,-8); ctx.lineTo(16,0); ctx.lineTo(16,14); ctx.lineTo(-12,14); ctx.closePath(); ctx.fill(); ctx.fillStyle=palette.face; ctx.fillRect(-12,-8,24,22); ctx.fillStyle=palette.top; ctx.beginPath(); ctx.moveTo(-12,-8); ctx.lineTo(12,-8); ctx.lineTo(16,0); ctx.lineTo(-4,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle="#f7f7ff"; ctx.lineWidth=1.6; ctx.strokeRect(-12,-8,24,22); ctx.fillStyle=palette.accent; ctx.beginPath(); ctx.arc(0,2,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#f7f6ff"; ctx.font="700 8px Arial"; ctx.textAlign="center"; ctx.fillText(pickup.kind.toUpperCase().slice(0,3),0,-13); ctx.restore(); } });
      g.bullets.forEach(b => { let color = b.flame ? "#ff8651" : "#f4ff8a"; if (b.weapon === "zapper") color = "#8cf7ff"; else if (b.weapon === "sprayer") color = "#9dff68"; else if (b.weapon === "net") color = "#7de6ff"; else if (b.weapon === "grenade") color = "#c7ff77"; else if (b.weapon === "pulse") color = "#8b9dff"; else if (b.weapon === "whip") color = "#ffb2c5"; else if (b.weapon === "launcher") color = "#ff8c42"; else if (b.weapon === "laser") color = "#ffe27a"; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 13; if (b.weapon === "pulse") { ctx.beginPath(); ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x - 3, b.y - 3); ctx.lineTo(b.x + 3, b.y + 3); ctx.lineTo(b.x + 8, b.y); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); } else if (b.weapon === "whip") { ctx.beginPath(); ctx.moveTo(b.x - 8, b.y - 4); ctx.quadraticCurveTo(b.x, b.y, b.x + 8, b.y + 4); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); } else if (b.weapon === "launcher") { ctx.beginPath(); ctx.arc(b.x,b.y,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#30130b"; ctx.beginPath(); ctx.arc(b.x-2,b.y-2,2.5,0,Math.PI*2); ctx.fill(); } else if (b.weapon === "laser") { ctx.beginPath(); ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x + 8, b.y); ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.stroke(); } else { ctx.beginPath();ctx.arc(b.x,b.y,b.flame?7:4,0,Math.PI*2);ctx.fill(); } });ctx.shadowBlur=0;
      g.enemies.forEach(e => { const r=roster[e.kind], flying=["Zippa","Lumen","Cicada"].includes(e.kind), segmented=["Grubbin","Roly","Skitters","Rex"].includes(e.kind); ctx.save();ctx.translate(e.x,e.y); const angle=Math.atan2(p.y-e.y,p.x-e.x);ctx.rotate(angle);ctx.strokeStyle="#241d2a";ctx.lineWidth=Math.max(1.5,e.size*.11);ctx.lineCap="round";
        for(const n of [-1,1]) for(let leg=0;leg<3;leg++){const x=-e.size*.35+leg*e.size*.35;ctx.beginPath();ctx.moveTo(x,n*e.size*.35);ctx.lineTo(x-e.size*.22,n*(e.size*.75+(leg%2)*4));ctx.lineTo(x+e.size*.03,n*(e.size*.92));ctx.stroke();}
        if(flying){ctx.fillStyle="#d9f5ff72";ctx.beginPath();ctx.ellipse(-e.size*.22,-e.size*.72,e.size*.8,e.size*.28,-.35,0,Math.PI*2);ctx.ellipse(-e.size*.22,e.size*.72,e.size*.8,e.size*.28,.35,0,Math.PI*2);ctx.fill();}
        if(segmented){for(let i=2;i>=0;i--){ctx.fillStyle=e.hit?"#fff":r.color;ctx.beginPath();ctx.ellipse(-e.size*.48+i*e.size*.36,0,e.size*(.38+i*.06),e.size*(.45+i*.03),0,0,Math.PI*2);ctx.fill();}}else{ctx.fillStyle=e.hit?"#fff":r.color;ctx.beginPath();ctx.ellipse(-e.size*.18,0,e.size*.72,e.size*.6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#1c2033";ctx.beginPath();ctx.ellipse(e.size*.42,0,e.size*.42,e.size*.43,0,0,Math.PI*2);ctx.fill();}
        ctx.strokeStyle="#271d2c";ctx.lineWidth=1.5;for(const n of[-1,1]){ctx.beginPath();ctx.moveTo(e.size*.48,n*e.size*.17);ctx.quadraticCurveTo(e.size*.85,n*e.size*.55,e.size*1.08,n*e.size*.84);ctx.stroke();}ctx.fillStyle="#f7f4dc";ctx.beginPath();ctx.arc(e.size*.59,-e.size*.15,2.1,0,7);ctx.arc(e.size*.59,e.size*.15,2.1,0,7);ctx.fill();ctx.restore(); if(e.kind==="Queen"||e.hp<e.max) {ctx.fillStyle="#11182b";ctx.fillRect(e.x-e.size,e.y-e.size-12,e.size*2,4);ctx.fillStyle="#ff6f73";ctx.fillRect(e.x-e.size,e.y-e.size-12,e.size*2*(e.hp/e.max),4);} });
      const angle=Math.atan2(aim.current.y-p.y,aim.current.x-p.x);ctx.save();ctx.globalAlpha=p.hurt>0&&g.clock%6<3?.45:1;ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.fillStyle="#b9ff78";ctx.fillRect(0,-5,29,10);ctx.fillStyle="#fbf7de";ctx.beginPath();ctx.arc(0,0,16,0,7);ctx.fill();ctx.fillStyle="#294e99";ctx.beginPath();ctx.arc(-2,-2,12,0,7);ctx.fill();ctx.fillStyle="#17213d";ctx.fillRect(-11,-14,19,5);ctx.restore();ctx.restore();
      }
      ctx.fillStyle="#f1f6ff";ctx.font="800 13px Arial";ctx.textAlign="center";ctx.fillText(g.notice,W/2,29);
      raf=requestAnimationFrame(frame);
    }; raf=requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [sync]);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => { const p=game.current.player; if (document.pointerLockElement === e.currentTarget) { lookAngle.current += e.movementX * .012; aimDot.current={x:W/2,y:H*.6}; } else { const r=e.currentTarget.getBoundingClientRect(), x=(e.clientX-r.left)*W/r.width, y=(e.clientY-r.top)*H/r.height; lookAngle.current=Math.atan2(y-H*.6,x-W/2); aimDot.current={x,y}; } aim.current.x=p.x+Math.cos(lookAngle.current)*600;aim.current.y=p.y+Math.sin(lookAngle.current)*600; };
  const weaponName = shop.find(x=>x.id===screen.weapon)?.name ?? "Rolled Newspaper +3";
  // Keyboard shortcuts for toolbar (1-6)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= "1" && key <= "6") {
        const slot = parseInt(key) - 1;
        useToolbarItem(slot);
      }
    };
    addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  }, [useToolbarItem]);

  // Shield bar style
  const shieldBarStyle = { width: `${Math.min(100, screen.shield)}%` };
  const shieldActive = screen.shield > 0;

  if (!username) return null;

  return <main className="shell"><section className="cabinet"><header><div className="logo"><span>⚔</span><div><small>EXTERMINATOR ARCADE SYSTEM</small><h1>BUG BRAWLER</h1></div></div><div className="header-actions"><Link href="/profile" className="profile-link">PROFILE</Link><div className="cash">CASH <b>${screen.cash}</b></div></div></header><div className="stats"><div><small>MAP</small><b>{String(screen.map+1).padStart(2,"0")} <i>{maps[screen.map % maps.length].name}</i></b></div><div><small>WAVE</small><b>{screen.wave} <i>∞</i></b></div><div className="vitals"><small>HUNTER VITALS</small>
        <span><em style={{width:`${screen.hp}%`}}/></span>
        <b>{screen.hp} HP</b>
        <div className={`shield-bar ${shieldActive?"active":""}`}><em style={shieldBarStyle}/><small>SHIELD {Math.ceil(screen.shield)}</small></div>
      </div></div><div className="arena"><canvas ref={canvas} width={W} height={H} onPointerMove={point} onPointerDown={e=>{e.currentTarget.requestPointerLock();point(e);aim.current.fire=true;}} onPointerUp={()=>aim.current.fire=false} onPointerLeave={()=>aim.current.fire=false}/>
        <div className="toolbar">{screen.toolbar.map((slot, i) => {
          const isWeapon = i === 0;
          const isActive = screen.activeSlot === i;
          const emptySlot = !slot || slot.count <= 0;
          // Weapon slot always shows the weapon
          if (isWeapon) {
            return <button key={i} className={`tb-item ${isActive?"active":""} weapon-slot`} onClick={() => useToolbarItem(0)} title="Current weapon"><kbd className="tb-key">1</kbd><span className="tb-weapon-icon">🔫</span><span className="tb-label">{weaponName.slice(0, 8)}</span>{screen.ammo >= 0 && <span className="tb-count">{screen.ammo}</span>}</button>;
          }
          // Empty slots
          const info = slot && !emptySlot ? toolbarIcons[slot.kind] : null;
          const slotLabels = ["", "Shield", "Med Kit", "Crate", "Crate", "Crate"];
          const slotIcons = ["", "🛡", "✚", "📦", "📦", "📦"];
          return <button key={i} className={`tb-item ${isActive?"active":""} ${emptySlot?"empty":""}`} onClick={() => useToolbarItem(i)} title={slot && !emptySlot ? `${slot.kind.toUpperCase()} (${slot.count})` : `Slot ${i+1}`}>
            <kbd className="tb-key">{i + 1}</kbd>
            {slot && !emptySlot ? <>
              <span className="tb-icon">{info?.icon ?? slotIcons[i]}</span>
              <span className="tb-label">{info?.label ?? slotLabels[i]}</span>
              <span className="tb-count">{slot.count}</span>
            </> : <>
              <span className="tb-icon">{slotIcons[i]}</span>
              <span className="tb-label">Empty</span>
            </>}
          </button>;
        })}</div>
        <div className="map-note">{maps[screen.map % maps.length].desc}</div></div><footer><div className="loadout"><small>EQUIPPED · {screen.ammo < 0 ? "UNLIMITED AMMO" : `${screen.ammo} AMMO`}</small><b>{weaponName}</b></div><div className="keys"><kbd>WASD</kbd> move <kbd>CLICK</kbd> attack <kbd>1-6</kbd> items <kbd>Q / E</kbd> turn <kbd>F</kbd> 180°</div><button onClick={restart}>↻ NEW RUN</button></footer></section>{screen.status === "shop" && <div className="modal"><div className="shop"><p className="eyebrow">OLD MAN EXTERMINATOR · CHECKPOINT SHOP</p><h2>Spend it before it spends you.</h2><p className="shop-cash">Your cash: <b>${screen.cash}</b></p><div className="cards">{shop.map(item=><button className={screen.weapon===item.id?"item active":"item"} key={item.id} onClick={()=>buy(item.id,item.cost)} disabled={screen.cash<item.cost||(screen.weapon===item.id&&item.cost===0)}><small>{item.stat}</small><strong>{item.name}</strong><span>{item.desc}</span><b>{screen.weapon===item.id&&item.cost>0?`REFILL $${item.cost}`:item.cost===0?"STARTER":`$${item.cost}`}</b></button>)}</div><button className="continue" onClick={nextWave}>START WAVE {screen.wave+1} →</button></div></div>}{(screen.status === "lost" || screen.status === "won") && <div className="modal"><div className="end"><p className="eyebrow">RUN COMPLETE</p><h2>{screen.status === "won" ? "THE BLOCK IS SAFE." : "THE BUGS TOOK THE BLOCK."}</h2><p>Final cash collected: <b>${screen.cash}</b></p><button className="continue" onClick={restart}>BEGIN A NEW HUNT →</button></div></div>}{tutorialState !== "complete" && <div className="modal"><div className="end"><p className="eyebrow">BUG BRAWLER TRAINING · {tutorialStep + 1}/3</p><h2>{["Move through the swarm", "Aim and clear bugs", "Use pickups to survive"][tutorialStep]}</h2><p>{["Use WASD or the arrow keys to move. Turn with Q/E, or move your mouse to aim.", "Click or hold Space to attack. Keep enemies away from your hunter vitals.", "Walk over crates to collect supplies, then press 1–6 to use your equipped items. Survive as many waves as you can."][tutorialStep]}</p><button className="continue" onClick={() => tutorialStep === 2 ? finishTutorial() : setTutorialStep(step => step + 1)}>{tutorialStep === 2 ? "FINISH TRAINING → LEADERBOARD" : "NEXT →"}</button></div></div>}<p className="under">A wave survival game · kill bugs · collect cash · upgrade your loadout</p></main>;
}
