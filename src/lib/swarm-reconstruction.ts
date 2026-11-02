"use client";

/**
 * Swarm reconstruction engine for the Ferdiansyah portfolio.
 *
 * The behaviour is modelled on the publicly documented Swarm / Swarm Rebuild
 * concept by Joel Califa and Dhvanil Patel: a live DOM is snapshotted into a
 * blueprint, a blank construction surface covers the page, and a flock of
 * cursors rebuilds each element with crosshair boxes, typed text, pen lines,
 * ruler guides and duplicates before the real site is restored.
 *
 * The reference repositories do not currently publish a reuse licence, so this
 * file is an independent implementation of those ideas and shares no source
 * code with them. See ATTRIBUTION.md.
 */

import { gsap } from "gsap";

type Vec2 = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type CursorActivity = "working" | "moving" | "inspecting" | "idle-active" | "collaborating" | "transitioning";

type CursorPersonality = {
  ease: string;
  idleEase: string;
  idleRadius: number;
  idlePause: [number, number];
  travelSpeed: number;
  bend: number;
  inspectChance: number;
  collabChance: number;
};

type ItemKind = "rect" | "text" | "image" | "media" | "line";
type TaskKind = "rect" | "image" | "text" | "line" | "guide" | "dup";

type TextUnit =
  | { type: "text"; node: Text; full: string; len: number }
  | { type: "atomic"; node: HTMLElement; len: number }
  | { type: "break"; len: number };

type Guide = {
  axis: "vertical" | "horizontal";
  pos: number;
  cur: number;
  opacity: number;
  flash: number;
  visible: boolean;
  shownAt: number;
  el: HTMLDivElement;
  task?: ReconstructionTask;
  dependents: ReconstructionTask[];
};

type DuplicateGroup = {
  masterRect: Rect;
  copyRect: Rect;
  masterItems: BlueprintItem[];
  copyItems: BlueprintItem[];
  task?: ReconstructionTask;
};

type BlueprintItem = {
  id: number;
  kind: ItemKind;
  el: HTMLElement;
  rect: Rect;
  fixed: boolean;
  parentId: number | null;
  depth: number;
  task?: ReconstructionTask;
  /* text */
  textSource?: HTMLElement;
  syntheticText?: string;
  textRoot?: HTMLElement;
  units?: TextUnit[];
  totalChars?: number;
  shown?: number;
  caret?: HTMLElement;
  fontSize?: number;
  lineHeight?: number;
  grow?: boolean;
  snapGuide?: Guide;
  /* box / media */
  style?: Record<string, string>;
  src?: string;
  html?: string;
  alt?: string;
  fit?: string;
  /* line */
  points?: Vec2[];
  stroke?: string;
  strokeWidth?: number;
  dash?: string;
  /* duplicate handling */
  groupRole?: "master" | "copy";
  duplicateOf?: number;
  /* rendered nodes */
  node?: HTMLDivElement;
  finalEl?: HTMLElement;
  placeholder?: HTMLElement;
  instant?: BlueprintItem[];
};

type ReconstructionTask = {
  id: number;
  kind: TaskKind;
  y: number;
  state: "wait" | "active" | "done";
  item?: BlueprintItem;
  guide?: Guide;
  group?: DuplicateGroup;
  deps: ReconstructionTask[];
  doneAt: number;
};

type SwarmCursor = {
  id: number;
  el: HTMLDivElement;
  label: HTMLElement;
  mark: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  color: string;
  name: string;
  orbit: number;
  spin: number;
  curl: number;
  speed: number;
  force: number;
  press: number;
  shape: "arrow" | "cross" | "ibeam" | "pen" | "ew" | "ns" | "dup";
  task: ReconstructionTask | null;
  worked: boolean;
  home: boolean;
  activity: CursorActivity;
  personality: CursorPersonality;
  idleCenter: Vec2;
  idleTween?: gsap.core.Tween;
  moveTween?: gsap.core.Tween;
  moving: boolean;
  lastIdleFlavor: string;
};

const CURSOR_COLORS = [
  "#57b8ff", "#c58cff", "#70d99b", "#ffad66", "#ff7fa7",
  "#ffd93d", "#6bcfff", "#9d8cff", "#7dffc3", "#ff8a5c",
  "#b6f36b", "#ff6fb1", "#74e0d4", "#c1a6ff", "#ffc46b",
  "#5ea8ff", "#f78cff", "#8dffb0",
];
const CURSOR_NAMES = [
  "Alex · UI", "Sarah · Motion", "Daniel · Visuals", "Michael · Layout", "Emma · Direction",
  "Nora · Type", "Kai · Grid", "Leo · Brand", "Mira · Color", "Theo · Motion",
  "Iris · Systems", "Rowan · Web", "Juno · Art", "Eli · Editorial", "Sage · Product",
  "Remy · 3D", "Lena · UX", "Otto · Type",
];
const CURSOR_PERSONALITIES: CursorPersonality[] = [
  { ease: "power3.out", idleEase: "sine.inOut", idleRadius: 62, idlePause: [180, 620], travelSpeed: 1.08, bend: 0.055, inspectChance: 0.3, collabChance: 0.16 },
  { ease: "power2.inOut", idleEase: "sine.inOut", idleRadius: 44, idlePause: [120, 460], travelSpeed: 0.94, bend: -0.04, inspectChance: 0.36, collabChance: 0.2 },
  { ease: "back.out(1.15)", idleEase: "power2.inOut", idleRadius: 72, idlePause: [220, 760], travelSpeed: 1.16, bend: 0.075, inspectChance: 0.24, collabChance: 0.12 },
  { ease: "sine.inOut", idleEase: "power2.out", idleRadius: 52, idlePause: [160, 540], travelSpeed: 0.88, bend: -0.06, inspectChance: 0.34, collabChance: 0.18 },
  { ease: "power2.out", idleEase: "sine.inOut", idleRadius: 58, idlePause: [200, 680], travelSpeed: 1.02, bend: 0.045, inspectChance: 0.28, collabChance: 0.24 },
  { ease: "expo.out", idleEase: "sine.inOut", idleRadius: 48, idlePause: [140, 500], travelSpeed: 1.22, bend: -0.05, inspectChance: 0.32, collabChance: 0.15 },
  { ease: "power1.inOut", idleEase: "power2.inOut", idleRadius: 66, idlePause: [240, 720], travelSpeed: 0.9, bend: 0.065, inspectChance: 0.26, collabChance: 0.22 },
  { ease: "back.out(1.35)", idleEase: "power2.out", idleRadius: 40, idlePause: [100, 420], travelSpeed: 1.12, bend: -0.07, inspectChance: 0.38, collabChance: 0.14 },
  { ease: "power4.out", idleEase: "sine.inOut", idleRadius: 76, idlePause: [210, 660], travelSpeed: 0.86, bend: 0.05, inspectChance: 0.3, collabChance: 0.18 },
];
const SKIP_TAGS = new Set(["script", "style", "noscript", "template", "link", "meta", "source", "track", "base"]);
const ATOMIC_TAGS = new Set(["img", "svg", "video", "canvas", "iframe", "picture", "input", "select", "textarea"]);
const FIELD_TAGS = new Set(["input", "textarea", "select"]);
const TEXT_PROPS = [
  "font-family", "font-size", "font-weight", "font-style", "font-variant", "line-height",
  "letter-spacing", "word-spacing", "text-transform", "text-align", "color", "white-space",
  "text-decoration-line", "text-decoration-color", "text-shadow", "vertical-align",
];
const INLINE_BOX_PROPS = [
  "background-color", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-radius", "padding-top", "padding-right", "padding-bottom", "padding-left", "display",
];
const BOX_PROPS = [
  "background-color", "background-image", "background-size", "background-position", "background-repeat",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-radius", "box-shadow", "backdrop-filter", "opacity", "overflow",
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function alphaOf(color: string): number {
  if (!color || color === "transparent") return 0;
  const slash = color.match(/\/\s*([\d.]+%?)\s*\)/);
  if (slash) return slash[1].endsWith("%") ? parseFloat(slash[1]) / 100 : parseFloat(slash[1]);
  const rgb = color.match(/^rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(",").map((v) => parseFloat(v.trim()));
    return parts.length > 3 ? parts[3] : 1;
  }
  return 1;
}

