export const tacticalConfig = {
  colors: {
    red: "#e54859",
    redDim: "rgba(229,72,89,0.45)",
    redFaint: "rgba(229,72,89,0.2)",
    white: "rgba(243,242,241,0.62)",
    muted: "rgba(146,147,155,0.5)",
    line: "rgba(255,255,255,0.16)",
    lineFaint: "rgba(255,255,255,0.09)",
  },
  stroke: {
    hair: 0.8,
    thin: 1,
    base: 1.25,
    bold: 1.75,
  },
  opacity: {
    ghost: 0.24,
    muted: 0.42,
    base: 0.68,
    strong: 0.92,
  },
  duration: {
    micro: 0.24,
    draw: 0.92,
    reveal: 0.72,
    rotateMin: 18,
    rotateMax: 34,
    scan: 6.2,
    float: 5.4,
  },
  stagger: 0.1,
  parallax: 12,
  labels: {
    system: "SYSTEM / 001",
    visual: "VISUAL DATA",
    design: "DESIGN UNIT",
    index: "PROJECT INDEX",
    creative: "CREATIVE SYSTEM",
    signal: "SIGNAL / OPEN",
    coordinate: "34° 12' 07\" N · 118° 14' 22\" W",
  },
} as const;

export type TacticalSection = "hero" | "about" | "work" | "case" | "journey" | "contact";
