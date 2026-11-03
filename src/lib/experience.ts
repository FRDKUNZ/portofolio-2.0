import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

type LenisLike = {
  scrollTo: (target: number, options?: { duration?: number; immediate?: boolean; easing?: (t: number) => number }) => void;
};

type Experience = {
  activate: () => void;
  destroy: () => void;
};

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function createExperience(lenis: LenisLike, reducedMotion: boolean): Experience {
  let activated = false;
  let destroyed = false;
  const cleanups: Array<() => void> = [];
  const context = gsap.context(() => {});
  let splitInstances: SplitType[] = [];
  let navMarker: HTMLSpanElement | null = null;
  let activeNavLink: HTMLAnchorElement | null = null;

  const addCleanup = (cleanup: () => void) => cleanups.push(cleanup);

  const once = (target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) => {
    target.addEventListener(type, handler, options);
    addCleanup(() => target.removeEventListener(type, handler, options));
  };

  const setupNavigation = () => {
    const header = document.querySelector<HTMLElement>(".topbar");
    const nav = document.querySelector<HTMLElement>(".nav-links");
    const progress = document.querySelector<HTMLElement>(".scroll-progress");
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]'));

    if (nav && !navMarker) {
      navMarker = document.createElement("span");
      navMarker.className = "nav-marker";
      navMarker.setAttribute("aria-hidden", "true");
      nav.appendChild(navMarker);
    }

    const moveMarker = (link: HTMLAnchorElement | null, force = false) => {
      if (!navMarker) return;
      if (!link || window.innerWidth <= 600) {
        gsap.to(navMarker, { opacity: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" });
        if (activeNavLink) {
          activeNavLink.classList.remove("is-active");
          activeNavLink.removeAttribute("aria-current");
        }
        activeNavLink = null;
        return;
      }
      if (activeNavLink === link && !force) return;
      const navRect = nav!.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      if (activeNavLink) {
        activeNavLink.classList.remove("is-active");
        activeNavLink.removeAttribute("aria-current");
      }
      activeNavLink = link;
      link.classList.add("is-active");
      link.setAttribute("aria-current", "location");
      gsap.to(navMarker, {
        x: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
        duration: reducedMotion ? 0 : 0.42,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const measure = () => {
      moveMarker(activeNavLink, true);
    };

    const updateHeader = (y: number) => {
      header?.classList.toggle("is-compressed", y > 24);
      header?.classList.toggle("is-scrolled", y > 8);
    };

    const updateProgress = (y: number) => {
      if (!progress) return;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${clamp(y / max, 0, 1)})`;
    };

    const updateActive = () => {
      const point = window.innerHeight * 0.38;
      let current: HTMLAnchorElement | null = null;
      for (const link of links) {
        const id = link.getAttribute("href")?.slice(1);
        const section = id ? document.getElementById(id) : null;
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        if (rect.top <= point && rect.bottom > point) current = link;
      }
      moveMarker(current);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        updateHeader(y);
        updateProgress(y);
        updateActive();
        ticking = false;
      });
    };
    once(window, "scroll", onScroll, { passive: true });

    const onResize = () => {
      measure();
      const y = window.scrollY;
      updateHeader(y);
      updateProgress(y);
      updateActive();
    };
    once(window, "resize", onResize);
    window.addEventListener("load", measure, { once: true });

    const onLayout = () => {
      const y = window.scrollY;
      updateHeader(y);
      updateProgress(y);
      updateActive();
      ScrollTrigger.refresh();
    };
    window.addEventListener("portfolio:layout", onLayout);
    addCleanup(() => window.removeEventListener("portfolio:layout", onLayout));

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!target) return;
      const hash = target.getAttribute("href");
      if (!hash || hash === "#") return;
      const section = document.querySelector<HTMLElement>(hash);
      if (!section) return;
      event.preventDefault();
      const y = hash === "#home" ? 0 : section.getBoundingClientRect().top + window.scrollY - 62;
      if (reducedMotion) lenis.scrollTo(y, { immediate: true });
      else lenis.scrollTo(y, { duration: 1.15, easing: easeOutCubic });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);
    addCleanup(() => document.removeEventListener("click", onClick));

    const initialY = window.scrollY;
    updateHeader(initialY);
    updateProgress(initialY);
    measure();
    updateActive();
  };

  const setupMagneticElements = () => {
    if (!finePointer() || reducedMotion) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    elements.forEach((element) => {
      const strength = Number(element.dataset.magnetic) || 0.22;
      const max = Number(element.dataset.magneticMax) || 12;
      const xTo = gsap.quickTo(element, "x", { duration: 0.35, ease: "power3.out" });
      const yTo = gsap.quickTo(element, "y", { duration: 0.35, ease: "power3.out" });

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - rect.left - rect.width / 2;
        const dy = event.clientY - rect.top - rect.height / 2;
        xTo(clamp(dx * strength, -max, max));
        yTo(clamp(dy * strength, -max, max));
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
        gsap.to(element, { scale: 1, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      };
      const onDown = () => gsap.to(element, { scale: 0.97, duration: 0.12, ease: "power2.out", overwrite: "auto" });
      const onUp = () => gsap.to(element, { scale: 1, duration: 0.24, ease: "power3.out", overwrite: "auto" });

      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerleave", onLeave);
      element.addEventListener("pointerdown", onDown);
      element.addEventListener("pointerup", onUp);
      element.addEventListener("pointercancel", onLeave);
      addCleanup(() => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
        element.removeEventListener("pointerdown", onDown);
        element.removeEventListener("pointerup", onUp);
        element.removeEventListener("pointercancel", onLeave);
        gsap.set(element, { clearProps: "x,y,scale" });
      });
    });
  };

  const setupHero = () => {
    const hero = document.querySelector<HTMLElement>(".hero");
    const figure = document.querySelector<HTMLElement>(".hero-figure");
    const portrait = document.querySelector<HTMLElement>(".hero-figure .profile-portrait");
    if (!hero) return;

    if (!finePointer() || reducedMotion) {
      hero.style.setProperty("--hero-x", "72%");
      hero.style.setProperty("--hero-y", "42%");
      return;
    }

    const figureX = figure ? gsap.quickTo(figure, "x", { duration: 0.7, ease: "power3.out" }) : null;
    const figureY = figure ? gsap.quickTo(figure, "y", { duration: 0.7, ease: "power3.out" }) : null;
    const portraitX = portrait ? gsap.quickTo(portrait, "x", { duration: 0.8, ease: "power3.out" }) : null;
    const portraitY = portrait ? gsap.quickTo(portrait, "y", { duration: 0.8, ease: "power3.out" }) : null;
    let hoveringFigure = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = hero.getBoundingClientRect();
      const nx = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.7, 0.7);
      const ny = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.7, 0.7);
      const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      hero.style.setProperty("--hero-x", `${(px * 100).toFixed(2)}%`);
      hero.style.setProperty("--hero-y", `${(py * 100).toFixed(2)}%`);
      if (figure) {
        figure.style.setProperty("--figure-x", `${(px * 100).toFixed(2)}%`);
        figure.style.setProperty("--figure-y", `${(py * 100).toFixed(2)}%`);
      }
      figureX?.(nx * 18);
      figureY?.(ny * 12);
      portraitX?.(nx * -10);
      portraitY?.(ny * -8);
    };

    const onLeave = () => {
      hero.style.setProperty("--hero-x", "72%");
      hero.style.setProperty("--hero-y", "42%");
      figureX?.(0);
      figureY?.(0);
      portraitX?.(0);
      portraitY?.(0);
      if (hoveringFigure && portrait) {
        hoveringFigure = false;
        gsap.to(portrait, { scale: 1, duration: 0.55, ease: "power3.out", overwrite: "auto" });
      }
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    addCleanup(() => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      if (figure) gsap.set(figure, { clearProps: "x,y" });
      if (portrait) gsap.set(portrait, { clearProps: "x,y,scale" });
    });

    if (figure && portrait) {
      const onEnter = () => {
        hoveringFigure = true;
        gsap.to(portrait, { scale: 1.035, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      };
      const onFigureLeave = () => {
        hoveringFigure = false;
        gsap.to(portrait, { scale: 1, duration: 0.55, ease: "power3.out", overwrite: "auto" });
      };
      figure.addEventListener("pointerenter", onEnter);
      figure.addEventListener("pointerleave", onFigureLeave);
      addCleanup(() => {
        figure.removeEventListener("pointerenter", onEnter);
        figure.removeEventListener("pointerleave", onFigureLeave);
      });
    }
  };

  const setupHeroTypography = () => {
    if (!finePointer() || reducedMotion) return;
    const spans = Array.from(document.querySelectorAll<HTMLElement>(".hero-name > span"));
    if (!spans.length) return;
    const previousOverflow = spans.map((span) => span.style.overflow);
    spans.forEach((span) => (span.style.overflow = "visible"));
    splitInstances = spans.map((span) => new SplitType(span, { types: "chars", tagName: "span" }));
    const chars = splitInstances.flatMap((instance) => instance.chars ?? []);
    chars.forEach((char) => char.classList.add("hero-char"));
    if (!chars.length) {
      spans.forEach((span, index) => (span.style.overflow = previousOverflow[index]));
      return;
    }

    chars.forEach((char) => {
      const onEnter = () => {
        gsap.to(char, { y: -9, rotateX: -8, color: "#ffffff", duration: 0.28, ease: "power2.out", overwrite: "auto" });
        const index = chars.indexOf(char);
        const neighbours = chars.filter((_, i) => Math.abs(i - index) === 1);
        gsap.to(neighbours, { y: -4, duration: 0.3, ease: "power2.out", delay: 0.015, overwrite: "auto" });
      };
      char.addEventListener("pointerenter", onEnter);
      addCleanup(() => char.removeEventListener("pointerenter", onEnter));
    });
    const title = spans[0].closest<HTMLElement>(".hero-name");
    const onTitleLeave = () => {
      gsap.to(chars, { y: 0, rotateX: 0, clearProps: "color", duration: 0.45, ease: "power3.out", overwrite: "auto" });
    };
    if (title) {
      title.addEventListener("pointerleave", onTitleLeave);
      addCleanup(() => title.removeEventListener("pointerleave", onTitleLeave));
    }
    addCleanup(() => {
      gsap.set(chars, { clearProps: "transform,color" });
      splitInstances.forEach((instance) => instance.revert());
      splitInstances = [];
      spans.forEach((span, index) => (span.style.overflow = previousOverflow[index]));
    });
  };

  const setupProjectPreviews = () => {
    if (!finePointer() || reducedMotion) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".project-card"));
    cards.forEach((card) => {
      const media = card.querySelector<HTMLElement>(".project-media");
      if (!media) return;
      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const rect = media.getBoundingClientRect();
        const nx = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
        const ny = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
        media.style.setProperty("--media-x", (nx * 2).toFixed(3));
        media.style.setProperty("--media-y", (ny * 2).toFixed(3));
      };
      const onLeave = () => {
        media.style.setProperty("--media-x", "0");
        media.style.setProperty("--media-y", "0");
      };
      media.addEventListener("pointermove", onMove);
      media.addEventListener("pointerleave", onLeave);
      addCleanup(() => {
        media.removeEventListener("pointermove", onMove);
        media.removeEventListener("pointerleave", onLeave);
        media.style.removeProperty("--media-x");
        media.style.removeProperty("--media-y");
      });
    });
  };

  const setupScrollReveals = () => {
    if (reducedMotion) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    elements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      gsap.set(element, { opacity: 0, y: 26 });
      context.add(() => {
        ScrollTrigger.create({
          trigger: element,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(element, { opacity: 1, y: 0, duration: 0.82, ease: "power3.out", clearProps: "transform" });
          },
        });
      });
    });

    const staggerGroups: Array<{ selector: string; y: number; stagger: number }> = [
      { selector: ".about-copy p", y: 18, stagger: 0.08 },
      { selector: ".profile-stats > div", y: 16, stagger: 0.06 },
      { selector: ".skill-pills span", y: 10, stagger: 0.025 },
      { selector: ".process-list > div", y: 16, stagger: 0.07 },
    ];
    staggerGroups.forEach(({ selector, y, stagger }) => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (!nodes.length) return;
      if (nodes.every((node) => node.getBoundingClientRect().top > window.innerHeight * 0.92)) {
        gsap.set(nodes, { opacity: 0, y });
        context.add(() => {
          ScrollTrigger.create({
            trigger: nodes[0],
            start: "top 88%",
            once: true,
            onEnter: () => {
              gsap.to(nodes, { opacity: 1, y: 0, duration: 0.6, stagger, ease: "power3.out", clearProps: "transform" });
            },
          });
        });
      }
    });

    const caseImage = document.querySelector<HTMLElement>(".case-image img");
    if (caseImage) {
      context.add(() => {
        gsap.fromTo(
          caseImage,
          { yPercent: -4 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: { trigger: caseImage, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });
    }

    const quote = document.querySelector<HTMLElement>(".quote-card");
    if (quote) {
      context.add(() => {
        gsap.fromTo(
          quote,
          { backgroundPosition: "0% 0%" },
          {
            backgroundPosition: "100% 100%",
            ease: "none",
            scrollTrigger: { trigger: quote, start: "top bottom", end: "bottom top", scrub: 1.2 },
          },
        );
      });
    }
  };

  const setupCustomCursor = () => {
    if (!finePointer() || reducedMotion) return;
    if (document.querySelector(".site-cursor")) return;
    const cursor = document.createElement("div");
    cursor.className = "site-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="site-cursor-dot"></span><span class="site-cursor-ring"><span class="site-cursor-label"></span></span>';
    document.body.appendChild(cursor);
    const label = cursor.querySelector<HTMLElement>(".site-cursor-label");
    const ring = cursor.querySelector<HTMLElement>(".site-cursor-ring");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.19, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.19, ease: "power3.out" });
    let visible = false;

    const show = () => {
      if (visible) return;
      visible = true;
      gsap.to(cursor, { opacity: 1, duration: 0.25, ease: "power2.out" });
    };
    const hide = () => {
      visible = false;
      gsap.to(cursor, { opacity: 0, duration: 0.2, ease: "power2.out" });
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      xTo(event.clientX);
      yTo(event.clientY);
      show();
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest<HTMLElement>("a, button, input, textarea, select, [data-cursor], [role='tab']") ?? null;
      const nextLabel = interactive?.dataset.cursor || "";
      const isView = interactive?.matches(".project-link") ?? false;
      cursor.classList.toggle("is-interactive", Boolean(interactive));
      cursor.classList.toggle("is-view", isView);
      cursor.classList.toggle("has-label", Boolean(nextLabel));
      if (label) label.textContent = nextLabel;
      if (ring && interactive) {
        gsap.to(ring, { scale: isView ? 1.6 : 1.32, duration: 0.24, ease: "power2.out", overwrite: "auto" });
      } else if (ring) {
        gsap.to(ring, { scale: 1, duration: 0.24, ease: "power2.out", overwrite: "auto" });
      }
    };

    const onDown = () => {
      cursor.classList.add("is-pressed");
      if (ring) gsap.to(ring, { scale: 0.82, duration: 0.12, ease: "power2.out", overwrite: "auto" });
    };
    const onUp = () => {
      cursor.classList.remove("is-pressed");
      if (ring) gsap.to(ring, { scale: 1, duration: 0.22, ease: "power3.out", overwrite: "auto" });
    };
    const onLeaveWindow = (event: MouseEvent) => {
      if (!event.relatedTarget) hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("mouseout", onLeaveWindow);
    addCleanup(() => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("mouseout", onLeaveWindow);
      cursor.remove();
    });
  };

  setupNavigation();

  return {
    activate() {
      if (activated || destroyed) return;
      activated = true;
      setupMagneticElements();
      setupHero();
      setupHeroTypography();
      setupProjectPreviews();
      setupScrollReveals();
      setupCustomCursor();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanups.forEach((cleanup) => cleanup());
      cleanups.length = 0;
      splitInstances.forEach((instance) => instance.revert());
      splitInstances = [];
      context.revert();
      navMarker?.remove();
      navMarker = null;
      activeNavLink = null;
    },
  };
}
