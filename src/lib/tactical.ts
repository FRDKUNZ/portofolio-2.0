import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { tacticalConfig } from "./tactical-config";

gsap.registerPlugin(ScrollTrigger);

export type TacticalExperience = {
  stage: () => void;
  construct: () => void;
  activateAmbient: () => void;
  revealInstant: () => void;
  destroy: () => void;
};

type GroupState = {
  el: HTMLElement;
  revealed: boolean;
  ambient: boolean;
  trigger?: ScrollTrigger;
};

const FADE_SELECTOR = [
  "[data-tactical-indicator]",
  "[data-tactical-crosshair]",
  "[data-tactical-shape]",
  "[data-tactical-scan]",
  ".tac-bracket",
  ".tac-line-node",
  ".tac-timeline-node",
  ".tac-hero-tick",
  ".tac-about-tick",
  ".tac-work-tick",
  ".tac-case-tick",
].join(",");

export function createTacticalExperience(reducedMotion: boolean): TacticalExperience {
  const states: GroupState[] = Array.from(document.querySelectorAll<HTMLElement>("[data-tactical-group]")).map((el) => ({
    el,
    revealed: false,
    ambient: false,
  }));
  const animations: gsap.core.Animation[] = [];
  const triggers: ScrollTrigger[] = [];
  const cleanups: Array<() => void> = [];
  let phase: "staged" | "ready" | null = null;
  let ambientAllowed = false;
  let destroyed = false;
  const compact = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700);

  const track = <T extends gsap.core.Animation>(animation: T) => {
    animations.push(animation);
    return animation;
  };

  const fadeTargets = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>(FADE_SELECTOR));
  const drawTargets = (root: ParentNode) => Array.from(root.querySelectorAll<SVGGeometryElement>("[data-tactical-draw]"));

  const prepare = () => {
    gsap.set(drawTargets(document), { strokeDasharray: 100, strokeDashoffset: 100 });
    gsap.set(document.querySelectorAll<HTMLElement>("[data-tactical-indicator]"), { opacity: 0, y: 8 });
    gsap.set(document.querySelectorAll<HTMLElement>("[data-tactical-crosshair]"), { opacity: 0, scale: 0.9 });
    gsap.set(document.querySelectorAll<HTMLElement>("[data-tactical-shape], [data-tactical-scan], .tac-bracket"), { opacity: 0 });
    gsap.set(
      document.querySelectorAll<HTMLElement>(".tac-line-node, .tac-timeline-node, .tac-hero-tick, .tac-about-tick, .tac-work-tick, .tac-case-tick"),
      { opacity: 0 },
    );
    if (reducedMotion) {
      gsap.set(document.querySelectorAll<HTMLElement>("[data-tactical-scan]"), { opacity: 0 });
    }
  };

  const startAmbient = (state: GroupState) => {
    if (destroyed || reducedMotion || state.ambient) return;
    if (!ambientAllowed) return;
    state.ambient = true;
    const root = state.el;
    const { duration } = tacticalConfig;

    root.querySelectorAll<HTMLElement>("[data-tactical-crosshair]").forEach((element, index) => {
      const spin = element.querySelector<HTMLElement>(".tac-crosshair-spin");
      const scale = element.querySelector<HTMLElement>(".tac-crosshair-scale");
      if (spin) {
        track(
          gsap.to(spin, {
            rotation: 360,
            duration: gsap.utils.random(duration.rotateMin, duration.rotateMax),
            repeat: -1,
            ease: "none",
            delay: index * 0.45,
          }),
        );
      }
      if (scale) {
        track(
          gsap.to(scale, {
            scale: 1.06,
            duration: 3.4,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: 0.7 + index * 0.2,
          }),
        );
      }
    });

    root.querySelectorAll<HTMLElement>("[data-tactical-spin]").forEach((element, index) => {
      const speed = Number(element.dataset.tacticalSpin) || 26;
      track(gsap.to(element, { rotation: 360, duration: speed, repeat: -1, ease: "none", delay: index * 0.5 }));
    });

    root.querySelectorAll<HTMLElement>("[data-tactical-indicator]").forEach((element, index) => {
      track(
        gsap.to(element, {
          y: -5,
          duration: duration.float + index * 0.35,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 0.8 + index * 0.35,
        }),
      );
    });

    if (!compact) {
      root.querySelectorAll<HTMLElement>("[data-tactical-scan]").forEach((element, index) => {
        const beam = element.querySelector<HTMLElement>(".tac-scan-beam");
        const glow = element.querySelector<HTMLElement>(".tac-scan-glow");
        const markers = element.querySelectorAll<HTMLElement>(".tac-scan-markers i");
        if (!beam) return;
        const timeline = gsap.timeline({ repeat: -1, repeatDelay: 2.8 + index * 0.6, delay: 1.1 + index * 0.9 });
        timeline.fromTo(
          beam,
          { top: "-6%", opacity: 0 },
          { top: "106%", opacity: 0.9, duration: duration.scan, ease: "sine.inOut" },
        );
        if (glow) {
          timeline.fromTo(
            glow,
            { top: "-6%", opacity: 0 },
            { top: "106%", opacity: 0.32, duration: duration.scan, ease: "sine.inOut" },
            0,
          );
        }
        timeline.to([beam, glow].filter(Boolean), { opacity: 0, duration: 0.6 }, "-=0.6");
        if (markers.length) {
          timeline
            .fromTo(
              markers,
              { opacity: 0, scale: 0.6 },
              { opacity: 1, scale: 1, duration: 0.24, stagger: 0.32, ease: "power2.out" },
              0.7,
            )
            .to(markers, { opacity: 0, duration: 0.4, stagger: 0.16 }, "+=0.5");
        }
        track(timeline);
      });
    }

    root.querySelectorAll<HTMLElement>(".tac-timeline-node").forEach((element, index) => {
      const dot = element.querySelector<HTMLElement>("i");
      if (dot) {
        track(
          gsap.to(dot, {
            scale: 1.35,
            opacity: 0.45,
            duration: 2.2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: 0.5 + index * 0.25,
          }),
        );
      }
    });
  };

  const drawGroup = (state: GroupState, immediate = false) => {
    if (destroyed || state.revealed) return;
    state.revealed = true;
    const draws = drawTargets(state.el);
    const fades = fadeTargets(state.el);
    const scans = Array.from(state.el.querySelectorAll<HTMLElement>("[data-tactical-scan]"));
    const indicators = Array.from(state.el.querySelectorAll<HTMLElement>("[data-tactical-indicator]"));
    const crosshairs = Array.from(state.el.querySelectorAll<HTMLElement>("[data-tactical-crosshair]"));
    const soft = Array.from(
      state.el.querySelectorAll<HTMLElement>(
        "[data-tactical-shape], [data-tactical-scan], .tac-bracket, .tac-line-node, .tac-timeline-node, .tac-hero-tick, .tac-about-tick, .tac-work-tick, .tac-case-tick",
      ),
    );

    if (immediate) {
      gsap.set(draws, { strokeDasharray: 100, strokeDashoffset: 0 });
      gsap.set(fades, { opacity: 1, y: 0, scale: 1 });
      if (reducedMotion) gsap.set(scans, { opacity: 0 });
      if (ambientAllowed) startAmbient(state);
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        if (ambientAllowed) startAmbient(state);
      },
    });
    timeline.to(
      draws,
      { strokeDashoffset: 0, duration: tacticalConfig.duration.draw, ease: "power2.inOut", stagger: tacticalConfig.stagger * 0.5 },
      0,
    );
    timeline.to(
      crosshairs,
      { opacity: 1, scale: 1, duration: tacticalConfig.duration.reveal, ease: "power3.out", stagger: tacticalConfig.stagger },
      0.08,
    );
    timeline.to(
      indicators,
      { opacity: 1, y: 0, duration: tacticalConfig.duration.reveal, ease: "power3.out", stagger: tacticalConfig.stagger },
      0.16,
    );
    timeline.to(soft, { opacity: 1, duration: 0.5, ease: "power2.out", stagger: tacticalConfig.stagger * 0.4 }, 0.28);
    track(timeline);
  };

  const createTrigger = (state: GroupState) => {
    const trigger = ScrollTrigger.create({
      trigger: state.el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        drawGroup(state);
      },
      onEnterBack: () => {
        drawGroup(state);
      },
    });
    triggers.push(trigger);
    state.trigger = trigger;
  };

  const stage = () => {
    if (destroyed || phase !== null) return;
    phase = "staged";
    if (reducedMotion) {
      states.forEach((state) => drawGroup(state, true));
      phase = "ready";
      return;
    }
    const hero = states.find((state) => state.el.dataset.tacticalGroup === "hero");
    if (hero) drawGroup(hero);
    else if (states[0]) drawGroup(states[0]);
  };

  const construct = () => {
    if (destroyed || phase === "ready") return;
    phase = "ready";
    if (reducedMotion) {
      states.forEach((state) => drawGroup(state, true));
      return;
    }
    for (const state of states) {
      if (state.revealed) continue;
      if (state.el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        drawGroup(state);
      } else {
        createTrigger(state);
      }
    }
    ScrollTrigger.refresh();
  };

  const revealInstant = () => {
    if (destroyed) return;
    phase = "ready";
    states.forEach((state) => drawGroup(state, true));
  };

  const activateAmbient = () => {
    if (destroyed || reducedMotion) return;
    ambientAllowed = true;
    states.forEach((state) => {
      if (state.revealed) startAmbient(state);
    });
  };

  let parallaxReady = false;
  const setupParallax = () => {
    if (parallaxReady || reducedMotion || typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) return;
    parallaxReady = true;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-tactical-depth]"));
    if (!targets.length) return;
    const setters = targets.map((element) => ({
      depth: Number(element.dataset.tacticalDepth) || 1,
      x: gsap.quickTo(element, "x", { duration: 0.65, ease: "power3.out" }),
      y: gsap.quickTo(element, "y", { duration: 0.65, ease: "power3.out" }),
    }));
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      for (const setter of setters) {
        setter.x(nx * tacticalConfig.parallax * setter.depth);
        setter.y(ny * tacticalConfig.parallax * 0.68 * setter.depth);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    cleanups.push(() => {
      window.removeEventListener("pointermove", onMove);
      targets.forEach((element) => gsap.set(element, { clearProps: "x,y" }));
    });
  };

  prepare();

  const stageWithParallax = () => {
    setupParallax();
    stage();
  };

  const constructWithParallax = () => {
    setupParallax();
    construct();
  };

  return {
    stage: stageWithParallax,
    construct: constructWithParallax,
    activateAmbient,
    revealInstant,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanups.forEach((cleanup) => cleanup());
      cleanups.length = 0;
      triggers.forEach((trigger) => trigger.kill());
      triggers.length = 0;
      states.forEach((state) => {
        state.trigger = undefined;
      });
      animations.forEach((animation) => animation.kill());
      animations.length = 0;
    },
  };
}
