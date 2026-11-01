import { gsap } from "gsap";

type Corner = "tl" | "tr" | "br" | "bl";
type Task = { id: string; designer: string; corner: Corner };
type Bounds = { left: number; top: number; right: number; bottom: number; width: number; height: number };
type LenisLike = { scrollTo: (value: number, options?: { immediate?: boolean }) => void; start: () => void };

const designers = ["alex", "sarah", "daniel", "michael", "emma"] as const;
const cornerOrigins: Record<Corner, string> = { tl: "0% 0%", tr: "100% 0%", bl: "0% 100%", br: "100% 100%" };

const designGroups: Task[][] = [
  [{ id: "brand", designer: "alex", corner: "br" }, { id: "nav", designer: "michael", corner: "bl" }, { id: "header-cta", designer: "emma", corner: "tr" }],
  [{ id: "hero-copy", designer: "sarah", corner: "tl" }, { id: "hero-visual", designer: "daniel", corner: "tr" }, { id: "hero-index", designer: "emma", corner: "br" }],
  [{ id: "work-heading", designer: "alex", corner: "tl" }, { id: "work-filters", designer: "michael", corner: "br" }],
  [{ id: "project-1", designer: "sarah", corner: "tl" }, { id: "project-2", designer: "daniel", corner: "br" }, { id: "project-3", designer: "michael", corner: "tr" }],
  [{ id: "project-4", designer: "alex", corner: "bl" }, { id: "project-5", designer: "sarah", corner: "tr" }, { id: "project-6", designer: "daniel", corner: "br" }],
  [{ id: "project-7", designer: "michael", corner: "tl" }, { id: "project-8", designer: "emma", corner: "br" }],
  [{ id: "tools", designer: "emma", corner: "tl" }],
  [{ id: "profile-title", designer: "alex", corner: "bl" }, { id: "profile-copy", designer: "emma", corner: "br" }],
  [{ id: "skills", designer: "michael", corner: "tl" }, { id: "quote", designer: "sarah", corner: "br" }],
  [{ id: "case-copy", designer: "sarah", corner: "bl" }, { id: "case-visual", designer: "daniel", corner: "tr" }],
  [{ id: "services-title", designer: "emma", corner: "tl" }, { id: "services-intro", designer: "alex", corner: "bl" }, { id: "services-list", designer: "michael", corner: "br" }],
  [{ id: "contact-copy", designer: "sarah", corner: "bl" }, { id: "contact-details", designer: "michael", corner: "tr" }],
  [{ id: "footer", designer: "emma", corner: "br" }],
];

export function measureTargetBounds(target: HTMLElement): Bounds {
  const rect = target.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
}

class CursorManager {
  private readonly cursors = new Map<string, HTMLElement>();
  private readonly positions = new Map<string, { x: number; y: number }>();
  private readonly timelines = new Map<string, gsap.core.Timeline>();

  constructor() {
    const seeds = [
      { x: 25, y: 88 }, { x: window.innerWidth - 44, y: 108 }, { x: window.innerWidth - 36, y: 154 },
      { x: 48, y: 182 }, { x: window.innerWidth * 0.52, y: 78 },
    ];
    designers.forEach((id, index) => {
      const cursor = document.querySelector<HTMLElement>(`.designer-cursor[data-designer="${id}"]`);
      if (!cursor) return;
      this.cursors.set(id, cursor);
      this.positions.set(id, seeds[index]);
      gsap.set(cursor, { x: seeds[index].x, y: seeds[index].y, autoAlpha: 0 });
    });
  }

  element(id: string) { return this.cursors.get(id); }
  position(id: string) { return this.positions.get(id) ?? { x: 24, y: 88 }; }
  setPosition(id: string, x: number, y: number) { this.positions.set(id, { x, y }); }
  track(id: string, timeline: gsap.core.Timeline) { this.timelines.set(id, timeline); }
  timelinesAll() { return Array.from(this.timelines.values()); }
  clear() { this.timelines.clear(); this.positions.clear(); }
}

class SelectionManager {
  private readonly frames = new Map<string, HTMLElement>();
  private readonly observers = new Map<string, ResizeObserver>();