function pagePoint(el: HTMLElement, fixed: boolean): Rect {
  const r = el.getBoundingClientRect();
  return fixed
    ? { x: r.left, y: r.top, w: r.width, h: r.height }
    : { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

function unionRects(rects: Rect[]): Rect {
  if (!rects.length) return { x: 0, y: 0, w: 0, h: 0 };
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    w: Math.max(...rects.map((r) => r.x + r.w)) - x,
    h: Math.max(...rects.map((r) => r.y + r.h)) - y,
  };
}

function copyStyle(src: Element, dst: HTMLElement, props: string[]) {
  const cs = getComputedStyle(src);
  for (const prop of props) {
    const value = cs.getPropertyValue(prop);
    if (value) dst.style.setProperty(prop, value);
  }
}

function cursorMarkup(shape: SwarmCursor["shape"], color: string): string {
  const stroke = `fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;
  let inner = "";
  if (shape === "cross") {
    inner = `<path d="M12 2V9M12 15V22M2 12H9M15 12H22" ${stroke}/><circle cx="12" cy="12" r="3.2" fill="none" stroke="${color}" stroke-width="1.6"/>`;
  } else if (shape === "ibeam") {
    inner = `<path d="M8 3H16M8 21H16M12 3V21" ${stroke}/>`;
  } else if (shape === "pen") {
    inner = `<path d="M4 20L12 3L20 20L12 15Z" fill="${color}" stroke="#101217" stroke-width="1.2"/><circle cx="12" cy="15" r="1.6" fill="#fff"/>`;
  } else if (shape === "ew") {
    inner = `<path d="M3 12H21M6 8L2 12L6 16M18 8L22 12L18 16" ${stroke}/>`;
  } else if (shape === "ns") {
    inner = `<path d="M12 3V21M8 6L12 2L16 6M8 18L12 22L16 18" ${stroke}/>`;
  } else {
    inner = `<path d="M2 1v22l6-6 4 9 4-2-4-8h8L2 1Z" fill="${color}" stroke="#101217" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
  return `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
}

const OVERLAY_STYLE = `
:host { all: initial; }
* { box-sizing: border-box; }
.blank { position: fixed; inset: 0; background: #07080c; opacity: 0; transition: opacity .62s ease; }
.blank.on { opacity: 1; }
.layer { position: absolute; inset: 0; pointer-events: none; }
.fixed-layer { position: fixed; inset: 0; pointer-events: none; }
.world { position: absolute; left: 0; top: 0; width: 100%; pointer-events: none; will-change: transform; }
.item { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.item .ph { position: absolute; inset: 0; background: #d9dbe0; opacity: .92; transition: opacity .3s ease, background-color .25s ease; }
.item .ph.icon::after { content: ""; position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; transform: translate(-50%, -50%); border: 1.5px solid #8f939c; border-radius: 4px; opacity: .8; }
.item .fill { position: absolute; inset: 0; opacity: 0; transition: opacity .3s ease; }
.item .fill.on { opacity: 1; }
.item.image .media { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; clip-path: inset(0 0 100% 0); transition: opacity .3s ease, clip-path .62s cubic-bezier(.2,.75,.2,1); }
.item.image .media.on { opacity: 1; clip-path: inset(0 0 0 0); }
.item.image .media img, .item.image .media video { display: block; width: 100%; height: 100%; }
.item .text { position: relative; width: 100%; }
.item .svgline { position: absolute; left: 0; top: 0; overflow: visible; }
.caret { display: inline-block; width: 1.5px; height: 1.05em; margin-left: 1px; vertical-align: text-bottom; background: currentColor; animation: swblink 1s steps(1) infinite; }
@keyframes swblink { 50% { opacity: 0; } }
.cursor { position: fixed; left: 0; top: 0; width: 24px; height: 24px; transform-origin: 2px 2px; will-change: transform; filter: drop-shadow(0 1px 3px rgba(0,0,0,.55)); }
.cursor svg { overflow: visible; display: block; }
.cursor-label { position: absolute; left: 13px; top: 17px; padding: 2px 5px; font: 600 7px/1.2 system-ui, Arial, sans-serif; letter-spacing: .02em; white-space: nowrap; border-radius: 2px; color: #090a0e; }
.ghost { position: fixed; border: 1px solid #57b8ff; background: rgba(87,184,255,.09); pointer-events: none; z-index: 8; }
.ghost.red { border-color: #ff334f; background: rgba(255,51,79,.07); }
.badge { position: fixed; padding: 1px 5px; border-radius: 2px; background: #57b8ff; color: #041018; font: 600 10px/16px system-ui, Arial, sans-serif; white-space: nowrap; pointer-events: none; z-index: 9; }
.badge.red { background: #ff334f; color: #fff; }
.rulers { position: fixed; inset: 0; pointer-events: none; z-index: 4; }
.ruler { position: absolute; background: #202127; transition: transform .36s cubic-bezier(.2,.8,.2,1); }
.ruler-top { left: 0; right: 0; top: 0; height: 20px; transform: translateY(-100%); border-bottom: 1px solid #383a42; }
.ruler-left { top: 0; bottom: 0; left: 0; width: 20px; transform: translateX(-100%); border-right: 1px solid #383a42; }
.rulers.on .ruler-top { transform: translateY(0); }
.rulers.on .ruler-left { transform: translateX(0); }
.ruler-corner { position: absolute; left: 0; top: 0; width: 20px; height: 20px; background: #2b2d35; opacity: 0; transition: opacity .25s; }
.rulers.on .ruler-corner { opacity: 1; }
.ruler-ticks { position: absolute; inset: 0; opacity: .72; }
.ruler-top .ruler-ticks { background-image: repeating-linear-gradient(90deg, #6b6e78 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, #8f939d 0 1px, transparent 1px 100px); background-size: 100% 7px, 100% 13px; background-position: 0 13px, 0 7px; background-repeat: repeat-x; }
.ruler-left .ruler-ticks { background-image: repeating-linear-gradient(0deg, #6b6e78 0 1px, transparent 1px 10px), repeating-linear-gradient(0deg, #8f939d 0 1px, transparent 1px 100px); background-size: 7px 100%, 13px 100%; background-position: 13px 0, 7px 0; background-repeat: repeat-y; }
.guide { position: fixed; background: #ff334f; box-shadow: 0 0 6px rgba(255,51,79,.55); opacity: 0; transition: opacity .2s ease; z-index: 5; }
.guide.vertical { top: 0; bottom: 0; width: 1px; }
.guide.horizontal { left: 0; right: 0; height: 1px; }
.guide.flash { box-shadow: 0 0 12px rgba(255,51,79,.95); }
.measure { position: absolute; height: 1px; background: #ff334f; pointer-events: none; }
.measure:before, .measure:after { content: ""; position: absolute; top: -4px; width: 1px; height: 9px; background: #ff334f; }
.measure:before { left: 0; }
.measure:after { right: 0; }
.measure span { position: absolute; left: 50%; top: -16px; transform: translateX(-50%); padding: 1px 4px; background: #ff334f; color: #fff; font: 600 9px/14px system-ui, Arial, sans-serif; white-space: nowrap; }
`;

export class SwarmReconstruction {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private blank: HTMLDivElement;
  private world: HTMLDivElement;
  private fixedLayer: HTMLDivElement;
  private guideLayer: HTMLDivElement;
  private cursorLayer: HTMLDivElement;
  private rulerWrap: HTMLDivElement;
  private cursors: SwarmCursor[] = [];
  private items: BlueprintItem[] = [];
  private tasks: ReconstructionTask[] = [];
  private guides: Guide[] = [];
  private groups: DuplicateGroup[] = [];
  private time = 0;
  private lastFrame = 0;
  private raf = 0;
  private running = false;
  private started = false;
  private cancelled = false;
  private complete = false;
  private mode: "intro" | "build" | "finale" | "idle" = "idle";
  private mouse = { x: -9999, y: -9999 };
  private readonly lenis?: { scrollTo?: (v: number, o?: { immediate?: boolean }) => void; start?: () => void; stop?: () => void };
  private rulerWant = 0;
  private removeListeners: () => void = () => {};
  private readonly reduced: boolean;
  private readonly mobile: boolean;

  constructor(lenis?: { scrollTo?: (v: number, o?: { immediate?: boolean }) => void; start?: () => void; stop?: () => void }) {
    this.lenis = lenis;
    this.reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.mobile = typeof window !== "undefined" && window.innerWidth < 700;
    this.host = document.createElement("div");
    this.host.className = "swarm-reconstruction-host";
    this.host.setAttribute("aria-hidden", "true");
    this.host.style.cssText = "position:fixed;inset:0;z-index:70;pointer-events:none;";
    this.root = this.host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = OVERLAY_STYLE;
    this.root.appendChild(style);
    this.blank = document.createElement("div");
    this.blank.className = "blank";
    this.world = document.createElement("div");
    this.world.className = "world";
    this.fixedLayer = document.createElement("div");
    this.fixedLayer.className = "fixed-layer";
    this.guideLayer = document.createElement("div");
    this.guideLayer.className = "layer";
    this.cursorLayer = document.createElement("div");
    this.cursorLayer.className = "layer";
    this.rulerWrap = document.createElement("div");
    this.rulerWrap.className = "rulers";
    this.rulerWrap.innerHTML = `<div class="ruler ruler-top"><div class="ruler-ticks"></div></div><div class="ruler ruler-left"><div class="ruler-ticks"></div></div><div class="ruler-corner"></div>`;
    this.root.append(this.blank, this.world, this.fixedLayer, this.guideLayer, this.rulerWrap, this.cursorLayer);
    document.body.appendChild(this.host);
  }

  /* ------------------------------------------------------------------ public */

  async play(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.listen();
    try {
      this.blank.classList.add("on");
      await sleep(this.reduced ? 60 : 180);
      if (this.cancelled) return;
      await this.primeAssets();
      if (this.cancelled) return;
      this.buildBlueprint();
      if (this.cancelled) return;
      this.renderBlueprint();
      this.buildTasks();
      this.createCursors();
      this.startFrame();
      this.mode = "intro";
      await this.intro();
      if (this.cancelled) return;
      this.mode = "build";
      await this.build();
      if (this.cancelled) return;
      this.mode = "finale";
      await this.finale();
    } finally {
      if (!this.cancelled) this.teardown();
    }
  }

  cancel(): void {
    if (this.cancelled || this.complete) return;
    this.cancelled = true;
    this.mode = "idle";
    this.stopAllIdle();
    this.removeListeners();
    this.cursors.forEach((c) => c.el.remove());
    this.host.style.transition = "opacity .22s ease";
    this.host.style.opacity = "0";
    window.setTimeout(() => this.host.remove(), 240);
    this.lenis?.start?.();
  }

  destroy(): void {
    this.cancel();
  }

  /* --------------------------------------------------------------- lifecycle */

  private listen() {
    const onInput = () => this.cancel();
    const onMouse = (event: MouseEvent) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
    };
    const initialWidth = window.innerWidth;
    const initialHeight = window.innerHeight;
    const onResize = () => {
      const dw = Math.abs(window.innerWidth - initialWidth);
      const dh = Math.abs(window.innerHeight - initialHeight);
      if (dw > 80 || dh > 160) this.cancel();
    };
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchstart", onInput, { passive: true });
    window.addEventListener("pointerdown", onInput, { passive: true });
    window.addEventListener("keydown", onInput);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse, { passive: true });
    this.removeListeners = () => {
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onInput);
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }

  private teardown() {
    this.complete = true;
    this.stopAllIdle();
    this.removeListeners();
    this.lenis?.start?.();
  }

  private async primeAssets() {
    if (this.reduced) return;
    await Promise.race([document.fonts?.ready ?? Promise.resolve(), sleep(400)]);
    const images = Array.from(document.querySelectorAll<HTMLImageElement>("main img"));
    await Promise.race([
      Promise.all(images.slice(0, 24).map((el) => el.decode().catch(() => undefined))),
      sleep(600),
    ]);
  }

  /* ---------------------------------------------------------------- snapshot */

  private buildBlueprint() {
    const main = document.querySelector<HTMLElement>("main") ?? document.body;
    const pageBg = getComputedStyle(document.body).backgroundColor || "rgb(7, 8, 12)";
    const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    this.world.style.height = `${docHeight}px`;
    const items: BlueprintItem[] = [];

    const add = (item: Omit<BlueprintItem, "id">): BlueprintItem => {
      const full = { ...item, id: items.length } as BlueprintItem;
      items.push(full);
      return full;
    };

    const emitLines = (el: HTMLElement, cs: CSSStyleDeclaration, rect: Rect, fixed: boolean, parentId: number | null, depth: number) => {
      const sides: Array<{ side: string; width: number; style: string; color: string }> = [];
      for (const side of ["top", "right", "bottom", "left"]) {
        const width = parseFloat(cs.getPropertyValue(`border-${side}-width`)) || 0;
        const style = cs.getPropertyValue(`border-${side}-style`);
        const color = cs.getPropertyValue(`border-${side}-color`);
        if (width > 0 && style !== "none" && style !== "hidden" && alphaOf(color) > 0.03) sides.push({ side, width, style, color });
      }
      if (!sides.length) return;
      if (el.tagName === "HR") {
        add({
          kind: "line", el, rect, fixed, parentId, depth,
          points: [{ x: rect.x, y: rect.y + rect.h / 2 }, { x: rect.x + rect.w, y: rect.y + rect.h / 2 }],
          stroke: sides[0]?.color || cs.color, strokeWidth: Math.max(1, Math.min(rect.h, 2)), dash: undefined,
        });
        return;
      }
      for (const side of sides) {
        const half = side.width / 2;
        let a: Vec2;
        let b: Vec2;
        if (side.side === "top") { a = { x: rect.x, y: rect.y + half }; b = { x: rect.x + rect.w, y: rect.y + half }; }
        else if (side.side === "bottom") { a = { x: rect.x, y: rect.y + rect.h - half }; b = { x: rect.x + rect.w, y: rect.y + rect.h - half }; }
        else if (side.side === "left") { a = { x: rect.x + half, y: rect.y }; b = { x: rect.x + half, y: rect.y + rect.h }; }
        else { a = { x: rect.x + rect.w - half, y: rect.y }; b = { x: rect.x + rect.w - half, y: rect.y + rect.h }; }
        const minX = Math.min(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        add({
          kind: "line", el, rect: { x: minX, y: minY, w: Math.max(1, Math.abs(b.x - a.x)), h: Math.max(1, Math.abs(b.y - a.y)) },
          fixed, parentId, depth, points: [a, b], stroke: side.color, strokeWidth: side.width,
          dash: side.style === "dashed" ? `${side.width * 3} ${side.width * 2}` : side.style === "dotted" ? `${side.width} ${side.width * 1.5}` : undefined,
        });
      }
    };

    const walk = (el: HTMLElement, parentId: number | null, depth: number, inheritedFixed: boolean) => {
      if (items.length > 300) return;
      const tag = el.tagName.toLowerCase();
      if (SKIP_TAGS.has(tag)) return;
      if (el === this.host || el.closest(".swarm-reconstruction-host, .collaborator-overlay, .project-modal")) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return;
      if (parseFloat(cs.opacity) < 0.05) return;
      if (el.getAttribute("aria-hidden") === "true" && tag !== "svg") return;
      const firstRect = el.getBoundingClientRect();
      if (cs.display === "contents") {
        Array.from(el.children).forEach((child) => {
          if (child instanceof HTMLElement) walk(child, parentId, depth, inheritedFixed);
        });
        return;
      }
      if (firstRect.width < 2 || firstRect.height < 2) return;
      if (firstRect.bottom + window.scrollY < -200 || firstRect.top + window.scrollY > document.documentElement.scrollHeight + 200) return;

      const fixed = inheritedFixed || cs.position === "fixed";
      const rect = pagePoint(el, fixed);

      const sideCount = ["top", "right", "bottom", "left"].filter((side) => {
        const width = parseFloat(cs.getPropertyValue(`border-${side}-width`)) || 0;
        const style = cs.getPropertyValue(`border-${side}-style`);
        return width > 0 && style !== "none" && style !== "hidden";
      }).length;
      const bgAlpha = alphaOf(cs.backgroundColor);
      const hasBg = (bgAlpha > 0.02 && !(cs.backgroundColor === pageBg && !cs.backgroundImage.includes("url("))) || (cs.backgroundImage && cs.backgroundImage !== "none");
      const hasShadow = !!cs.boxShadow && cs.boxShadow !== "none";
      const hasBackdrop = !!cs.backdropFilter && cs.backdropFilter !== "none";
      const hasBox = hasBg || hasShadow || hasBackdrop || sideCount >= 3;

      if (tag === "img" || tag === "picture" || tag === "video" || tag === "canvas") {
        const img = tag === "picture" ? el.querySelector("img") : el;
        const src = img instanceof HTMLImageElement ? img.currentSrc || img.src : img instanceof HTMLVideoElement ? img.currentSrc || img.src : "";
        add({
          kind: "image", el, rect, fixed, parentId, depth, src,
          fit: cs.objectFit || "cover",
          style: { "border-radius": cs.borderRadius, "background-color": cs.backgroundColor },
          alt: el.getAttribute("alt") || "",
        });
        return;
      }

      if (FIELD_TAGS.has(tag)) {
        const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
          ? el.getAttribute("placeholder") || el.value || ""
          : "";
        add({
          kind: "text", el, rect, fixed, parentId, depth, syntheticText: value || " ",
          fontSize: parseFloat(cs.fontSize) || 12, lineHeight: parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 12) * 1.4,
          textSource: el,
        });
        return;
      }

      const isSvg = tag === "svg";
      const directText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && /\S/.test(node.textContent || ""));
      const textContent = (el.textContent || "").replace(/\s+/g, " ").trim();
      const inlineOnly = Array.from(el.children).every((child) => {
        const childTag = child.tagName.toLowerCase();
        if (SKIP_TAGS.has(childTag) || childTag === "br" || childTag === "svg") return true;
        const display = getComputedStyle(child).display;
        return display.startsWith("inline") || display === "contents";
      });
      const textLike = !isSvg && !hasBox && !!textContent && (directText || inlineOnly) && (inlineOnly || el.children.length === 0);

      if (hasBox) {
        const boxStyle: Record<string, string> = {};
        for (const prop of BOX_PROPS) boxStyle[prop] = cs.getPropertyValue(prop);
        const box = add({ kind: "rect", el, rect, fixed, parentId, depth, style: boxStyle });
        emitLines(el, cs, rect, fixed, box.id, depth);
        if (textLike) {
          this.emitText(add, el, cs, rect, fixed, box.id, depth, textContent, false);
        } else {
          Array.from(el.children).forEach((child) => {
            if (child instanceof HTMLElement) walk(child, box.id, depth + 1, fixed);
          });
        }
        return;
      }

      if (textLike) {
        this.emitText(add, el, cs, rect, fixed, parentId, depth, textContent, false);
        return;
      }

      if (isSvg) {
        add({ kind: "media", el, rect, fixed, parentId, depth, html: el.outerHTML, style: { color: cs.color } });
        return;
      }

      if (sideCount > 0) {
        emitLines(el, cs, rect, fixed, parentId, depth);
      }

      const onlyIcons = el.children.length > 0 && !textContent && Array.from(el.children).every((child) => ["svg", "img"].includes(child.tagName.toLowerCase()));
      if (onlyIcons) {
        add({ kind: "media", el, rect, fixed, parentId, depth, html: el.innerHTML, style: { color: cs.color } });
        return;
      }

      Array.from(el.children).forEach((child) => {
        if (child instanceof HTMLElement) walk(child, parentId, depth + 1, fixed);
      });
    };

    Array.from(main.children).forEach((child) => {
      if (child instanceof HTMLElement) walk(child, null, 0, false);
    });

    this.items = items;
    this.groups = this.findDuplicateGroups();
    for (const group of this.groups) {
      for (const item of group.copyItems) item.groupRole = "copy";
      for (const item of group.masterItems) if (!item.groupRole) item.groupRole = "master";
    }
  }

  private emitText(
    add: (item: Omit<BlueprintItem, "id">) => BlueprintItem,
    el: HTMLElement,
    cs: CSSStyleDeclaration,
    rect: Rect,
    fixed: boolean,
    parentId: number | null,
    depth: number,
    text: string,
    synthetic: boolean,
  ) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    const box = fixed
      ? { x: tr.left, y: tr.top, w: tr.width, h: tr.height }
      : { x: tr.left + window.scrollX, y: tr.top + window.scrollY, w: tr.width, h: tr.height };
    const textRect = tr.width > 1 && tr.height > 1 ? box : rect;
    const fontSize = parseFloat(cs.fontSize) || 14;
    add({
      kind: "text", el, rect: textRect, fixed, parentId, depth,
      textSource: synthetic ? undefined : el,
      syntheticText: synthetic ? text : undefined,
      fontSize,
      lineHeight: parseFloat(cs.lineHeight) || fontSize * 1.35,
      grow: fontSize >= 30,
    });
  }

  private findDuplicateGroups(): DuplicateGroup[] {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".project-card"));
    if (cards.length < 2) return [];
    const rows: HTMLElement[][] = [];
    for (const card of cards) {
      const top = Math.round(card.getBoundingClientRect().top + window.scrollY);
      const row = rows.find((list) => Math.abs(Math.round(list[0].getBoundingClientRect().top + window.scrollY) - top) < 90);
      if (row) row.push(card);
      else rows.push([card]);
    }
    const groups: DuplicateGroup[] = [];
    for (const row of rows) {
      if (row.length < 2) continue;
      const master = row[0];
      const masterItems = this.items.filter((item) => master.contains(item.el) || item.el === master);
      if (!masterItems.length) continue;
      for (const copy of row.slice(1)) {
        const copyItems = this.items.filter((item) => copy.contains(item.el) || item.el === copy);
        if (!copyItems.length) continue;
        for (const item of copyItems) item.duplicateOf = masterItems[0].id;
        groups.push({
          masterRect: unionRects(masterItems.map((item) => item.rect)),
          copyRect: unionRects(copyItems.map((item) => item.rect)),
          masterItems,
          copyItems,
        });
      }
    }
    return groups;
  }

  /* ------------------------------------------------------------------- tasks */

  private buildTasks() {
    const tasks: ReconstructionTask[] = [];
    const make = (kind: TaskKind, y: number, extra: Partial<ReconstructionTask>): ReconstructionTask => {
      const task: ReconstructionTask = { id: tasks.length, kind, y, state: "wait", deps: [], doneAt: 0, ...extra };
      tasks.push(task);
      return task;
    };

    for (const item of this.items) {
      if (item.groupRole === "copy") continue;
      const parent = item.parentId == null ? undefined : this.items[item.parentId];
      const instant = !!parent?.task && (item.kind === "line" || (item.kind === "text" && (item.fontSize || 0) < 10));
      if (instant && parent) {
        (parent.instant ?? (parent.instant = [])).push(item);
        continue;
      }
      const kind: TaskKind = item.kind === "image" || item.kind === "media" ? "image" : item.kind === "line" ? "line" : item.kind === "text" ? "text" : "rect";
      item.task = make(kind, item.rect.y, { item });
    }

    for (const group of this.groups) {
      const masterTasks = group.masterItems.map((item) => item.task).filter((task): task is ReconstructionTask => !!task);
      group.task = make("dup", group.copyRect.y, { group, deps: masterTasks });
    }

    this.tasks = tasks;
    this.createGuides();
  }

  private createGuides() {
    const texts = this.items.filter(
      (item) => item.kind === "text" && item.task && !item.groupRole && item.rect.w > 34 && (item.fontSize || 0) >= 11,
    );
    const bands = new Map<number, BlueprintItem[]>();
    for (const item of texts) {
      const key = Math.floor(item.rect.y / 900);
      const list = bands.get(key) || [];
      list.push(item);
      bands.set(key, list);
    }
    const guides: Guide[] = [];
    const bandKeys = Array.from(bands.keys()).sort((a, b) => a - b);
    for (const key of bandKeys) {
      if (guides.length >= 6) break;
      const list = bands.get(key) || [];
      const buckets = new Map<number, BlueprintItem[]>();
      for (const item of list) {
        const x = Math.round(item.rect.x);
        const bucket = buckets.get(x) || [];
        bucket.push(item);
        buckets.set(x, bucket);
      }
      let bestX: number | null = null;
      let best: BlueprintItem[] = [];
      buckets.forEach((bucket, x) => {
        if (bucket.length > best.length) { best = bucket; bestX = x; }
      });
      if (bestX == null || best.length < 3) continue;
      const top = Math.min(...best.map((item) => item.rect.y));
      const members = best
        .filter((item) => item.rect.y < top + 520)
        .sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))
        .slice(0, 2);
      if (!members.length) continue;
      const guide: Guide = {
        axis: "vertical",
        pos: bestX,
        cur: bestX,
        opacity: 1,
        flash: 0,
        visible: false,
        shownAt: 0,
        el: document.createElement("div"),
        dependents: members.map((item) => item.task!).filter(Boolean),
      };
      guide.el.className = "guide vertical";
      this.guideLayer.appendChild(guide.el);
      const y = Math.min(...members.map((item) => item.rect.y)) - 54;
      guide.task = {
        id: this.tasks.length,
        kind: "guide",
        y,
        state: "wait",
        guide,
        deps: [],
        doneAt: 0,
      };
      this.tasks.push(guide.task);
      for (const member of members) {
        member.snapGuide = guide;
        member.task?.deps.push(guide.task);
      }
      guides.push(guide);
    }
    this.guides = guides;
  }

  /* --------------------------------------------------------------- rendering */

  private renderBlueprint() {
    for (const item of this.items) {
      const node = document.createElement("div");
      node.className = `item ${item.kind}`;
      node.style.left = `${item.rect.x}px`;
      node.style.top = `${item.rect.y}px`;
      node.style.width = `${item.rect.w}px`;
      node.style.height = `${item.rect.h}px`;
      if (item.fixed) node.style.position = "fixed";
      let finalEl: HTMLElement | undefined;
      let placeholder: HTMLElement | undefined;

      if (item.kind === "rect") {
        placeholder = document.createElement("div");
        placeholder.className = "ph";
        finalEl = document.createElement("div");
        finalEl.className = "fill";
        if (item.style) {
          for (const [prop, value] of Object.entries(item.style)) {
            if (value && value !== "none" && value !== "normal") finalEl.style.setProperty(prop, value);
          }
        }
        finalEl.style.background = item.style?.["background-color"] || "transparent";
        if (item.style?.["background-image"] && item.style["background-image"] !== "none") {
          finalEl.style.backgroundImage = item.style["background-image"];
          finalEl.style.backgroundSize = item.style["background-size"];
          finalEl.style.backgroundPosition = item.style["background-position"];
          finalEl.style.backgroundRepeat = item.style["background-repeat"];
        }
        node.append(placeholder, finalEl);
      } else if (item.kind === "image") {
        placeholder = document.createElement("div");
        placeholder.className = "ph icon";
        finalEl = document.createElement("div");
        finalEl.className = "media";
        if (item.src) {
          if (item.el.tagName.toLowerCase() === "video") {
            const video = document.createElement("video");
            video.src = item.src;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = "metadata";
            finalEl.appendChild(video);
          } else {
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.alt || "";
            img.loading = "lazy";
            img.decoding = "async";
            img.style.objectFit = item.fit || "cover";
            if (item.style?.["border-radius"]) img.style.borderRadius = item.style["border-radius"];
            finalEl.appendChild(img);
          }
        }
        node.append(placeholder, finalEl);
      } else if (item.kind === "media") {
        placeholder = document.createElement("div");
        placeholder.className = "ph icon";
        finalEl = document.createElement("div");
        finalEl.className = "fill";
        finalEl.style.cssText = "display:flex;align-items:center;justify-content:center;";
        finalEl.innerHTML = item.html || "";
        if (item.style?.color) finalEl.style.color = item.style.color;
        node.append(placeholder, finalEl);
      } else if (item.kind === "line") {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "svgline");
        svg.setAttribute("width", String(item.rect.w));
        svg.setAttribute("height", String(item.rect.h));
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", item.stroke || "#999");
        path.setAttribute("stroke-width", String(item.strokeWidth || 1));
        if (item.dash) path.setAttribute("stroke-dasharray", item.dash);
        const local = (item.points || []).map((p) => ({ x: p.x - item.rect.x, y: p.y - item.rect.y }));
        path.setAttribute("d", local.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" "));
        svg.appendChild(path);
        node.appendChild(svg);
        finalEl = svg as unknown as HTMLElement;
      } else {
        finalEl = this.buildTextElement(item);
        node.appendChild(finalEl);
      }

      node.style.opacity = "0";
      item.node = node;
      item.finalEl = finalEl;
      item.placeholder = placeholder;
      (item.fixed ? this.fixedLayer : this.world).appendChild(node);
    }
  }

  private buildTextElement(item: BlueprintItem): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "text";
    wrapper.style.width = `${item.rect.w + 1}px`;
    const source = item.textSource;
    if (source) {
      const cs = getComputedStyle(source);
      for (const prop of TEXT_PROPS) wrapper.style.setProperty(prop, cs.getPropertyValue(prop));
      wrapper.style.display = "block";
      wrapper.style.margin = "0";
      wrapper.style.padding = "0";
      wrapper.style.height = "auto";
      if (cs.whiteSpace.includes("pre")) wrapper.style.whiteSpace = cs.whiteSpace;
      else if (item.rect.h < (item.lineHeight || 20) * 1.7) wrapper.style.whiteSpace = "nowrap";
      const clone = source.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      const srcNodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>("*"))];
      const dstNodes = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
      for (let i = 0; i < Math.min(srcNodes.length, dstNodes.length); i++) {
        const dst = dstNodes[i];
        dst.removeAttribute("class");
        dst.style.margin = "0";
        copyStyle(srcNodes[i], dst, [...TEXT_PROPS, ...INLINE_BOX_PROPS]);
        if (dst.tagName.toLowerCase() === "br") dst.style.display = "inline";
      }
      while (clone.firstChild) wrapper.appendChild(clone.firstChild);
      clone.remove();
    } else {
      wrapper.style.cssText += `display:block;margin:0;padding:0;font-family:${getComputedStyle(item.el).fontFamily};font-size:${item.fontSize}px;line-height:${item.lineHeight}px;color:${getComputedStyle(item.el).color};white-space:pre-wrap;`;
      wrapper.textContent = item.syntheticText || "";
    }
    this.prepareTextUnits(item, wrapper);
    return wrapper;
  }

  private prepareTextUnits(item: BlueprintItem, wrapper: HTMLElement) {
    const units: TextUnit[] = [];
    let total = 0;
    const visit = (node: Node, root: HTMLElement) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child as Text;
          const full = text.data;
          if (!full.length) return;
          units.push({ type: "text", node: text, full, len: full.length });
          total += full.length;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === "br") {
            units.push({ type: "break", len: 1 });
            total += 1;
            return;
          }
          if (ATOMIC_TAGS.has(tag)) {
            el.style.visibility = "hidden";
            units.push({ type: "atomic", node: el, len: 1 });
            total += 1;
            return;
          }
          visit(el, root);
        }
      });
    };
    visit(wrapper, wrapper);
    for (const unit of units) {
      if (unit.type === "text") unit.node.data = "";
      else if (unit.type === "atomic") unit.node.style.visibility = "hidden";
    }
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.style.display = "none";
    wrapper.appendChild(caret);
    item.units = units;
    item.totalChars = total;
    item.shown = 0;
    item.caret = caret;
  }

  private createCursors() {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "cursor";
      const color = CURSOR_COLORS[i % CURSOR_COLORS.length];
      el.innerHTML = cursorMarkup("arrow", color);
      const label = document.createElement("span");
      label.className = "cursor-label";
      label.style.background = color;
      label.textContent = CURSOR_NAMES[i % CURSOR_NAMES.length];
      el.appendChild(label);
      const base = CURSOR_PERSONALITIES[i % CURSOR_PERSONALITIES.length];
      const personality: CursorPersonality = {
        ...base,
        idleRadius: base.idleRadius * rand(0.86, 1.14),
        idlePause: [base.idlePause[0] * rand(0.85, 1.2), base.idlePause[1] * rand(0.85, 1.2)],
        travelSpeed: base.travelSpeed * rand(0.93, 1.07),
        bend: base.bend * rand(0.82, 1.18),
      };
      const x = i % 2 === 0 ? -60 - rand(0, 160) : window.innerWidth + 60 + rand(0, 160);
      const y = rand(window.innerHeight * 0.08, window.innerHeight * 0.92);
      const c: SwarmCursor = {
        id: i,
        el,
        label,
        mark: el.firstElementChild as HTMLElement,
        x,
        y,
        vx: 0,
        vy: 0,
        angle: 0,
        color,
        name: label.textContent,
        orbit: rand(55, 160),
        spin: rand(0.8, 2.2),
        curl: rand(-1, 1),
        speed: rand(420, 840),
        force: rand(1200, 2600),
        press: 0,
        shape: "arrow",
        task: null,
        worked: false,
        home: i < 2,
        activity: "idle-active",
        personality: this.mobile
          ? { ...personality, idleRadius: personality.idleRadius * 0.7, idlePause: [personality.idlePause[0] * 1.3, personality.idlePause[1] * 1.4] }
          : personality,
        idleCenter: { x, y },
        moving: false,
        lastIdleFlavor: "",
      };
      el.style.opacity = "0";
      this.cursorLayer.appendChild(el);
      this.cursors.push(c);
      this.applyCursor(c);
    }
  }

  /* ------------------------------------------------------------------ frames */

  private startFrame() {
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      if (this.cancelled || this.complete) return;
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      this.time += dt;
      this.world.style.transform = `translate3d(0, ${-window.scrollY}px, 0)`;
      this.updateGuides();
      this.updateCursorIdle(dt);
      this.updateCursorDom();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private updateGuides() {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    this.rulerWrap.classList.toggle("on", this.rulerWant > 0);
    for (const guide of this.guides) {
      if (!guide.visible) { guide.el.style.opacity = "0"; continue; }
      const screen = guide.axis === "vertical" ? guide.cur - scrollX : guide.cur - scrollY;
      if (guide.axis === "vertical") guide.el.style.left = `${Math.round(screen)}px`;
      else guide.el.style.top = `${Math.round(screen)}px`;
      guide.el.style.opacity = String(guide.opacity);
      if (guide.flash > 0) {
        guide.el.classList.add("flash");
        guide.flash = Math.max(0, guide.flash - 0.02);
      } else {
        guide.el.classList.remove("flash");
      }
      const age = this.time - guide.shownAt;
      const depsDone = guide.dependents.every((task) => task.state === "done");
      if (guide.visible && depsDone && age > 1.6) guide.opacity = Math.max(0, guide.opacity - 0.012);
      if (guide.opacity <= 0.01) guide.visible = false;
    }
  }

  private updateCursorIdle(dt: number) {
    if (this.cancelled || this.complete) return;
    if (this.mode === "intro" || this.mode === "finale") return;
    const maxX = Math.max(24, window.innerWidth - 30);
    const maxY = Math.max(30, window.innerHeight - 26);
    for (const c of this.cursors) {
      c.press = Math.max(0, c.press - dt * 6);
      c.x = clamp(c.x, 20, maxX);
      c.y = clamp(c.y, 28, maxY);
    }
  }

  /* ----------------------------------------------------------- cursor activity */

  private screenOf(item: BlueprintItem): (Vec2 & { w: number; h: number }) | null {
    if (!item.node) return null;
    const x = item.fixed ? item.rect.x : item.rect.x - window.scrollX;
    const y = item.fixed ? item.rect.y : item.rect.y - window.scrollY;
    if (x + item.rect.w < -60 || x > window.innerWidth + 60) return null;
    if (y + item.rect.h < -60 || y > window.innerHeight + 60) return null;
    return { x, y, w: item.rect.w, h: item.rect.h };
  }

  private visibleItems(): BlueprintItem[] {
    const result: BlueprintItem[] = [];
    for (const item of this.items) {
      if (!item.node || item.node.style.opacity === "0") continue;
      if (item.rect.w < 10 || item.rect.h < 10) continue;
      if (this.cursors.some((c) => c.task?.item === item)) continue;
      const screen = this.screenOf(item);
      if (!screen) continue;
      result.push(item);
    }
    return result;
  }

  private idleBounds(target: Vec2): Vec2 {
    return {
      x: clamp(target.x, 26, Math.max(26, window.innerWidth - 30)),
      y: clamp(target.y, 34, Math.max(34, window.innerHeight - 28)),
    };
  }

  private avoidCursors(c: SwarmCursor, target: Vec2): Vec2 {
    let { x, y } = this.idleBounds(target);
    for (const other of this.cursors) {
      if (other === c) continue;
      const dx = x - other.x;
      const dy = y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= 58) continue;
      const ux = distance > 0.1 ? dx / distance : rand(-1, 1);
      const uy = distance > 0.1 ? dy / distance : rand(-1, 1);
      const push = 58 - distance + 14;
      const next = this.idleBounds({ x: x + ux * push, y: y + uy * push });
      x = next.x;
      y = next.y;
    }
    return { x, y };
  }

  private pickIdleTarget(c: SwarmCursor): { target: Vec2; activity: CursorActivity } {
    const p = c.personality;
    const roll = Math.random();
    const collabChance = this.mobile ? p.collabChance * 0.45 : p.collabChance;
    const inspectChance = this.mobile ? p.inspectChance * 0.85 : p.inspectChance;
    const working = this.cursors.filter((other) => other !== c && (other.task || other.moving));

    if (roll < collabChance && working.length) {
      const partner = working[Math.floor(Math.random() * working.length)];
      const angle = rand(0, Math.PI * 2);
      const radius = rand(72, 150);
      return {
        target: this.idleBounds({ x: partner.x + Math.cos(angle) * radius, y: partner.y + Math.sin(angle) * radius }),
        activity: "collaborating",
      };
    }

    const visible = this.visibleItems();
    if (roll < collabChance + inspectChance && visible.length) {
      const scored = visible
        .map((item) => {
          const screen = this.screenOf(item)!;
          const distance = Math.hypot(screen.x + screen.w / 2 - c.x, screen.y + screen.h / 2 - c.y);
          return { screen, distance };
        })
        .filter((entry) => entry.distance < 680)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
      if (scored.length) {
        const pick = scored[Math.floor(Math.random() * scored.length)].screen;
        return {
          target: this.idleBounds({
            x: pick.x + rand(pick.w * 0.2, pick.w * 0.8),
            y: pick.y + rand(pick.h * 0.25, pick.h * 0.8),
          }),
          activity: "inspecting",
        };
      }
    }

    if (roll < collabChance + inspectChance + 0.14) {
      const pending = this.tasks
        .filter((task) => task.state === "wait" && task.item)
        .map((task) => {
          const screen = this.screenOf(task.item!);
          if (!screen) return null;
          return { screen, distance: Math.hypot(screen.x - c.x, screen.y - c.y) };
        })
        .filter((entry): entry is { screen: Vec2 & { w: number; h: number }; distance: number } => !!entry)
        .sort((a, b) => a.distance - b.distance);
      if (pending.length) {
        const next = pending[0].screen;
        return {
          target: this.idleBounds({ x: next.x + rand(-24, 24), y: next.y + rand(16, 48) }),
          activity: "transitioning",
        };
      }
    }

    const center = c.idleCenter;
    const radius = rand(c.personality.idleRadius * 0.25, c.personality.idleRadius);
    const angle = rand(0, Math.PI * 2);
    let target = this.idleBounds({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius * 0.72,
    });
    if (Math.hypot(target.x - c.x, target.y - c.y) < 14) {
      target = this.idleBounds({ x: c.x + rand(-radius, radius), y: c.y + rand(-radius * 0.6, radius * 0.6) });
    }
    return { target, activity: "idle-active" };
  }

  private beginIdle(c: SwarmCursor, delay = 0) {
    if (this.cancelled || this.complete || this.reduced) return;
    if (this.mode !== "build") return;
    if (c.task || c.moving || c.idleTween) return;
    c.idleTween = gsap.delayedCall(Math.max(0, delay) / 1000, () => {
      c.idleTween = undefined;
      this.idleStep(c);
    });
  }

  private idleStep(c: SwarmCursor) {
    if (this.cancelled || this.complete || this.reduced) return;
    if (c.task || c.moving || this.mode !== "build") return;
    const choice = this.pickIdleTarget(c);
    this.animateIdle(c, this.avoidCursors(c, choice.target), choice.activity, () => {
      c.idleCenter = { x: c.x, y: c.y };
      this.beginIdle(c, rand(c.personality.idlePause[0], c.personality.idlePause[1]));
    });
  }

  private animateIdle(c: SwarmCursor, target: Vec2, activity: CursorActivity, onDone?: () => void) {
    this.stopIdle(c);
    const distance = Math.hypot(target.x - c.x, target.y - c.y);
    const duration = clamp((0.42 + distance / 560) / c.personality.travelSpeed, 0.3, 1.5) * (this.mobile ? 1.22 : 1);
    c.activity = activity;
    c.idleTween = gsap.to(c, {
      x: target.x,
      y: target.y,
      duration,
      ease: activity === "collaborating" ? "power2.inOut" : c.personality.idleEase,
      overwrite: true,
      onUpdate: () => {
        c.x = clamp(c.x, 20, Math.max(20, window.innerWidth - 30));
        c.y = clamp(c.y, 28, Math.max(28, window.innerHeight - 26));
      },
      onComplete: () => {
        c.idleTween = undefined;
        if (c.activity !== "working") c.activity = "idle-active";
        if (!c.task && !c.moving) onDone?.();
      },
    });
  }

  private stopIdle(c: SwarmCursor) {
    if (c.idleTween) {
      c.idleTween.kill();
      c.idleTween = undefined;
    }
  }

  private stopAllIdle() {
    for (const c of this.cursors) this.stopIdle(c);
  }

  private inviteCollaborator(source: SwarmCursor, task: ReconstructionTask) {
    if (this.cancelled || this.complete || this.reduced || !task.item) return;
    const helpers = this.cursors.filter((c) => c !== source && !c.task && !c.moving);
    if (!helpers.length) return;
    const screen = this.screenOf(task.item);
    if (!screen) return;
    const helper = helpers[Math.floor(Math.random() * helpers.length)];
    const target = this.avoidCursors(helper, this.idleBounds({
      x: screen.x + rand(screen.w * 0.15, screen.w * 0.85),
      y: screen.y + rand(screen.h * 0.2, screen.h * 0.85),
    }));
    this.animateIdle(helper, target, "collaborating", () => {
      helper.idleCenter = { x: helper.x, y: helper.y };
      this.beginIdle(helper, rand(helper.personality.idlePause[0], helper.personality.idlePause[1]));
    });
  }

  private updateCursorDom() {
    for (const c of this.cursors) {
      const scale = 1 - c.press * 0.14;
      c.el.dataset.activity = c.activity;
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${scale})`;
    }
  }

  private applyCursor(c: SwarmCursor) {
    c.mark.innerHTML = cursorMarkup(c.shape, c.color);
    c.label.textContent = c.shape === "dup" ? `${c.name} · ⌥ dup` : c.name;
  }

  private setShape(c: SwarmCursor, shape: SwarmCursor["shape"]) {
    if (c.shape === shape) return;
    c.shape = shape;
    this.applyCursor(c);
  }

  /* -------------------------------------------------------------- cursor ops */

  private async moveTo(c: SwarmCursor, target: Vec2 | (() => Vec2), opts: { duration?: number; speed?: number; bend?: number; drag?: boolean; onStep?: () => void } = {}) {
    const get = typeof target === "function" ? target : () => target;
    const p0 = get();
    const startX = c.x;
    const startY = c.y;
    const dist = Math.hypot(p0.x - startX, p0.y - startY);
    const wasWorking = !!c.task;
    this.stopIdle(c);
    if (!wasWorking) c.activity = "moving";
    c.moving = true;
    const duration = (opts.duration ?? clamp(0.05 + Math.sqrt(dist) * 0.008, 0.05, 0.28)) / ((opts.speed || 1) * c.personality.travelSpeed);
    const defaultBend = c.personality.bend * (Math.random() < 0.5 ? -1 : 1);
    const bend = (opts.bend ?? defaultBend) * Math.min(dist, 600);
    if (dist < 1) {
      c.x = p0.x;
      c.y = p0.y;
      opts.onStep?.();
      c.moving = false;
      if (!wasWorking) c.activity = "idle-active";
      return;
    }
    const ease = opts.drag ? "power2.inOut" : c.personality.ease;
    await new Promise<void>((resolve) => {
      const proxy = { t: 0 };
      let finished = false;
      let tween: gsap.core.Tween | undefined;
      const finish = () => {
        if (finished) return;
        finished = true;
        c.moving = false;
        c.moveTween = undefined;
        resolve();
      };
      tween = gsap.to(proxy, {
        t: 1,
        duration,
        ease,
        overwrite: true,
        onUpdate: () => {
          if (this.cancelled) {
            tween?.kill();
            finish();
            return;
          }
          const e = proxy.t;
          const p = get();
          const dx = p.x - startX;
          const dy = p.y - startY;
          const len = Math.hypot(dx, dy) || 1;
          const off = Math.sin(Math.PI * Math.min(1, Math.max(0, e))) * bend;
          c.x = startX + dx * e + (-dy / len) * off;
          c.y = startY + dy * e + (dx / len) * off;
          opts.onStep?.();
        },
        onComplete: () => {
          const end = get();
          c.x = end.x;
          c.y = end.y;
          opts.onStep?.();
          if (!wasWorking) c.activity = "idle-active";
          finish();
        },
      });
      c.moveTween = tween;
    });
  }

  private async click(c: SwarmCursor) {
    c.press = 1;
    await sleep(20);
  }

  private screenPoint(item: BlueprintItem, local?: Vec2): Vec2 {
    const base = item.fixed
      ? { x: item.rect.x, y: item.rect.y }
      : { x: item.rect.x - window.scrollX, y: item.rect.y - window.scrollY };
    return { x: base.x + (local?.x || 0), y: base.y + (local?.y || 0) };
  }

  private makeGhost(rect: Rect, opts: { red?: boolean; badge?: string } = {}) {
    const ghost = document.createElement("div");
    ghost.className = `ghost${opts.red ? " red" : ""}`;
    ghost.style.left = `${rect.x}px`;
    ghost.style.top = `${rect.y}px`;
    ghost.style.width = `${Math.max(0, rect.w)}px`;
    ghost.style.height = `${Math.max(0, rect.h)}px`;
    this.guideLayer.appendChild(ghost);
    let badge: HTMLDivElement | null = null;
    if (opts.badge !== undefined) {
      badge = document.createElement("div");
      badge.className = `badge${opts.red ? " red" : ""}`;
      badge.textContent = opts.badge;
      badge.style.left = `${rect.x + rect.w + 6}px`;
      badge.style.top = `${rect.y}px`;
      this.guideLayer.appendChild(badge);
    }
    return {
      el: ghost,
      badge,
      update: (next: Rect, label?: string) => {
        ghost.style.left = `${next.x}px`;
        ghost.style.top = `${next.y}px`;
        ghost.style.width = `${Math.max(0, next.w)}px`;
        ghost.style.height = `${Math.max(0, next.h)}px`;
        if (badge) {
          badge.style.left = `${next.x + next.w + 6}px`;
          badge.style.top = `${next.y}px`;
          if (label !== undefined) badge.textContent = label;
        }
      },
      remove: () => { ghost.remove(); badge?.remove(); },
    };
  }

  /* -------------------------------------------------------------------- intro */

  private async intro() {
    const duration = this.reduced ? 0.25 : 0.6;
    const target = () => ({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.46 });
    const start = performance.now();
    this.cursors.forEach((c) => { c.el.style.opacity = "1"; });
    await this.flockLoop(duration, target, 1, false);
    if (this.cancelled) return;
    await this.fanOut();
  }

  private async fanOut() {
    const cols = Math.ceil(Math.sqrt(this.cursors.length));
    const rows = Math.ceil(this.cursors.length / cols);
    const points = this.cursors.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: window.innerWidth * (0.14 + (col / Math.max(1, cols - 1)) * 0.72),
        y: window.innerHeight * (0.2 + (row / Math.max(1, rows - 1)) * 0.58),
      };
    });
    await Promise.all(this.cursors.map((c, i) => this.moveTo(c, points[i], { duration: 0.28, bend: 0 })));
  }

  private async flockLoop(duration: number, target: Vec2 | (() => Vec2), scale: number, shrinking: boolean) {
    const start = performance.now();
    const last = { t: performance.now() };
    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        if (this.cancelled) { resolve(); return; }
        const dt = Math.min(0.05, (now - last.t) / 1000);
        last.t = now;
        const progress = Math.min(1, (now - start) / (duration * 1000));
        this.flockStep(dt, typeof target === "function" ? target() : target, shrinking ? scale * (1 - progress * 0.82) : scale);
        this.updateCursorDom();
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  private flockStep(dt: number, target: Vec2, scale: number) {
    const list = this.cursors;
    const time = this.time;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      let cohX = 0, cohY = 0, aliX = 0, aliY = 0, sepX = 0, sepY = 0, count = 0;
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const other = list[j];
        const dx = other.x - c.x;
        const dy = other.y - c.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 190) {
          cohX += other.x; cohY += other.y;
          aliX += other.vx; aliY += other.vy;
          count++;
        }
        if (dist < 68) {
          const push = (68 - dist) / 68;
          sepX -= (dx / dist) * push * 260;
          sepY -= (dy / dist) * push * 260;
        }
      }
      if (count) {
        cohX = (cohX / count - c.x) * 0.55;
        cohY = (cohY / count - c.y) * 0.55;
        aliX = (aliX / count - c.vx) * 0.7;
        aliY = (aliY / count - c.vy) * 0.7;
      }
      const vx = c.x - target.x;
      const vy = c.y - target.y;
      const dist = Math.hypot(vx, vy) || 0.01;
      const nx = vx / dist;
      const ny = vy / dist;
      const ang = Math.atan2(vy, vx);
      const radius = (110 + c.orbit * 0.55) * scale * (1 + 0.18 * Math.sin(time * 0.7 + c.id));
      const radial = clamp((radius - dist) * 4.2, -900, 900);
      const tangent = 230 * (0.8 + c.spin * 0.16) * Math.tanh(Math.cos(time * 0.13) * 3);
      const curl = c.curl * 160;
      let fx = -ny * tangent + nx * radial + cohX + aliX + sepX - ny * curl;
      let fy = nx * tangent + ny * radial + cohY + aliY + sepY + nx * curl;

      if (this.mouse.x > -1000) {
        const mx = c.x - this.mouse.x;
        const my = c.y - this.mouse.y;
        const md = Math.hypot(mx, my) || 1;
        if (md < 70) {
          const push = (70 - md) / 70;
          fx += (mx / md) * push * 600;
          fy += (my / md) * push * 600;
        }
      }

      const maxV = c.speed * (1.2 + Math.min(3, dist / 100));
      const fl = Math.hypot(fx, fy);
      if (fl > maxV) { fx *= maxV / fl; fy *= maxV / fl; }
      let gx = (fx - c.vx) * 4.2;
      let gy = (fy - c.vy) * 4.2;
      const maxF = c.force * (1.3 + Math.min(4, dist / 60));
      const gl = Math.hypot(gx, gy);
      if (gl > maxF) { gx *= maxF / gl; gy *= maxF / gl; }
      c.vx += gx * dt;
      c.vy += gy * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      const want = (Math.atan2(c.vy, c.vx) * 180) / Math.PI + 90;
      c.angle += (want - c.angle) * Math.min(1, dt * 6);
    }
  }

  /* -------------------------------------------------------------------- build */

  private async build() {
    this.cursors.forEach((cursor, index) => this.beginIdle(cursor, 20 + index * 45));
    const pending = [...this.tasks];
    const workers = this.cursors.length;
    const deadline = performance.now() + (this.mobile ? 14000 : 18000);
    let guard = 0;
    while (!this.cancelled && performance.now() < deadline && pending.some((task) => task.state !== "done") && guard++ < 1200) {
      const waiting = pending.filter((task) => task.state === "wait");
      if (!waiting.length) {
        await sleep(30);
        continue;
      }
      let ready = waiting.filter((task) => task.deps.every((dep) => dep.state === "done"));
      if (!ready.length) {
        for (const task of waiting) task.deps = task.deps.filter((dep) => dep.state === "done");
        ready = waiting.filter((task) => task.deps.every((dep) => dep.state === "done"));
        if (!ready.length) {
          for (const task of waiting) task.deps = [];
          ready = waiting;
        }
      }
      ready.sort((a, b) => a.y - b.y);
      const minY = ready[0].y;
      let limit = 900;
      let band = ready.filter((task) => task.y < minY + limit);
      while (band.length < workers && limit < 3600) {
        limit += 600;
        band = ready.filter((task) => task.y < minY + limit);
      }
      const isFixedBand = band.every((task) => task.item?.fixed);
      if (!isFixedBand) {
        const focus = Math.max(minY, ...band.map((task) => task.y)) * 0.5 + minY * 0.5;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const target = clamp(focus - window.innerHeight * 0.42, 0, maxScroll);
        if (Math.abs(target - window.scrollY) > 40) await this.scrollTo(target, 0.16);
        if (this.cancelled) return;
      }
      const slice = band.slice(0, workers);
      await Promise.all(slice.map((task) => this.runTask(task)));
    }
    if (!this.cancelled) {
      await sleep(160);
    }
  }

  private async runTask(task: ReconstructionTask) {
    if (task.state !== "wait" || this.cancelled) return;
    const cursor = this.cursors.find((c) => !c.task) ?? this.cursors[0];
    this.stopIdle(cursor);
    task.state = "active";
    cursor.task = task;
    cursor.worked = true;
    cursor.activity = "working";
    try {
      if (task.kind === "guide" && task.guide) await this.drawGuide(cursor, task.guide);
      else if (task.kind === "dup" && task.group) await this.duplicate(cursor, task.group);
      else if (task.kind === "line" && task.item) await this.drawLine(cursor, task.item);
      else if (task.kind === "text" && task.item) await this.drawText(cursor, task.item);
      else if (task.item) await this.drawBox(cursor, task.item, task.kind === "image");
    } finally {
      task.state = "done";
      task.doneAt = this.time;
      if (task.item) this.revealInstantChildren(task.item);
      cursor.task = null;
      cursor.activity = "idle-active";
      this.setShape(cursor, "arrow");
    }
    await sleep(20);
    this.inviteCollaborator(cursor, task);
    if (!cursor.task && !cursor.moving) {
      this.beginIdle(cursor, rand(60, 300));
    }
  }

  private revealInstantChildren(item: BlueprintItem) {
    if (!item.instant) return;
    for (const child of item.instant) {
      if (child.kind === "text") {
        this.revealText(child, child.totalChars || 0);
        if (child.caret) child.caret.style.display = "none";
      }
      if (child.kind === "line") {
        const path = child.node?.querySelector("path");
        if (path) path.style.strokeDashoffset = "0";
      }
      if (child.node) child.node.style.opacity = "1";
      if (child.kind === "rect" || child.kind === "image" || child.kind === "media") {
        child.placeholder?.style.setProperty("opacity", "0");
        child.finalEl?.classList.add("on");
      }
    }
  }

  private async drawBox(c: SwarmCursor, item: BlueprintItem, isImage: boolean) {
    this.setShape(c, "cross");
    const start = this.screenPoint(item);
    await this.moveTo(c, start);
    if (this.cancelled) return;
    c.press = 1;
    if (item.node) item.node.style.opacity = "1";
    const ghost = this.makeGhost({ x: start.x, y: start.y, w: 0, h: 0 }, { badge: "0 × 0" });
    const endScreen = this.screenPoint(item, { x: item.rect.w, y: item.rect.h });
    await this.moveTo(c, endScreen, {
      drag: true,
      bend: 0,
      speed: 1.5,
      onStep: () => {
        const w = Math.max(0, c.x - start.x);
        const h = Math.max(0, c.y - start.y);
        ghost.update({ x: start.x, y: start.y, w, h }, `${Math.round(w)} × ${Math.round(h)}`);
      },
    });
    ghost.update({ x: start.x, y: start.y, w: item.rect.w, h: item.rect.h }, `${Math.round(item.rect.w)} × ${Math.round(item.rect.h)}`);
    c.press = 0;
    await sleep(20);
    if (item.kind === "rect") {
      item.placeholder?.style.setProperty("opacity", "0");
      item.finalEl?.classList.add("on");
    } else if (item.kind === "image" || item.kind === "media") {
      item.placeholder?.style.setProperty("opacity", "0");
      item.finalEl?.classList.add("on");
    }
    await sleep(isImage ? 90 : 50);
    ghost.remove();
    if (item.node) item.node.style.opacity = "1";
    this.setShape(c, "arrow");
  }

  private async drawText(c: SwarmCursor, item: BlueprintItem) {
    this.setShape(c, "cross");
    const offset = item.snapGuide ? { x: rand(24, 52), y: rand(-6, 6) } : { x: 0, y: 0 };
    if (item.node) {
      item.node.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      item.node.style.opacity = "1";
    }
    const start = this.screenPoint(item);
    await this.moveTo(c, start);
    if (this.cancelled) return;

    const lineH = Math.min(item.rect.h, item.lineHeight || 20);
    if (item.rect.w > 120 || item.rect.h > lineH * 1.6) {
      const ghost = this.makeGhost({ x: start.x, y: start.y, w: 0, h: 0 }, { badge: "0 × 0" });
      await this.moveTo(c, { x: start.x + item.rect.w, y: start.y + lineH }, {
        drag: true,
        bend: 0,
        speed: 1.5,
        onStep: () => {
          const w = Math.max(0, c.x - start.x);
          const h = Math.max(0, c.y - start.y);
          ghost.update({ x: start.x, y: start.y, w, h }, `${Math.round(w)} × ${Math.round(h)}`);
        },
      });
      ghost.remove();
    } else {
      await this.click(c);
    }

    this.setShape(c, "ibeam");
    await this.moveTo(c, { x: start.x + rand(-16, 8), y: start.y + rand(8, 24) }, { speed: 1.4 });
    await this.typeText(c, item);
    await sleep(25);
    if (item.grow && item.node) {
      const steps = [0.18, 0.26, 0.38, 0.5, 0.64, 0.78, 0.9, 1];
      const fs = item.fontSize || 40;
      for (const step of steps) {
        item.node.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${Math.max(step, 16 / fs)})`;
        await sleep(15);
        if (this.cancelled) return;
      }
      item.node.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(1)`;
    }

    this.setShape(c, "arrow");
    if (item.snapGuide) {
      const guide = item.snapGuide;
      const anchor = this.screenPoint(item, { x: Math.min(item.rect.w * 0.4, 60), y: Math.min(item.rect.h * 0.5, 22) });
      await this.moveTo(c, anchor, { speed: 1.2 });
      c.press = 1;
      await this.moveTo(
        c,
        () => ({ x: anchor.x + (item.node ? this.currentOffset(item).x : 0) - (offset.x > 0 ? rand(2, 5) : 0), y: anchor.y }),
        {
          drag: true,
          speed: 1.1,
          onStep: () => {
            const near = Math.abs(c.x - anchor.x) < 9;
            if (near && guide.flash < 0.4) guide.flash = 1;
            const dx = near ? 0 : c.x - anchor.x;
            item.node!.style.transform = `translate(${dx}px, 0px)`;
          },
        },
      );
      if (item.node) item.node.style.transform = "translate(0px, 0px)";
      c.press = 0;
      guide.visible = true;
      guide.shownAt = this.time;
    }
    if (item.caret) item.caret.style.display = "none";
    if (item.node) item.node.style.transform = "translate(0,0) scale(1)";
  }

  private currentOffset(item: BlueprintItem): Vec2 {
    const transform = item.node?.style.transform || "";
    const match = transform.match(/translate\(([-\d.]+)px,?\s*([-\d.]+)?px\)/);
    return { x: match ? parseFloat(match[1]) : 0, y: match && match[2] ? parseFloat(match[2]) : 0 };
  }

  private async typeText(c: SwarmCursor, item: BlueprintItem) {
    const total = item.totalChars || 0;
    if (!item.units || !total) {
      if (item.caret) item.caret.style.display = "none";
      return;
    }
    const cps = clamp(total / 0.35, 120, 420);
    let shown = item.shown || 0;
    let acc = 0;
    const started = performance.now();
    let last = started;
    while (shown < total && !this.cancelled) {
      const now = performance.now();
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      acc += dt * cps;
      const add = Math.floor(acc);
      if (add > 0) {
        acc -= add;
        shown = Math.min(total, shown + add);
        this.revealText(item, shown);
        const elapsed = now - started;
        if (c && elapsed % 240 < 40) c.press = 0.55;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    this.revealText(item, total);
    item.shown = total;
    if (item.caret) item.caret.style.display = "";
    await sleep(25);
  }

  private revealText(item: BlueprintItem, count: number) {
    if (!item.units) return;
    let left = count;
    let lastNode: Node | null = null;
    for (const unit of item.units) {
      const take = left <= 0 ? 0 : left >= unit.len ? unit.len : left;
      left -= take;
      if (unit.type === "text") {
        const want = take >= unit.len ? unit.full : unit.full.slice(0, take);
        if (unit.node.data !== want) unit.node.data = want;
        if (take > 0) lastNode = unit.node;
      } else if (unit.type === "atomic") {
        unit.node.style.visibility = take > 0 ? "" : "hidden";
        if (take > 0) lastNode = unit.node;
      }
    }
    const caret = item.caret;
    if (caret && item.finalEl) {
      caret.style.display = "";
      if (lastNode && lastNode.parentNode && lastNode !== item.finalEl) {
        lastNode.parentNode.insertBefore(caret, lastNode.nextSibling);
      } else {
        item.finalEl.insertBefore(caret, item.finalEl.firstChild);
      }
    }
    item.shown = count;
  }

  private async drawLine(c: SwarmCursor, item: BlueprintItem) {
    const points = item.points || [];
    if (!points.length) return;
    this.setShape(c, "pen");
    if (item.node) item.node.style.opacity = "1";
    const svg = item.node?.querySelector("svg");
    const path = svg?.querySelector("path");
    const length = path?.getTotalLength?.() ?? Math.hypot(item.rect.w, item.rect.h);
    if (path) {
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
    }
    let placed = 0;
    const anchors: HTMLDivElement[] = [];
    for (const point of points) {
      const screen = item.fixed ? point : { x: point.x - window.scrollX, y: point.y - window.scrollY };
      await this.moveTo(c, screen, { bend: rand(-0.01, 0.01) });
      if (this.cancelled) return;
      await this.click(c);
      placed++;
      if (path) {
        const dash = length * (placed / points.length);
        path.style.strokeDashoffset = String(length - dash);
      }
      const anchor = document.createElement("div");
      anchor.style.cssText = `position:fixed;left:${screen.x - 2}px;top:${screen.y - 2}px;width:5px;height:5px;background:#fff;border:1px solid ${c.color};border-radius:50%;z-index:8;pointer-events:none;`;
      this.guideLayer.appendChild(anchor);
      anchors.push(anchor);
      await sleep(15);
    }
    if (path) path.style.strokeDashoffset = "0";
    await sleep(40);
    anchors.forEach((anchor) => anchor.remove());
    this.setShape(c, "arrow");
  }

  private async drawGuide(c: SwarmCursor, guide: Guide) {
    this.rulerWant++;
    guide.dependents = guide.dependents.filter((task) => task.state !== "done");
    try {
      this.setShape(c, "arrow");
      const value = guide.axis === "vertical" ? guide.pos : guide.pos;
      const from = (): Vec2 => guide.axis === "vertical"
        ? { x: 6, y: clamp(value - window.scrollY + rand(-40, 40), 60, window.innerHeight - 60) }
        : { x: clamp(value - window.scrollX + rand(-60, 60), 60, window.innerWidth - 60), y: 6 };
      await this.moveTo(c, from);
      await sleep(80);
      if (this.cancelled) return;
      await this.moveTo(c, from, { speed: 2 });
      this.setShape(c, guide.axis === "vertical" ? "ew" : "ns");
      guide.visible = true;
      guide.opacity = 1;
      guide.shownAt = this.time;
      c.press = 1;
      const destination = (): Vec2 => guide.axis === "vertical"
        ? { x: guide.pos - window.scrollX, y: c.y }
        : { x: c.x, y: guide.pos - window.scrollY };
      await this.moveTo(c, destination, {
        drag: true,
        speed: 1.1,
        bend: 0,
        onStep: () => {
          guide.cur = guide.axis === "vertical" ? c.x + window.scrollX : c.y + window.scrollY;
        },
      });
      guide.cur = guide.pos;
      c.press = 0;
      await sleep(50);
      this.setShape(c, "arrow");
    } finally {
      this.rulerWant = Math.max(0, this.rulerWant - 1);
    }
  }

  private async duplicate(c: SwarmCursor, group: DuplicateGroup) {
    this.setShape(c, "arrow");
    const source = this.screenRect(group.masterRect);
    const destination = this.screenRect(group.copyRect);
    const anchor = { x: source.x + Math.min(source.w * 0.5, 80), y: source.y + Math.min(source.h * 0.5, 40) };
    await this.moveTo(c, anchor);
    if (this.cancelled) return;
    await this.click(c);
    const sourceGhost = this.makeGhost(source, { red: true, badge: `${Math.round(source.w)} × ${Math.round(source.h)}` });
    await sleep(60);
    this.setShape(c, "dup");
    c.press = 1;
    const dragGhost = this.makeGhost(destination, { red: true, badge: `${Math.round(destination.w)} × ${Math.round(destination.h)}` });
    dragGhost.el.style.opacity = "0";
    const offsetX = destination.x - source.x;
    const offsetY = destination.y - source.y;
    await this.moveTo(c, { x: anchor.x + offsetX, y: anchor.y + offsetY }, {
      drag: true,
      speed: 1.1,
      bend: 0,
      onStep: () => {
        const dx = c.x - anchor.x;
        const dy = c.y - anchor.y;
        dragGhost.update({ x: source.x + dx, y: source.y + dy, w: source.w, h: source.h }, `${Math.round(source.w)} × ${Math.round(source.h)}`);
      },
    });
    dragGhost.remove();
    c.press = 0;
    this.showSpacing(source, destination);
    for (let i = 0; i < group.copyItems.length; i++) {
      const item = group.copyItems[i];
      if (item.node) {
        item.node.style.opacity = "0";
        item.node.style.transition = "opacity .28s ease";
        window.setTimeout(() => { if (item.node) item.node.style.opacity = "1"; }, i * 22);
      }
      if (item.kind === "rect" || item.kind === "image" || item.kind === "media") {
        if (item.placeholder) item.placeholder.style.opacity = "0";
        item.finalEl?.classList.add("on");
      }
      if (item.kind === "text") {
        this.revealText(item, item.totalChars || 0);
        if (item.caret) item.caret.style.display = "none";
      }
      if (item.kind === "line") {
        const path = item.node?.querySelector("path");
        if (path) path.style.strokeDashoffset = "0";
      }
    }
    await sleep(140);
    sourceGhost.remove();
    this.setShape(c, "arrow");
  }

  private showSpacing(a: Rect, b: Rect) {
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    let measure: HTMLDivElement | null = null;
    if (overlapY > 0) {
      const y = Math.max(a.y, b.y) + overlapY / 2;
      const [left, right] = a.x < b.x ? [a, b] : [b, a];
      const gap = right.x - (left.x + left.w);
      if (gap > 0) {
        measure = document.createElement("div");
        measure.className = "measure";
        measure.style.left = `${left.x + left.w}px`;
        measure.style.top = `${y}px`;
        measure.style.width = `${gap}px`;
        measure.style.position = "fixed";
        measure.style.zIndex = "9";
        const label = document.createElement("span");
        label.textContent = String(Math.round(gap));
        measure.appendChild(label);
      }
    } else if (overlapX > 0) {
      const x = Math.max(a.x, b.x) + overlapX / 2;
      const [top, bottom] = a.y < b.y ? [a, b] : [b, a];
      const gap = bottom.y - (top.y + top.h);
      if (gap > 0) {
        measure = document.createElement("div");
        measure.className = "measure";
        measure.style.left = `${x}px`;
        measure.style.top = `${top.y + top.h}px`;
        measure.style.width = "1px";
        measure.style.height = `${gap}px`;
        measure.style.position = "fixed";
        measure.style.zIndex = "9";
        const label = document.createElement("span");
        label.textContent = String(Math.round(gap));
        measure.appendChild(label);
      }
    }
    if (measure) {
      this.guideLayer.appendChild(measure);
      window.setTimeout(() => measure?.remove(), 1400);
    }
  }

  private screenRect(rect: Rect): Rect {
    return { x: rect.x - window.scrollX, y: rect.y - window.scrollY, w: rect.w, h: rect.h };
  }

  /* ------------------------------------------------------------------- finale */

  private async finale() {
    this.stopAllIdle();
    for (const guide of this.guides) {
      guide.visible = false;
      guide.el.style.opacity = "0";
    }
    this.rulerWant = 0;
    this.cursors.forEach((c) => {
      if (c.task) return;
      this.setShape(c, "arrow");
    });
    const duration = this.reduced ? 0.3 : 1.3;
    const target = () => ({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.48 });
    const scrollPromise = this.scrollTo(0, this.reduced ? 0.1 : 0.9);
    await this.flockLoop(duration, target, 1, true);
    if (this.cancelled) return;
    await Promise.all(this.cursors.map((c) => {
      c.el.style.transition = "opacity .4s ease";
      c.el.style.opacity = "0";
      return sleep(420);
    }));
    await scrollPromise;
    if (this.cancelled) return;
    this.host.style.transition = "opacity .5s ease";
    this.host.style.opacity = "0";
    await sleep(520);
    this.host.remove();
    this.complete = true;
    this.cancelled = true;
    this.stopAllIdle();
    this.removeListeners();
    this.lenis?.start?.();
  }

  /* --------------------------------------------------------------------- misc */

  private async scrollTo(target: number, duration: number) {
    const from = window.scrollY;
    const delta = target - from;
    if (Math.abs(delta) < 2) return;
    if (duration <= 0.02) {
      window.scrollTo(0, target);
      this.lenis?.scrollTo?.(target, { immediate: true });
      return;
    }
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const step = () => {
        if (this.cancelled) { resolve(); return; }
        const t = Math.min(1, (performance.now() - start) / (duration * 1000));
        const value = from + delta * easeInOut(t);
        window.scrollTo(0, value);
        this.lenis?.scrollTo?.(value, { immediate: true });
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
}

export function revealAllDesignTargets() {
  if (typeof document === "undefined") return;
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-design-target]"));
  for (const target of targets) {
    target.style.removeProperty("opacity");
    target.style.removeProperty("transform");
    target.style.removeProperty("transform-origin");
  }
}
