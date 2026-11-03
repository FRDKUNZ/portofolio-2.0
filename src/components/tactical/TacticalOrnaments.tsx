import type { CSSProperties, ReactNode } from "react";
import { tacticalConfig, type TacticalSection } from "@/lib/tactical-config";

type StyleProps = { className?: string; style?: CSSProperties };
type Corner = "tl" | "tr" | "bl" | "br";

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

const cornerPaths: Record<Corner, { base: string; accent: string }> = {
  tl: { base: "M14 1H1V14", accent: "M1 1H8M1 1V8" },
  tr: { base: "M18 1H31V14", accent: "M24 1H31M31 1V8" },
  bl: { base: "M1 18V31H14", accent: "M1 24V31M1 31H8" },
  br: { base: "M31 18V31H18", accent: "M31 24V31M24 31H31" },
};

export function AngularCornerBracket({
  corner = "tl",
  size = 28,
  accent = true,
  hover = false,
  className,
  style,
}: {
  corner?: Corner;
  size?: number;
  accent?: boolean;
  hover?: boolean;
} & StyleProps) {
  return (
    <svg
      className={cx("tac-bracket", `tac-bracket--${corner}`, accent && "is-accent", className)}
      style={{ width: size, height: size, ...style }}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      data-tactical-bracket
      data-tactical-hover={hover ? "true" : undefined}
    >
      <path
        className="tac-bracket-base"
        d={cornerPaths[corner].base}
        pathLength={100}
        stroke="currentColor"
        strokeWidth={tacticalConfig.stroke.base}
        data-tactical-draw
      />
      <path
        className="tac-bracket-accent"
        d={cornerPaths[corner].accent}
        stroke="var(--red)"
        strokeWidth={tacticalConfig.stroke.bold}
      />
    </svg>
  );
}

export function TechnicalLine({
  orientation = "horizontal",
  nodes = true,
  accent = false,
  className,
  style,
}: {
  orientation?: "horizontal" | "vertical";
  nodes?: boolean;
  accent?: boolean;
} & StyleProps) {
  const vertical = orientation === "vertical";
  return (
    <div
      className={cx("tac-line", `tac-line--${orientation}`, accent && "is-accent", className)}
      style={style}
      aria-hidden="true"
      data-tactical-line
    >
      <svg className="tac-line-svg" viewBox={vertical ? "0 0 2 120" : "0 0 120 2"} preserveAspectRatio="none">
        <path
          d={vertical ? "M1 0V120" : "M0 1H120"}
          pathLength={100}
          fill="none"
          stroke="currentColor"
          strokeWidth={tacticalConfig.stroke.thin}
          vectorEffect="non-scaling-stroke"
          data-tactical-draw
        />
      </svg>
      {nodes && (
        <>
          <span className="tac-line-node tac-line-node--start" />
          <span className="tac-line-node tac-line-node--end" />
        </>
      )}
    </div>
  );
}