  constructor() {
    designers.forEach((id) => {
      const frame = document.querySelector<HTMLElement>(`.designer-selection[data-designer="${id}"]`);
      if (frame) this.frames.set(id, frame);
      if (frame) gsap.set(frame, { autoAlpha: 0 });
    });
  }

  frameFor(id: string) { return this.frames.get(id); }

  measureAndPlace(target: HTMLElement, frame: HTMLElement) {
    const bounds = measureTargetBounds(target);
    gsap.set(frame, { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height });
    const label = frame.querySelector<HTMLElement>(".selection-measure");
    if (label) label.textContent = `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`;
    return bounds;
  }

  watch(target: HTMLElement, frame: HTMLElement) {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => this.measureAndPlace(target, frame));
    observer.observe(target);
    this.observers.set(frame.dataset.designer ?? "", observer);
  }

  unwatch(id: string) { this.observers.get(id)?.disconnect(); this.observers.delete(id); }
  hide(id: string) { const frame = this.frameFor(id); if (frame) gsap.to(frame, { autoAlpha: 0, duration: 0.14, overwrite: true }); this.unwatch(id); }
  disconnect() { this.observers.forEach((observer) => observer.disconnect()); this.observers.clear(); }
}

class AutoScrollController {
  private readonly tweens: gsap.core.Tween[] = [];
  constructor(private readonly lenis: LenisLike) {}

  async scrollToNextDesignTarget(targets: HTMLElement[]) {
    if (!targets.length) return;
    if (targets.every((target) => target.closest(".topbar"))) return;
    const boxes = targets.map(measureTargetBounds).filter((box) => box.width > 1 && box.height > 1);
    if (!boxes.length) return;
    const headerHeight = document.querySelector<HTMLElement>(".topbar")?.getBoundingClientRect().height ?? 0;
    const top = Math.min(...boxes.map((box) => box.top));
    const bottom = Math.max(...boxes.map((box) => box.bottom));
    const available = Math.max(200, window.innerHeight - headerHeight - 24);
    const focus = bottom - top <= available ? (top + bottom) / 2 : boxes[0].top + boxes[0].height / 2;
    const visibleCenter = headerHeight + (window.innerHeight - headerHeight) / 2;
    const destination = gsap.utils.clamp(0, document.documentElement.scrollHeight - window.innerHeight, window.scrollY + focus - visibleCenter);
    if (Math.abs(destination - window.scrollY) < 36) return;
    const state = { y: window.scrollY };
    await new Promise<void>((resolve) => {
      const tween = gsap.to(state, {
        y: destination,
        duration: window.innerWidth < 700 ? 0.62 : 0.72,
        ease: "power2.inOut",
        onUpdate: () => this.lenis.scrollTo(state.y, { immediate: true }),
        onComplete: resolve,
        onInterrupt: resolve,
      });
      this.tweens.push(tween);
    });
  }

  kill() { this.tweens.forEach((tween) => tween.kill()); this.tweens.length = 0; }
}

class ElementAnimationManager {
  private readonly active = new Set<string>();
  constructor(private readonly cursors: CursorManager, private readonly selections: SelectionManager) {}

  private moveCursorToElement(timeline: gsap.core.Timeline, cursor: HTMLElement, id: string, x: number, y: number, duration: number) {
    timeline.to(cursor, { x, y, duration, ease: "power3.inOut" });
  }

  private showBoundingBox(frame: HTMLElement, target: HTMLElement, corner: Corner) {
    const path = frame.querySelector<SVGPathElement>("path");
    const handles = frame.querySelectorAll<HTMLElement>(".selection-handle");
    if (path) gsap.set(path, { strokeDasharray: 400, strokeDashoffset: 400 });
    gsap.set(handles, { autoAlpha: 0 });
    this.selections.measureAndPlace(target, frame);
    gsap.set(frame, { autoAlpha: 1 });
    frame.dataset.corner = corner;
  }

