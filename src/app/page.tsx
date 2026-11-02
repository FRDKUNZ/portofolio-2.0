"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import { ArrowDown, ArrowRight, ArrowUpRight, Github, Instagram, Menu, X, Youtube } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Lenis from "@studio-freight/lenis";
import { projects, filters, type Project } from "@/data/portfolio";
import { contact, profile, services, skillGroups } from "@/data/site-content";
import { motion } from "@/lib/animations";
import { SwarmReconstruction, revealAllDesignTargets } from "@/lib/swarm-reconstruction";

gsap.registerPlugin(ScrollTrigger, Flip);
const allSkills = skillGroups.flatMap((group) => group.tools);
const categoryLabels: Record<string, string> = { design: "Desain Grafis", video: "Video Editing", code: "Pemrograman" };

declare global {
  interface Window { emailjs?: { send: (serviceId: string, templateId: string, values: Record<string, string>, options: { publicKey: string }) => Promise<unknown> } }
}

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleProjects = projects.filter((project) => filter === "All" || project.category === filter);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: !reducedMotion, wheelMultiplier: 0.88 });
    let frame = 0;
    const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
    frame = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);

    let controller: SwarmReconstruction | undefined;
    if (reducedMotion) revealAllDesignTargets();
    else { controller = new SwarmReconstruction(lenis); void controller.play(); }
    return () => { controller?.destroy(); cancelAnimationFrame(frame); lenis.destroy(); };
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedProject(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedProject]);

  function changeFilter(next: string) {
    const grid = gridRef.current;
    if (!grid || next === filter) return setFilter(next);
    const state = Flip.getState(".project-card");
    setFilter(next);
    requestAnimationFrame(() => Flip.from(state, { duration: motion.filter, ease: "power2.inOut", absolute: true, stagger: motion.filterStagger, onEnter: (elements) => gsap.fromTo(elements, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: motion.filterEnter }) }));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formStatus === "sending") return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
      setFormStatus("error");
      return;
    }
    if (!window.emailjs) { setFormStatus("error"); return; }
    setFormStatus("sending");
    try {
      await window.emailjs.send(contact.emailJs.serviceId, contact.emailJs.templateId, { from_name: name, from_email: email, reply_to: email, message }, { publicKey: contact.emailJs.publicKey });
      form.reset();
      setFormStatus("sent");
    } catch (error) {
      console.error("EmailJS send failed:", error);
      setFormStatus("error");
    }
  }

  return <main>
    <Script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" strategy="afterInteractive" />
    <header className="topbar">
      <a className="brand" data-design-target="brand" href="#home" aria-label="Ferdiansyah home">FERDIANSYAH<span className="brand-dot">.</span></a>
      <nav className={menuOpen ? "nav-links open" : "nav-links"} data-design-target="nav" aria-label="Navigasi utama">
        <a href="#work" onClick={() => setMenuOpen(false)}>Karya</a><a href="#about" onClick={() => setMenuOpen(false)}>Tentang</a><a href="#services" onClick={() => setMenuOpen(false)}>Keahlian</a><a href="#contact" onClick={() => setMenuOpen(false)}>Kontak</a>
      </nav>
      <a className="header-cta" data-design-target="header-cta" href="#contact">HUBUNGI SAYA <ArrowUpRight size={13}/></a>
      <button className="menu-toggle" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}<span>{menuOpen ? "TUTUP" : "MENU"}</span></button>
    </header>

    <section className="hero" id="home">
      <div className="hero-noise" />
      <div className="hero-side-note">VIDEO EDITOR · DESAINER · PROGRAMMER<br/>BERBASIS DI INDONESIA</div>
      <div className="hero-copy-wrap" data-design-target="hero-copy">
        <p className="hero-kicker"><span className="live-dot"/> KREATOR INDEPENDEN · INDONESIA</p>
        <h1 className="hero-name" aria-label={profile.name}><span>FERDIAN</span><span>SYAH</span></h1>
        <div className="hero-bottom">
          <p className="hero-copy">{profile.hero.id}</p>
          <a href="#work" className="hero-cta">LIHAT KARYA SAYA <ArrowDown size={14}/></a>
        </div>
      </div>
      <div className="hero-figure" data-design-target="hero-visual"><div className="figure-backdrop"/><img className="profile-portrait" src={profile.photo} alt="Foto Ferdiansyah"/><span className="figure-label">F / 01</span></div>
      <div className="hero-index" data-design-target="hero-index"><span>01</span><i/> 04</div>
    </section>

    <section className="work section-wrap" id="work">
      <div className="section-topline" data-reveal><span>01 / KARYA TERPILIH</span><span>{String(projects.length).padStart(2, "0")} PROYEK</span></div>
      <div className="work-heading" data-design-target="work-heading" data-reveal><div><p className="eyebrow"><span/> KARYA / CERITA VISUAL</p><h2>KARYA YANG BICARA<span>.</span></h2></div><a className="text-link" href="#contact">MULAI PROYEK <ArrowRight size={13}/></a></div>
      <div className="filter-row" data-design-target="work-filters" role="tablist" aria-label="Filter proyek" data-reveal>{filters.map((item) => <button key={item.id} className={filter === item.id ? "filter active" : "filter"} role="tab" aria-selected={filter === item.id} onClick={() => changeFilter(item.id)}>{item.label}<span>{String(item.id === "All" ? projects.length : projects.filter((project) => project.category === item.id).length).padStart(2, "0")}</span></button>)}</div>
      <div className="project-grid" ref={gridRef}>{visibleProjects.map((project) => {
        const projectIndex = projects.indexOf(project) + 1;
        const thumbnail = project.media.find((media) => media.type === "image") ?? project.media[0];
        const previewVideo = project.media.find((media) => media.type === "video");
        return <article className="project-card" key={project.id} data-design-target={`project-${projectIndex}`} data-project-target data-tone="pearl">
          <button type="button" className="project-link" aria-label={`Lihat detail ${project.title.id}`} onClick={() => setSelectedProject(project)}>
            <div className="project-media">
              <img src={thumbnail.src} alt={thumbnail.caption} loading="lazy" style={{ objectFit: thumbnail.fit ?? "cover" }}/>
              {previewVideo && <video className="project-hover-video" src={previewVideo.src} muted loop playsInline preload="none" aria-hidden="true" onMouseEnter={(event) => { void event.currentTarget.play().catch(() => {}); }} onMouseLeave={(event) => { event.currentTarget.pause(); event.currentTarget.currentTime = 0; }}/ >}
              <span className="media-index">{String(projectIndex).padStart(2, "0")}</span><span className="media-arrow"><ArrowUpRight size={17}/></span><span className="media-play">LIHAT PROYEK <ArrowRight size={12}/></span>
            </div>
            <div className="project-info"><span className="project-number">{String(projectIndex).padStart(2, "0")}</span><div><h3>{project.title.id}</h3><p>{categoryLabels[project.category]} <span>· {project.year}</span></p></div><ArrowUpRight className="project-out" size={16}/></div>
          </button>
        </article>;
      })}</div>
    </section>

    <section className="tools-strip section-wrap" data-design-target="tools" aria-label="Keahlian dan perangkat lunak"><span className="tools-label">PERANGKAT / SOFTWARE</span><div className="tool-marquee">{allSkills.slice(0, 8).map((skill) => <span key={skill}>{skill}<i>·</i></span>)}</div></section>

    <section className="recognition section-wrap" id="about">
      <div className="recognition-title" data-design-target="profile-title" data-reveal><p className="eyebrow">02 / TENTANG SAYA</p><h2>BUKAN SEKADAR<br/>SOAL ALAT.<br/><span>LEBIH DARI ITU.</span></h2><p>Lebih tentang cara saya memahami setiap proyek.</p></div>
      <div className="recognition-content design-pass" data-design-target="profile-copy" data-reveal><p className="eyebrow">TENTANG / LATAR BELAKANG</p><div className="about-copy">{profile.biography.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="profile-stats">{profile.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div></div>
      <div className="skills-board design-pass" data-design-target="skills" data-reveal><div className="board-heading"><span>KEAHLIAN & PERANGKAT</span><span>{allSkills.length} SKILL</span></div><div className="skill-pills">{allSkills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
      <div className="quote-card" data-design-target="quote" data-reveal><span className="quote-mark">“</span><p>{profile.hero.id}</p><cite>FERDIANSYAH · {profile.location.toUpperCase()}</cite></div>
    </section>

    <section className="case-study section-wrap">
      <div className="section-topline" data-reveal><span>03 / PROYEK PILIHAN</span><span>GUSION MOTION EDIT</span></div>
      <div className="case-layout"><div className="case-copy" data-design-target="case-copy" data-reveal><p className="eyebrow">VIDEO / 2025</p><h2>GUSION<br/><span>MOTION.</span></h2><p>{projects.find((project) => project.id === "gusion-motion-edit")?.description.id}</p><a href="#work" className="text-link">JELAJAHI PROYEK <ArrowUpRight size={15}/></a></div><div className="case-image design-pass" data-design-target="case-visual"><img src="/portfolio/images/gs.png" alt="Artwork Gusion Motion Edit" loading="lazy"/><span>GUSION MOTION EDIT — FERDIANSYAH</span></div></div>
    </section>

    <section className="journey section-wrap" id="services">
      <div className="section-topline" data-reveal><span>04 / LAYANAN</span><span>VIDEO · DESAIN · PEMROGRAMAN</span></div>
      <div className="journey-heading" data-design-target="services-title" data-reveal><p className="eyebrow">LAYANAN / KAPABILITAS</p><h2>IDE MENJADI<br/><span>KARYA NYATA.</span></h2></div>
      <div className="journey-grid"><div className="journey-intro" data-design-target="services-intro" data-reveal><p>{profile.roles.join(", ")} — menggabungkan kreativitas visual dengan kemampuan teknis untuk menghasilkan karya yang bermakna.</p><span>VIDEO · DESAIN · KODE</span></div><div className="process-list design-pass" data-design-target="services-list" data-reveal>{services.map((service, index) => <div key={service.title}><span>0{index + 1}</span><strong>{service.title}</strong><small>{service.description}</small><ArrowUpRight size={14}/><ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}</div></div>
    </section>

    <section className="contact section-wrap" id="contact"><div className="section-topline" data-reveal><span>05 / HUBUNGI SAYA</span><span>{profile.location.toUpperCase()}</span></div><div className="contact-layout"><div className="contact-body" data-design-target="contact-copy" data-reveal><p className="eyebrow">PUNYA PROYEK?</p><h2>MARI KITA<br/>DISKUSIKAN<span>.</span></h2><p>Saya biasanya merespons dalam 1–2 hari kerja. Jika diperlukan, kita bisa menjadwalkan diskusi terlebih dahulu.</p><a className="contact-button" href={`mailto:${contact.email}`}>KIRIM EMAIL <ArrowUpRight size={16}/></a><div className="contact-socials">{contact.socials.map((social) => { const Icon = social.name === "GitHub" ? Github : social.name === "YouTube" ? Youtube : Instagram; return <a key={social.name} href={social.href} aria-label={social.name} target="_blank" rel="noreferrer"><Icon size={16}/></a>; })}</div></div><div className="contact-right" data-design-target="contact-details"><div className="contact-details" data-reveal><a href={`mailto:${contact.email}`}><small>EMAIL</small><strong>{contact.email}</strong><ArrowUpRight size={14}/></a><div><small>LOKASI</small><strong>{contact.location}</strong><ArrowUpRight size={14}/></div><div><small>WAKTU RESPONS</small><strong>{contact.responseTime}</strong><ArrowUpRight size={14}/></div></div><form className="contact-form design-pass" onSubmit={sendMessage} noValidate><label htmlFor="contact-name">Nama lengkap</label><input id="contact-name" name="name" required minLength={2} autoComplete="name" placeholder="Nama lengkap" onChange={() => formStatus === "error" && setFormStatus("idle")}/><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" required autoComplete="email" placeholder="Alamat email" onChange={() => formStatus === "error" && setFormStatus("idle")}/><label htmlFor="project-message">Pesan</label><textarea id="project-message" name="message" required minLength={10} placeholder="Ceritakan proyek Anda" onChange={() => formStatus === "error" && setFormStatus("idle")}/><button type="submit" aria-label="Kirim pesan" disabled={formStatus === "sending"}><ArrowUpRight size={18}/></button><span className={`form-status ${formStatus}`} aria-live="polite">{formStatus === "sending" ? "Mengirim pesan…" : formStatus === "sent" ? "Pesan terkirim. Terima kasih." : formStatus === "error" ? "Periksa nama, email, dan pesan (minimal 10 karakter), lalu coba lagi." : ""}</span></form><div className="contact-stamp">FERDI<br/><span>ANSYAH.</span><i>CREATIVE PORTFOLIO</i></div></div></div></section>
    <footer className="footer" data-design-target="footer"><a className="brand" href="#home">FERDIANSYAH<span className="brand-dot">.</span></a><span>VIDEO EDITOR · DESAINER GRAFIS · PROGRAMMER</span><a href="#home" className="back-top">KEMBALI KE ATAS ↑</a></footer>

    {selectedProject && <div className="project-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProject(null); }}><div className="project-modal-panel" role="dialog" aria-modal="true" aria-labelledby="project-modal-title"><button className="project-modal-close" type="button" aria-label="Tutup detail proyek" onClick={() => setSelectedProject(null)}><X size={18}/></button><p className="eyebrow">{categoryLabels[selectedProject.category]} / {selectedProject.year}</p><h2 id="project-modal-title">{selectedProject.title.id}</h2><p className="project-modal-description">{selectedProject.description.id}</p><div className="project-modal-tags">{selectedProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="project-modal-gallery">{selectedProject.media.map((media) => media.type === "video" ? <video key={media.src} src={media.src} controls playsInline preload="metadata" /> : <img key={media.src} src={media.src} alt={media.caption} loading="lazy" style={{ objectFit: media.fit ?? "cover" }}/>)}</div>{selectedProject.link && <a className="text-link" href={selectedProject.link} target="_blank" rel="noreferrer">BUKA PROYEK <ArrowUpRight size={14}/></a>}</div></div>}

  </main>;
}
