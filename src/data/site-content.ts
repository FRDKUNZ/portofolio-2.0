export type BilingualText = { id: string; en: string };

export const profile = {
  name: "Ferdiansyah",
  mark: "ferdi.",
  roles: ["Video Editor", "Desainer Grafis", "Programmer"],
  location: "Indonesia",
  email: "ferdiansyh152@gmail.com",
  hero: {
    id: "Video editor, desainer grafis, dan programmer. Menggabungkan kreativitas visual dengan kemampuan teknis untuk menghasilkan karya yang bermakna.",
    en: "Video editor, graphic designer, and programmer. Combining visual creativity with technical skills to produce meaningful work.",
  } satisfies BilingualText,
  biography: [
    "Perjalanan saya dimulai dari ketertarikan sederhana — mengedit video pertama kali menggunakan Windows Movie Maker saat masih duduk di bangku SMP. Dari situ saya menyadari betapa menariknya mengubah rangkaian klip menjadi sebuah cerita yang punya dampak emosional.",
    "Ketertarikan itu kemudian berkembang ke desain grafis, dan berlanjut ke dunia pemrograman. Saya percaya bahwa hasil kerja yang baik tidak selalu perlu rumit — yang terpenting tujuannya jelas, eksekusinya rapi, dan selalu mempertimbangkan perspektif audiens.",
    "Saya dikenal sebagai seseorang yang detail namun tetap komunikatif. Jika Anda mencari rekan kerja yang mengutamakan kualitas sekaligus mudah berkolaborasi, saya yakin kita bisa bekerja sama dengan baik.",
  ],
  stats: [
    { value: "3+", label: "tahun pengalaman" },
    { value: "50+", label: "proyek selesai" },
    { value: "20+", label: "klien puas" },
  ],
  photo: "/portfolio/profile.jpeg",
};

export const skillGroups = [
  { title: "Video Editing", description: "Mengolah footage mentah menjadi sebuah cerita yang terstruktur dan memiliki ritme. Menangani proses cutting, color grading, motion graphic, hingga sound design.", tools: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Final Cut Pro"] },
  { title: "Graphic Design", description: "Visual yang mampu menyampaikan pesan dengan jelas — mulai dari logo, konten media sosial, presentasi, hingga identitas brand.", tools: ["Photoshop", "Illustrator", "Figma", "Canva Pro"] },
  { title: "Programming", description: "Membangun website, landing page, maupun aplikasi web yang dirancang untuk menyelesaikan masalah secara efektif.", tools: ["HTML / CSS / JS", "React / Next.js", "Python", "Node.js"] },
];

export const services = [
  { title: "Video Editing & Post-Production", description: "Mengelola footage mentah dari tahap awal hingga menghasilkan video siap publikasi, termasuk color grading, animasi teks, dan mixing audio.", items: ["YouTube content & vlog", "Iklan & company profile", "Wedding & event video", "Short-form: Reels, TikTok, Shorts"] },
  { title: "Desain Grafis & Branding", description: "Dari logo sederhana hingga identitas brand yang utuh, dengan elemen visual yang konsisten dan mudah dikenali audiens.", items: ["Logo & brand guidelines", "Social media content", "Poster, banner, flyer", "Desain presentasi & pitch deck"] },
  { title: "Website & Web App", description: "Menangani proses pembuatan website dari perancangan hingga deployment, termasuk implementasi desain Figma.", items: ["Landing page & portfolio", "Company profile website", "E-commerce & toko online", "Internal tools & dashboard"] },
];

export const contact = {
  email: profile.email,
  location: profile.location,
  responseTime: "Respon dalam 1–2 hari kerja",
  socials: [
    { name: "GitHub", href: "https://github.com/FRDKUNZ" },
    { name: "YouTube", href: "https://www.youtube.com/@ferkun7568" },
    { name: "Instagram", href: "https://www.instagram.com/frdkunz/" },
  ],
  emailJs: {
    publicKey: "8cVI6XThFvpTZXV4b",
    serviceId: "service_hvjyjor",
    templateId: "template_2g678rz",
  },
};