  private dragCornerHandle(target: HTMLElement, frame: HTMLElement, cursor: HTMLElement, id: string, corner: Corner, timeline: gsap.core.Timeline) {
    const progress = { value: 0 };
    const fixedRight = corner.includes("r");
    const fixedBottom = corner.includes("b");
    const movingCorner = () => {
      const rect = target.getBoundingClientRect();
      return { x: fixedRight ? rect.left : rect.right, y: fixedBottom ? rect.top : rect.bottom };
    };
    timeline.to(progress, {
      value: 1,
      duration: 0.62,
      ease: "power3.out",
      onUpdate: () => {
        gsap.set(target, { scaleX: 0.035 + progress.value * 0.965, scaleY: 0.035 + progress.value * 0.965 });
        this.selections.measureAndPlace(target, frame);
        const point = movingCorner();
        gsap.set(cursor, { x: point.x, y: point.y });
      },
    });
    timeline.call(() => this.cursors.setPosition(id, movingCorner().x + 14, movingCorner().y + 14));
  }

  private scaleElementFromCorner(target: HTMLElement, frame: HTMLElement, cursor: HTMLElement, id: string, corner: Corner, timeline: gsap.core.Timeline) {
    this.dragCornerHandle(target, frame, cursor, id, corner, timeline);
  }

  private revealElementContent(target: HTMLElement) {
    gsap.set(target, { opacity: 1 });
  }

  private hideSelectionGuides(id: string) {
    this.selections.hide(id);
    const cursor = this.cursors.element(id);
    if (cursor) gsap.set(cursor, { autoAlpha: 0 });
  }

  private releaseElement(target: HTMLElement, id: string) {
    gsap.set(target, { clearProps: "transform,transformOrigin,opacity" });
    this.hideSelectionGuides(id);
  }

  async selectElement(task: Task, target: HTMLElement) {
    if (this.active.has(task.id)) return;
    const cursor = this.cursors.element(task.designer);
    const frame = this.selections.frameFor(task.designer);
    if (!cursor || !frame) return;
    this.active.add(task.id);
    const origin = cornerOrigins[task.corner];
    const finalBounds = measureTargetBounds(target);
    if (finalBounds.width < 2 || finalBounds.height < 2) { this.active.delete(task.id); return; }
    gsap.set(target, { transformOrigin: origin, scaleX: 0.035, scaleY: 0.035, opacity: 0 });
    this.showBoundingBox(frame, target, task.corner);
    this.selections.watch(target, frame);
    const oldPos = this.cursors.position(task.designer);
    const right = task.corner.includes("r"), bottom = task.corner.includes("b");
    const collapsedBounds = measureTargetBounds(target);
    const initialHandle = { x: right ? collapsedBounds.left : collapsedBounds.right, y: bottom ? collapsedBounds.top : collapsedBounds.bottom };
    const timeline = gsap.timeline();
    this.cursors.track(task.designer, timeline);
    timeline.call(() => this.revealElementContent(target), [], 0);
    gsap.set(cursor, { x: Math.min(window.innerWidth - 24, Math.max(8, oldPos.x)), y: Math.min(window.innerHeight - 30, Math.max(72, oldPos.y)), autoAlpha: 1 });
    this.moveCursorToElement(timeline, cursor, task.designer, initialHandle.x, initialHandle.y, 0.28 + (designers.indexOf(task.designer as typeof designers[number]) % 3) * 0.045);
    timeline.to(frame.querySelectorAll<HTMLElement>(".selection-handle"), { autoAlpha: 1, duration: 0.1, stagger: 0.016 }, "<+0.04");
    const path = frame.querySelector<SVGPathElement>("path");
    if (path) timeline.to(path, { strokeDashoffset: 0, duration: 0.28, ease: "power2.out" }, "<");
    this.scaleElementFromCorner(target, frame, cursor, task.designer, task.corner, timeline);
    timeline.to([frame, cursor], { autoAlpha: 0, duration: 0.16, ease: "power2.out" });
    await new Promise<void>((resolve) => {
      timeline.eventCallback("onComplete", resolve);
      timeline.eventCallback("onInterrupt", resolve);
    });
    this.active.delete(task.id);
    this.releaseElement(target, task.designer);
  }
}

