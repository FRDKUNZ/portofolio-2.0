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

const image = (name: string, caption: string, fit: ProjectMedia["fit"] = "cover"): ProjectMedia => ({ type: "image", src: `/portfolio/images/${name.replace(/\.(png|jpe?g|webp)$/i, ".webp")}`, caption, fit });
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
    media: [image("workout_web.png", "Thumbnail aplikasi nutrition tracker dengan tampilan mobile-first dan fokus ke data harian.", "cover")],
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
  {
    id: "bank-bjb-siskeudes-video",
    title: { id: "Video Pengenalan Siskeudes", en: "Siskeudes Introduction Video" },
    description: { id: "Video pengenalan aplikasi Sistem Keuangan Desa (Siskeudes) untuk Bank BJB dan Pemkab Tangerang, dikerjakan dengan deadline yang sangat singkat.", en: "An introduction video for the Village Financial System (Siskeudes) app for Bank BJB and the Tangerang Regency Government, delivered under a very tight deadline." },
    category: "video", year: "2023", tags: ["After Effects", "Motion Graphic", "Client Project"],
    media: [image("bank-bjb-1.png", "Frame utama video pengenalan aplikasi Siskeudes untuk Bank BJB dan Pemkab Tangerang."), image("bank-bjb-2.png", "Visual pendukung yang menampilkan alur dan fitur aplikasi Siskeudes.")],
  },
  {
    id: "nahda-skincare-anniversary",
    title: { id: "Backdrop Video Nahda Skincare", en: "Nahda Skincare Anniversary Backdrop" },
    description: { id: "Backdrop video untuk perayaan anniversary ke-3 Nahda Skincare, mencakup rangkaian tema dari pembukaan hingga penutupan acara.", en: "Video backdrop for Nahda Skincare's 3rd anniversary, covering themed visuals from the opening to the closing of the event." },
    category: "video", year: "2023", tags: ["Video Backdrop", "Motion Graphic", "Event"],
    media: [image("nahda-1.png", "Tampilan backdrop video pada rangkaian acara anniversary Nahda Skincare."), image("nahda-2.png", "Visual pendukung suasana perayaan anniversary ke-3 Nahda Skincare.")],
  },
  {
    id: "tangerang-network-news-design",
    title: { id: "Desain Berita Tangerang Network", en: "Tangerang Network News Design" },
    description: { id: "Desain thumbnail dan konten visual berita online untuk Tangerang Network, dibuat agar informatif dan mudah dipahami pembaca.", en: "News thumbnail and visual content design for Tangerang Network, built to be informative and easy for readers to understand." },
    category: "design", year: "2022", tags: ["Photoshop", "Social Media", "News Design"],
    media: [image("tangerang-network-1.png", "Desain konten berita mengenai cara cek penerima BLT BBM."), image("tangerang-network-2.png", "Desain berita rekrutmen PPK dan forum PNLG 2022."), image("tangerang-network-3.png", "Desain berita olahraga bertema Piala Dunia."), image("tangerang-network-4.png", "Desain berita investigasi bertema mobil desa.")],
  },
  {
    id: "rajana-printing-design",
    title: { id: "Desain Percetakan Rajana Printing", en: "Rajana Printing Design" },
    description: { id: "Materi cetak berkualitas tinggi untuk berbagai klien Rajana Printing, mulai dari spanduk, mug, hingga banner promosi.", en: "High-quality print materials for Rajana Printing's clients, from banners and mugs to promotional signage." },
    category: "design", year: "2023", tags: ["Print Design", "Social Media", "Branding"],
    media: [image("rajana-printing-1.png", "Banner promo es krim dengan penawaran topping gratis."), image("rajana-printing-2.png", "Banner layanan kesehatan ibu dan anak untuk klien percetakan."), image("rajana-printing-3.png", "Desain spanduk Rajana Printing dengan informasi layanan dan kontak."), image("rajana-printing-4.png", "Desain promosi cetak mug keramik digital."), image("rajana-printing-5.png", "Desain spanduk perayaan HUT RI ke-78.")],
  },
  {
    id: "adat-food-branding",
    title: { id: "Brand Adat Food", en: "Adat Food Brand" },
    description: { id: "Proyek brand makanan tradisional khas Tangerang, mencakup logo, poster, dan packaging sebagai tugas akhir sekolah.", en: "A traditional Tangerang food brand project covering logo, poster, and packaging as a school final assignment." },
    category: "design", year: "2023", tags: ["Branding", "Packaging", "Poster"],
    media: [image("adat-food-1.png", "Poster produk kue cucur dengan visual hangat dan menggugah selera."), image("adat-food-2.png", "Poster penjelasan kue tradisional Betawi sebagai bagian dari brand Adat Food.")],
  },
];

export type FeaturedProject = { projectId: string; title: [string, string] };

export const featuredProjects: FeaturedProject[] = [
  { projectId: "akuma-apparel-branding", title: ["AKUMA", "APPAREL."] },
  { projectId: "mamaroz-hazelnut-promo", title: ["MAMAROZ", "HAZELNUT."] },
  { projectId: "gusion-motion-edit", title: ["GUSION", "MOTION."] },
  { projectId: "workout-web-project", title: ["WORKOUT", "WEB."] },
];

export const filters = [
  { id: "All", label: "Semua" },
  { id: "video", label: "Video" },
  { id: "design", label: "Desain" },
  { id: "code", label: "Pemrograman" },
] as const;