export function CrosshairOrnament({
  size = 54,
  depth = 1,
  className,
  style,
}: {
  size?: number;
  depth?: number;
} & StyleProps) {
  return (
    <div
      className={cx("tac-crosshair", className)}
      style={{ width: size, height: size, ...style }}
      data-tactical-crosshair
      data-tactical-depth={depth}
      data-tactical-anchor
      aria-hidden="true"
    >
      <div className="tac-crosshair-parallax">
        <div className="tac-crosshair-scale">
          <svg className="tac-crosshair-spin" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeDasharray="2 4" />
            <circle cx="32" cy="32" r="2.4" stroke="var(--red)" strokeWidth="1" />
            <path d="M32 2v12M32 50v12M2 32h12M50 32h12" stroke="currentColor" strokeWidth="1" opacity="0.55" />
            <path d="M32 2v6M32 56v6M2 32h6M56 32h6" stroke="var(--red)" strokeWidth="1.2" />
            <path d="M32 20v7M32 37v7M20 32h7M37 32h7" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
            <rect
              x="30"
              y="30"
              width="4"
              height="4"
              transform="rotate(45 32 32)"
              stroke="var(--red)"
              strokeWidth="0.8"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function ScanningBeam({
  className,
  style,
  markers = true,
  hover = false,
}: {
  markers?: boolean;
  hover?: boolean;
} & StyleProps) {
  return (
    <div
      className={cx("tac-scan", hover && "tac-scan--hover", className)}
      style={style}
      data-tactical-scan={hover ? undefined : "true"}
      aria-hidden="true"
    >
      <span className="tac-scan-glow" />
      <span className="tac-scan-beam" />
      {markers && (
        <span className="tac-scan-markers">
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}

type ShapeVariant = "ring" | "triangle" | "diamond" | "square" | "fragment";

function shapeContent(variant: ShapeVariant) {
  if (variant === "triangle") {
    return (
      <>
        <path d="M50 8L92 86H8Z" pathLength={100} stroke="currentColor" strokeWidth="1" data-tactical-draw />
        <path d="M50 30L74 74H26Z" stroke="var(--red)" strokeWidth="0.9" opacity="0.6" />
        <path d="M50 8V30M8 86H26M92 86H74" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
      </>
    );
  }
  if (variant === "diamond") {
    return (
      <>
        <path d="M50 4L96 50L50 96L4 50Z" pathLength={100} stroke="currentColor" strokeWidth="1" data-tactical-draw />
        <path d="M50 20L80 50L50 80L20 50Z" stroke="var(--red)" strokeWidth="0.8" opacity="0.55" />
        <circle cx="50" cy="50" r="3" stroke="var(--red)" strokeWidth="0.9" />
      </>
    );
  }
  if (variant === "square") {
    return (
      <>
        <rect
          x="16"
          y="16"
          width="68"
          height="68"
          transform="rotate(12 50 50)"
          pathLength={100}
          stroke="currentColor"
          strokeWidth="1"
          data-tactical-draw
        />
        <rect x="42" y="42" width="16" height="16" stroke="var(--red)" strokeWidth="0.9" transform="rotate(12 50 50)" />
        <path d="M50 0v8M50 92v8M0 50h8M92 50h8" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
      </>
    );
  }
  if (variant === "fragment") {
    return (
      <>
        <path d="M6 26H40M56 26H94" pathLength={100} stroke="currentColor" strokeWidth="1" data-tactical-draw />
        <path d="M18 50H82" pathLength={100} stroke="var(--red)" strokeWidth="1" data-tactical-draw />
        <path d="M30 74H52M66 74H94" pathLength={100} stroke="currentColor" strokeWidth="1" data-tactical-draw />
        <circle cx="48" cy="26" r="1.6" fill="var(--red)" />
        <circle cx="14" cy="50" r="1.4" fill="currentColor" />
      </>
    );
  }
  return (
    <>
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 7" />
      <circle cx="50" cy="50" r="33" stroke="currentColor" strokeWidth="0.7" opacity="0.6" strokeDasharray="1 5" />
      <path d="M50 6A44 44 0 0 1 94 50" pathLength={100} stroke="var(--red)" strokeWidth="1.3" data-tactical-draw />
      <path d="M50 15v8M50 77v8M15 50h8M77 50h8" stroke="var(--red)" strokeWidth="0.9" opacity="0.8" />
    </>
  );
}

export function GeometricShape({
  variant = "ring",
  size = 84,
  spin = true,
  speed = 26,
  className,
  style,
}: {
  variant?: ShapeVariant;
  size?: number;
  spin?: boolean;
  speed?: number;
} & StyleProps) {
  return (
    <div
      className={cx("tac-shape", `tac-shape--${variant}`, spin && "tac-spin", className)}
      style={{ width: size, height: size, ...style }}
      data-tactical-shape
      data-tactical-spin={spin ? speed : undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" fill="none">
        {shapeContent(variant)}
      </svg>
    </div>
  );
}

export function FloatingIndicator({
  label,
  value,
  align = "left",
  className,
  style,
}: {
  label: string;
  value?: string;
  align?: "left" | "right";
} & StyleProps) {
  return (
    <div
      className={cx("tac-indicator", `tac-indicator--${align}`, className)}
      style={style}
      data-tactical-indicator
      aria-hidden="true"
    >
      <span className="tac-indicator-dot" />
      <span className="tac-indicator-text">
        <span>{label}</span>
        {value && <b>{value}</b>}
      </span>
    </div>
  );
}

export function TacticalTimeline({
  steps = 3,
  className,
  style,
}: {
  steps?: number;
} & StyleProps) {
  return (
    <aside
      className={cx("tac-timeline", className)}
      style={style}
      data-tactical-timeline
      data-swarm-ignore
      aria-hidden="true"
    >
      <svg className="tac-timeline-rail" viewBox="0 0 2 100" preserveAspectRatio="none">
        <path d="M1 0V100" pathLength={100} fill="none" stroke="currentColor" strokeWidth="1" data-tactical-draw />
      </svg>
      {Array.from({ length: steps }, (_, index) => (
        <span
          key={index}
          className="tac-timeline-node"
          style={{ top: `${(index / Math.max(1, steps - 1)) * 100}%` }}
          data-tactical-node
        >
          <i />
          <b>{String(index + 1).padStart(2, "0")}</b>
        </span>
      ))}
    </aside>
  );
}

export function SectionDecoration({ children, className, style }: { children: ReactNode } & StyleProps) {
  return (
    <div className={cx("tac-decoration", className)} style={style} aria-hidden="true" data-swarm-ignore>
      {children}
    </div>
  );
}

export function TacticalOrnamentLayer({ section }: { section: TacticalSection }) {
  const { labels } = tacticalConfig;

  if (section === "hero") {
    return (
      <div className="tactical-layer tactical-layer--hero" data-swarm-ignore aria-hidden="true">
        <TechnicalLine className="tac-hero-line-top" style={{ left: "6.3vw", top: "15%", width: "18vw" }} />
        <TechnicalLine accent className="tac-hero-line-right" style={{ right: "6.3vw", top: "18%", width: "12vw" }} />
        <TechnicalLine
          orientation="vertical"
          nodes={false}
          className="tac-hero-line-side"
          style={{ right: "4.4vw", top: "31%", height: "26%" }}
        />
        <GeometricShape variant="ring" size={250} speed={32} className="tac-hero-ring" style={{ right: "1.5%", top: "27%" }} />
        <GeometricShape
          variant="fragment"
          size={112}
          spin={false}
          className="tac-hero-fragment"
          style={{ left: "7.2vw", bottom: "23%" }}
        />
        <CrosshairOrnament size={58} depth={1.4} className="tac-hero-crosshair" style={{ right: "7.6%", top: "20%" }} />
        <CrosshairOrnament
          size={34}
          depth={0.8}
          className="tac-hero-crosshair tac-hero-crosshair--low"
          style={{ left: "39%", bottom: "15%" }}
        />
        <FloatingIndicator
          label={labels.system}
          value="F / 01"
          className="tac-hero-indicator"
          style={{ left: "6.3vw", bottom: "37%" }}
        />
        <FloatingIndicator
          label={labels.visual}
          align="right"
          className="tac-hero-indicator"
          style={{ right: "6.3vw", top: "25%" }}
        />
        <span className="tac-hero-tick tac-hero-tick--a" />
        <span className="tac-hero-tick tac-hero-tick--b" />
        <span className="tac-hero-tick tac-hero-tick--c" />
      </div>
    );
  }

  if (section === "about") {
    return (
      <div className="tactical-layer tactical-layer--about" data-swarm-ignore aria-hidden="true">
        <TechnicalLine
          orientation="vertical"
          nodes={false}
          className="tac-about-divider"
          style={{ left: "49.8%", top: "9%", height: "82%" }}
        />
        <AngularCornerBracket corner="tl" size={26} className="tac-about-corner" style={{ left: "7.4vw", top: "86px" }} />
        <AngularCornerBracket
          corner="br"
          size={26}
          className="tac-about-corner"
          style={{ right: "7.4vw", bottom: "42px" }}
        />
        <CrosshairOrnament size={44} depth={0.9} className="tac-about-crosshair" style={{ right: "8.6vw", top: "16%" }} />
        <FloatingIndicator
          label={labels.creative}
          value="02"
          className="tac-about-indicator"
          style={{ right: "8.6vw", bottom: "13%" }}
        />
        <FloatingIndicator
          label={labels.coordinate}
          className="tac-about-coordinate"
          style={{ left: "8.6vw", bottom: "6%" }}
        />
        <GeometricShape
          variant="diamond"
          size={66}
          speed={22}
          className="tac-about-shape"
          style={{ left: "3.6vw", top: "32%" }}
        />
        <span className="tac-about-tick" />
      </div>
    );
  }

  if (section === "work") {
    return (
      <div className="tactical-layer tactical-layer--work" data-swarm-ignore aria-hidden="true">
        <TechnicalLine
          orientation="vertical"
          className="tac-work-rail"
          style={{ right: "2.2vw", top: "160px", height: "46%" }}
        />
        <FloatingIndicator
          label={labels.index}
          value={String(13).padStart(3, "0")}
          align="right"
          className="tac-work-indicator"
          style={{ right: "2.2vw", top: "118px" }}
        />
        <GeometricShape
          variant="square"
          size={54}
          speed={20}
          className="tac-work-shape"
          style={{ left: "2.8vw", top: "184px" }}
        />
        <CrosshairOrnament
          size={36}
          depth={0.7}
          className="tac-work-crosshair"
          style={{ right: "2.2vw", top: "calc(46% + 190px)" }}
        />
        <span className="tac-work-tick" />
      </div>
    );
  }

  if (section === "case") {
    return (
      <div className="tactical-layer tactical-layer--case" data-swarm-ignore aria-hidden="true">
        <TechnicalLine className="tac-case-line" style={{ left: "8.5vw", top: "72px", width: "20vw" }} />
        <FloatingIndicator
          label={labels.design}
          value="03"
          className="tac-case-indicator"
          style={{ right: "8.5vw", top: "74px" }}
        />
        <GeometricShape
          variant="triangle"
          size={118}
          speed={30}
          className="tac-case-shape"
          style={{ right: "3.5vw", top: "22%" }}
        />
        <CrosshairOrnament size={46} depth={0.6} className="tac-case-crosshair" style={{ left: "3.5vw", top: "48%" }} />
        <span className="tac-case-tick" />
      </div>
    );
  }

  if (section === "journey") {
    return (
      <div className="tactical-layer tactical-layer--journey" data-swarm-ignore aria-hidden="true">
        <TechnicalLine accent className="tac-journey-line" style={{ left: "8.5vw", top: "96px", width: "13vw" }} />
        <FloatingIndicator
          label={labels.design}
          value="UNIT / 03"
          align="right"
          className="tac-journey-indicator"
          style={{ right: "8.5vw", top: "94px" }}
        />
        <GeometricShape
          variant="ring"
          size={158}
          speed={27}
          className="tac-journey-shape"
          style={{ right: "9%", bottom: "7%" }}
        />
        <CrosshairOrnament size={32} depth={0.6} className="tac-journey-crosshair" style={{ left: "4%", top: "46%" }} />
      </div>
    );
  }

  return (
    <div className="tactical-layer tactical-layer--contact" data-swarm-ignore aria-hidden="true">
      <svg className="tac-converge" viewBox="0 0 1200 620" preserveAspectRatio="none" data-tactical-shape>
        <g fill="none" strokeLinecap="square">
          <path d="M0 70L640 310" pathLength={100} stroke="rgba(255,255,255,0.13)" strokeWidth="1" data-tactical-draw />
          <path d="M0 550L640 310" pathLength={100} stroke="rgba(255,255,255,0.1)" strokeWidth="1" data-tactical-draw />
          <path d="M1200 58L640 310" pathLength={100} stroke="rgba(229,72,89,0.42)" strokeWidth="1" data-tactical-draw />
          <path d="M1200 562L640 310" pathLength={100} stroke="rgba(255,255,255,0.12)" strokeWidth="1" data-tactical-draw />
          <path d="M110 0L640 310L1130 0" pathLength={100} stroke="rgba(229,72,89,0.24)" strokeWidth="1" data-tactical-draw />
          <circle cx="640" cy="310" r="3" fill="rgba(229,72,89,0.9)" />
          <circle cx="640" cy="310" r="14" stroke="rgba(229,72,89,0.5)" strokeWidth="1" strokeDasharray="2 5" />
        </g>
      </svg>
      <CrosshairOrnament size={52} depth={1.1} className="tac-contact-crosshair" style={{ right: "7%", top: "13%" }} />
      <FloatingIndicator
        label={labels.signal}
        value="OPEN"
        align="right"
        className="tac-contact-indicator"
        style={{ right: "8.5vw", top: "88px" }}
      />
      <FloatingIndicator
        label={labels.creative}
        className="tac-contact-indicator"
        style={{ left: "8.5vw", bottom: "9%" }}
      />
      <GeometricShape
        variant="diamond"
        size={76}
        speed={24}
        className="tac-contact-shape"
        style={{ right: "3.4vw", bottom: "16%" }}
      />
      <TechnicalLine
        orientation="vertical"
        nodes={false}
        className="tac-contact-line"
        style={{ left: "4.2vw", top: "16%", height: "34%" }}
      />
    </div>
  );
}