export class CollaborativeAnimationController {
  private readonly cursors = new CursorManager();
  private readonly selections = new SelectionManager();
  private readonly autoScroll: AutoScrollController;
  private readonly elements: ElementAnimationManager;
  private readonly targets = new Map<string, HTMLElement>();
  private cancelled = false;
  private complete = false;
  private removeListeners = () => {};

  constructor(private readonly lenis: LenisLike) {
    this.autoScroll = new AutoScrollController(lenis);
    this.elements = new ElementAnimationManager(this.cursors, this.selections);
    document.querySelectorAll<HTMLElement>("[data-design-target]").forEach((element) => {
      const id = element.dataset.designTarget;
      if (id) this.targets.set(id, element);
    });
  }

  private revealAll() {
    gsap.set(Array.from(this.targets.values()), { clearProps: "transform,transformOrigin,opacity" });
    gsap.set(".designer-cursor, .designer-selection", { autoAlpha: 0 });
  }

  private onUserInput = () => this.cancel();

  private listen() {
    window.addEventListener("wheel", this.onUserInput, { passive: true });
    window.addEventListener("touchstart", this.onUserInput, { passive: true });
    window.addEventListener("pointerdown", this.onUserInput, { passive: true });
    window.addEventListener("keydown", this.onUserInput);
    window.addEventListener("resize", this.onUserInput);
    this.removeListeners = () => {
      window.removeEventListener("wheel", this.onUserInput);
      window.removeEventListener("touchstart", this.onUserInput);
      window.removeEventListener("pointerdown", this.onUserInput);
      window.removeEventListener("keydown", this.onUserInput);
      window.removeEventListener("resize", this.onUserInput);
    };
  }

  async play() {
    gsap.set(Array.from(this.targets.values()), { opacity: 0, scaleX: 1, scaleY: 1 });
    gsap.set(".designer-cursor, .designer-selection", { autoAlpha: 0 });
    this.listen();
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    if (this.cancelled) return;
    for (const group of designGroups) {
      if (this.cancelled) break;
      const tasks = group.filter((task) => this.targets.has(task.id));
      const visibleTargets = tasks.map((task) => this.targets.get(task.id)!).filter((target) => target.getBoundingClientRect().width > 1 && target.getBoundingClientRect().height > 1);
      if (!visibleTargets.length) continue;
      await this.autoScroll.scrollToNextDesignTarget(visibleTargets);
      if (this.cancelled) break;
      const inViewport = (target: HTMLElement) => {
        if (target.closest(".topbar")) return true;
        const rect = target.getBoundingClientRect();
        const headerHeight = document.querySelector<HTMLElement>(".topbar")?.getBoundingClientRect().height ?? 0;
        return rect.top >= headerHeight && rect.bottom <= window.innerHeight - 12;
      };
      if (visibleTargets.every(inViewport)) {
        await Promise.all(tasks.map((task) => this.elements.selectElement(task, this.targets.get(task.id)!)));
      } else {
        for (const task of tasks) {
          if (this.cancelled) break;
          const target = this.targets.get(task.id)!;
          await this.autoScroll.scrollToNextDesignTarget([target]);
          if (!this.cancelled) await this.elements.selectElement(task, target);
        }
      }
    }
    if (!this.cancelled) {
      this.complete = true;
      this.removeListeners();
      this.revealAll();
    }
  }

  cancel() {
    if (this.cancelled || this.complete) return;
    this.cancelled = true;
    this.removeListeners();
    this.autoScroll.kill();
    this.cursors.timelinesAll().forEach((timeline) => timeline.kill());
    this.selections.disconnect();
    this.revealAll();
    this.lenis.start();
  }

  destroy() {
    this.cancel();
    this.removeListeners();
    this.selections.disconnect();
    this.autoScroll.kill();
    this.cursors.clear();
  }
}

export function revealAllDesignTargets() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-design-target]"));
  gsap.set(targets, { clearProps: "transform,transformOrigin,opacity" });
  gsap.set(".designer-cursor, .designer-selection", { autoAlpha: 0 });
}
