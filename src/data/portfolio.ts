export type ProjectCategory = "design" | "video" | "code";
export type ProjectMedia = { type: "image" | "video"; src: string; caption: string; fit?: "cover" | "contain" };
export type Project = {
  id: string;
  title: { id: string; en: string };
  description: { id: string; en: string };
  category: ProjectCategory;
  year: string;
  tags: string[];
  media: ProjectMedia[];
  link?: string;
};

const image = (name: string, caption: string, fit: ProjectMedia["fit"] = "cover"): ProjectMedia => ({ type: "image", src: `/portfolio/images/${name}`, caption, fit });
const video = (name: string, caption: string, fit: ProjectMedia["fit"] = "cover"): ProjectMedia => ({ type: "video", src: `/portfolio/videos/${name}`, caption, fit });

// Project facts, media, and links are transcribed from the supplied repository's data/projects.js.
export const projects: Project[] = [
  {
    id: "mamaroz-hazelnut-promo",
    title: { id: "Promosi Mamaroz Hazelnut", en: "Mamaroz Hazelnut Promotion" },
    description: { id: "Visual promosi produk minuman almond dan hazelnut dengan nuansa fresh, natural, dan premium.", en: "Promotional visuals for an almond and hazelnut drink with a fresh, natural, and premium feel." },
    category: "design", year: "2024", tags: ["Photoshop", "Branding", "Product Promo"],
    media: [image("mamaroz1.webp", "Hero poster dengan fokus pada botol produk dan suasana alam yang segar."), image("mamaroz2.webp", "Tampilan detail produk untuk menonjolkan label dan komposisi hazelnut."), image("mamaroz3.webp", "Versi promosi dengan komposisi lebih luas untuk kebutuhan feed dan campaign.")],
  },
  {
    id: "akuma-apparel-branding",
    title: { id: "Branding Kaos Akuma", en: "Akuma Apparel Branding" },
    description: { id: "Desain kaos apparel bergaya streetwear dengan identitas visual yang kuat dan kontras tegas.", en: "Streetwear-style apparel tee design with strong visual identity and bold contrast." },
    category: "design", year: "2024", tags: ["Illustrator", "Mockup", "Merchandise"],
    media: [image("kaos-1.jpg", "Mockup utama kaos Akuma dengan visual logo besar di bagian depan."), image("kaos-2.jpg", "Varian warna hitam untuk kebutuhan merchandise dan katalog produk."), image("kaos-3.jpg", "Varian putih dengan komposisi artwork yang lebih clean dan minimal."), video("ads-azure.mp4", "Versi motion ad untuk distribusi di reels atau iklan pendek.")],
  },
  {
    id: "bmw-m3-poster-series",
    title: { id: "BMW M3 Poster Series", en: "BMW M3 Poster Series" },
    description: { id: "Poster otomotif bernuansa agresif untuk menonjolkan kesan performa, detail mobil, dan energi visual.", en: "Aggressive automotive poster design highlighting performance, car details, and visual energy." },
    category: "design", year: "2025", tags: ["Photoshop", "Composite", "Poster Design"],
    media: [image("car1.webp", "Layout utama poster BMW M3 dengan komposisi mobil dan headline besar."), image("car2.webp", "Versi close-up yang menonjolkan roda, body kit, dan detail agresif kendaraan.")],
  },
  {
    id: "healthy-cream-campaign",
    title: { id: "Kampanye Healthy Cream", en: "Healthy Cream Campaign" },
    description: { id: "Iklan promosi untuk varian ice cream dengan visual cerah, playful, dan fokus ke promo penjualan.", en: "Promotional ad for an ice cream variant with bright, playful visuals and a sales-focused message." },
    category: "design", year: "2024", tags: ["Poster", "Campaign", "Social Media"],
    media: [image("es-cream-1.png", "Poster promo utama dengan headline besar dan showcase tiga varian produk.", "contain"), image("es-cream-2.png", "Versi promo diskon yang menonjolkan penawaran 30% untuk campaign penjualan.", "contain")],
  },
  {
    id: "gusion-motion-edit",
    title: { id: "Gusion Motion Edit", en: "Gusion Motion Edit" },
    description: { id: "Visual edit bertema game dengan nuansa biru neon, motion intens, dan energi hero shot.", en: "Game-themed visual edit with neon blue tones, intense motion, and hero-shot energy." },
    category: "video", year: "2025", tags: ["After Effects", "Motion", "Gaming Edit"],
    media: [image("gs.png", "Poster hero untuk menampilkan karakter utama dengan gaya cinematic."), video("gusion-edt.mp4", "Versi motion edit untuk memperlihatkan transisi dan ritme visual.")],
  },
  {
    id: "tyler-cinematic-portrait",
    title: { id: "Tyler Cinematic Portrait", en: "Tyler Cinematic Portrait" },
    description: { id: "Potret sinematik dengan tone gelap dan nuansa urban yang lebih personal.", en: "Cinematic portrait with dark tones and a more personal urban mood." },
    category: "video", year: "2025", tags: ["Color Grading", "Cinematic", "Portrait Edit"],
    media: [image("tyler.jpg", "Potret utama dengan fokus pada ekspresi wajah dan mood gelap."), video("tyler.mp4", "Versi video dengan grading yang lebih dramatis dan fokus pada ekspresi wajah.")],
  },
  {
    id: "workout-web-project",
    title: { id: "Workout Web Project", en: "Workout Web Project" },
    description: { id: "Aplikasi web nutrition tracker dengan tampilan bersih, fokus ke pengalaman pengguna, dan navigasi yang sederhana.", en: "A nutrition tracker web app with a clean interface, user-focused experience, and simple navigation." },
    category: "code", year: "2025", tags: ["Next.js", "Responsive UI", "Web App"],
    media: [image("workout_web.png", "Thumbnail aplikasi nutrition tracker dengan tampilan mobile-first dan fokus ke data harian.")],
    link: "https://web-workout-project.vercel.app",
  },
  {
    id: "azure-store",
    title: { id: "Azure Store", en: "Azure Store" },
    description: { id: "Website toko online dengan layout modern, ringkas, dan siap dipakai untuk showcase produk custom.", en: "An online store website with a modern, concise layout ready for custom product showcase." },
    category: "code", year: "2025", tags: ["Frontend", "E-commerce", "Vercel"],
    media: [image("azure_web.png", "Thumbnail Azure Store yang menampilkan hero section dan katalog produk.")],
    link: "https://azure-store-two.vercel.app/",
  },
];

export const filters = [
  { id: "All", label: "Semua" },
  { id: "video", label: "Video" },
  { id: "design", label: "Desain" },
  { id: "code", label: "Pemrograman" },
] as const;
